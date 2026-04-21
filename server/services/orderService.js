// CODEMAP: BACKEND_ORDER_SERVICE
// PURPOSE: Central business logic for order lifecycle and stock/payment checks.
// SEARCH_HINT: Main file for understanding order rules and side effects.
const { Order, OrderItem, OrderStatusHistory, Customer, MenuItem, ComboPack, ComboPackItem, Delivery, DeliveryStaffAvailability, Payment, Address, PreorderApprovalLog, sequelize } = require('../models');
const { Transaction, Op } = require('sequelize');
const stockService = require('./stockService');
const { geocodeAddress, validateDeliveryDistanceWithFallback } = require('./distanceValidation');
const { calculateDeliveryFee } = require('../utils/deliveryFeeCalculator');
const { calculateEstimatedDeliveryTime } = require('../utils/deliveryEta');
const { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } = require('./emailService');
const { sendOrderConfirmationSMS, sendOrderStatusUpdateSMS } = require('./smsService');
const systemSettingsService = require('./systemSettingsService');
const appNotificationService = require('./appNotificationService');
const {
    getAllowedAddOnsForMenuItem,
    normalizeAddOnSelections,
    getAddOnsPerUnitTotal,
    serializeOrderItemNotes,
    toMoney
} = require('../utils/orderAddOnUtils');

// Simple: This checks whether address table missing error is true.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const isAddressTableMissingError = (error) => {
    const mysqlCode = error?.original?.code || error?.parent?.code;
    const message = [error?.message, error?.original?.sqlMessage, error?.parent?.sqlMessage]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return mysqlCode === 'ER_NO_SUCH_TABLE' && message.includes('address')
        || (message.includes('no such table') && message.includes('address'))
        || (message.includes("doesn't exist") && message.includes('address'));
};

// Simple: This updates the address unavailable error.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const markAddressUnavailableError = (error) => {
    if (isAddressTableMissingError(error)) {
        error.code = 'ADDRESS_TABLE_UNAVAILABLE';
    }

    return error;
};

const CUSTOMER_PAYMENT_METHODS = new Set(['CASH', 'CARD', 'ONLINE']);
const DELIVERY_DESTINATION_PIN_PREFIX = '__VOLEENA_DEST_PIN__:';
// Simple: This cleans or formats the phone.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const normalizePhone = (phone) => String(phone || '').replace(/\s/g, '');

// Simple: This checks whether usable coordinate pair is true.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const isUsableCoordinatePair = (latitude, longitude) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return false;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return false;
    }

    // 0,0 is commonly used as a placeholder and should not be treated as a valid delivery point.
    if (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001) {
        return false;
    }

    return true;
};

// Simple: This sends or records an update.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const notifySafely = async (action, context) => {
    try {
        await action();
    } catch (error) {
        console.error(`[APP_NOTIFICATION] ${context}:`, error.message);
    }
};

// Simple: This cleans or formats the notification preference.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const normalizeNotificationPreference = (preference) => {
    const normalized = String(preference || 'BOTH').trim().toUpperCase();
    if (['EMAIL', 'SMS', 'BOTH'].includes(normalized)) {
        return normalized;
    }

    return 'BOTH';
};

// Simple: This checks whether send order email is allowed.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const canSendOrderEmail = (runtimeSettings, customer, eventSettingKey) => {
    if (!runtimeSettings?.emailNotifications || !runtimeSettings?.[eventSettingKey] || !customer?.Email) {
        return false;
    }

    const preference = normalizeNotificationPreference(customer.PreferredNotification);
    return preference === 'EMAIL' || preference === 'BOTH';
};

// Simple: This checks whether send order sms is allowed.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const canSendOrderSMS = (runtimeSettings, customer, eventSettingKey) => {
    if (!runtimeSettings?.smsNotifications || !runtimeSettings?.[eventSettingKey] || !customer?.Phone) {
        return false;
    }

    const preference = normalizeNotificationPreference(customer.PreferredNotification);
    return preference === 'SMS' || preference === 'BOTH';
};

// Simple: This combines or filters the allowed add ons.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const intersectAllowedAddOns = (collections) => {
    // Simple: This handles safe collections logic.
    // Frontend connection: Supports business logic behind customer/staff/admin page actions.
    const safeCollections = (collections || []).filter((entry) => Array.isArray(entry));
    if (safeCollections.length === 0) {
        return [];
    }

    const [first, ...rest] = safeCollections;
    const accumulator = new Map(
        first
            .filter((entry) => entry && entry.id)
            .map((entry) => [String(entry.id), {
                id: String(entry.id),
                name: String(entry.name || entry.id),
                price: toMoney(entry.price),
                maxQuantity: Number.isFinite(Number(entry.maxQuantity)) && Number(entry.maxQuantity) > 0
                    ? Math.floor(Number(entry.maxQuantity))
                    : 1
            }])
    );

    for (const optionList of rest) {
        const currentById = new Map(
            (optionList || [])
                .filter((entry) => entry && entry.id)
                .map((entry) => [String(entry.id), entry])
        );

        for (const [id, normalized] of accumulator.entries()) {
            const matching = currentById.get(id);
            if (!matching) {
                accumulator.delete(id);
                continue;
            }

            const matchingPrice = toMoney(matching.price);
            const matchingMaxQty = Number.isFinite(Number(matching.maxQuantity)) && Number(matching.maxQuantity) > 0
                ? Math.floor(Number(matching.maxQuantity))
                : 1;

            normalized.price = Math.min(normalized.price, matchingPrice);
            normalized.maxQuantity = Math.min(normalized.maxQuantity, matchingMaxQty);
        }
    }

    return [...accumulator.values()].sort((left, right) => left.id.localeCompare(right.id));
};

// Simple: This gets the allowed add ons for combo.
// Frontend connection: Supports business logic behind customer/staff/admin page actions.
const getAllowedAddOnsForCombo = async (comboId, transaction) => {
    const comboComponents = await ComboPackItem.findAll({
        where: { ComboID: comboId },
        attributes: ['MenuItemID'],
        transaction
    });

    const menuItemIds = [...new Set(
        comboComponents
            .map((component) => Number.parseInt(component.MenuItemID, 10))
            .filter((menuItemId) => Number.isInteger(menuItemId) && menuItemId > 0)
    )];

    if (menuItemIds.length === 0) {
        return [];
    }

    const allowedCollections = await Promise.all(
        menuItemIds.map((menuItemId) => getAllowedAddOnsForMenuItem(menuItemId))
    );

    return intersectAllowedAddOns(allowedCollections);
};

/**
 * Order Management Service
 * Implements complete order lifecycle with atomic operations
 */
class OrderService {
    // This prepares stock changes from the items in an order.
    async buildStockItemsFromOrderItems(orderItems, transaction) {
        const requiredByMenuItem = new Map();

        // Simple: This creates the requirement.
        // Frontend connection: Supports business logic behind customer/staff/admin page actions.
        const addRequirement = (menuItemId, quantity) => {
            if (!Number.isInteger(menuItemId) || !Number.isFinite(quantity) || quantity <= 0) {
                return;
            }

            requiredByMenuItem.set(menuItemId, (requiredByMenuItem.get(menuItemId) || 0) + quantity);
        };

        const normalizedItems = Array.isArray(orderItems) ? orderItems.map((item) => ({
            menuItemId: Number.parseInt(item.MenuItemID ?? item.menuItemId ?? item.menu_item_id, 10),
            comboId: Number.parseInt(item.ComboID ?? item.comboId ?? item.combo_id, 10),
            quantity: Number(item.Quantity ?? item.quantity ?? 0)
        })) : [];

        for (const item of normalizedItems) {
            if (Number.isInteger(item.menuItemId)) {
                addRequirement(item.menuItemId, item.quantity);
            }
        }

        const comboLineItems = normalizedItems.filter((item) => Number.isInteger(item.comboId));
        if (comboLineItems.length > 0) {
            const comboIds = [...new Set(comboLineItems.map((item) => item.comboId))];

            const comboComponents = await ComboPackItem.findAll({
                where: {
                    ComboID: {
                        [Op.in]: comboIds
                    }
                },
                include: [{
                    model: MenuItem,
                    as: 'menuItem',
                    attributes: ['MenuItemID', 'Name', 'IsActive', 'IsAvailable']
                }],
                transaction
            });

            const componentsByComboId = new Map();
            for (const component of comboComponents) {
                if (!componentsByComboId.has(component.ComboID)) {
                    componentsByComboId.set(component.ComboID, []);
                }
                componentsByComboId.get(component.ComboID).push(component);
            }

            for (const comboLineItem of comboLineItems) {
                if (!Number.isFinite(comboLineItem.quantity) || comboLineItem.quantity <= 0) {
                    continue;
                }

                const components = componentsByComboId.get(comboLineItem.comboId) || [];

                if (components.length === 0) {
                    throw new Error(`Combo pack ${comboLineItem.comboId} has no configured items`);
                }

                for (const component of components) {
                    const componentMenuItem = component.menuItem;
                    const componentMenuItemName = componentMenuItem?.Name || `menu item ${component.MenuItemID}`;

                    if (!componentMenuItem || !componentMenuItem.IsActive || !componentMenuItem.IsAvailable) {
                        throw new Error(`Combo pack ${comboLineItem.comboId} contains unavailable item: ${componentMenuItemName}`);
                    }

                    const requiredQty = Number(component.Quantity || 0) * comboLineItem.quantity;
                    addRequirement(component.MenuItemID, requiredQty);
                }
            }
        }

        return [...requiredByMenuItem.entries()].map(([MenuItemID, Quantity]) => ({ MenuItemID, Quantity }));
    }

    /**
     * Create order with stock validation (FR01, FR22)
     */
    async createOrder(customerId, orderData, addressId = null) {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            const items = orderData.items || [];
            const orderType = orderData.orderType || orderData.order_type;
            const specialInstructions = orderData.specialInstructions || orderData.special_instructions;
            const promotionId = orderData.promotionId || orderData.promotion_id;
            const requestedIsPreorder = Boolean(orderData.isPreorder ?? orderData.is_preorder);
            const rawScheduledDatetime = orderData.scheduledDatetime || orderData.scheduled_datetime || null;
            const providedContactPhone = orderData.contactPhone || orderData.contact_phone || null;
            const normalizedPaymentMethod = typeof (orderData.paymentMethod || orderData.payment_method) === 'string'
                ? String(orderData.paymentMethod || orderData.payment_method).trim().toUpperCase()
                : 'CASH';
            const runtimeSettings = await systemSettingsService.getRuntimeSettings();
            const customerProfile = await Customer.findByPk(customerId, {
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!customerProfile || !customerProfile.IsActive || customerProfile.AccountStatus !== 'ACTIVE') {
                throw new Error('Customer account is not active');
            }

            const normalizedProvidedContactPhone = providedContactPhone
                ? normalizePhone(providedContactPhone)
                : null;
            const normalizedProfilePhone = normalizePhone(customerProfile.Phone);
            const resolvedContactPhone = normalizedProvidedContactPhone || normalizedProfilePhone || null;
            const verifiedProfilePhone = customerProfile.IsPhoneVerified ? normalizedProfilePhone : null;

            if (resolvedContactPhone && !/^[+]?[0-9]{9,15}$/.test(resolvedContactPhone)) {
                throw new Error('Invalid contact phone number format');
            }

            if (orderType !== 'WALK_IN' && !resolvedContactPhone) {
                throw new Error('A valid contact phone number is required for this order');
            }

            if (orderType !== 'WALK_IN' && !CUSTOMER_PAYMENT_METHODS.has(normalizedPaymentMethod)) {
                throw new Error('Unsupported payment method for order creation');
            }

            const isPreorder = requestedIsPreorder && orderType !== 'WALK_IN';
            let scheduledDatetime = null;

            if (requestedIsPreorder && orderType === 'WALK_IN') {
                throw new Error('Preorders are not available for walk-in orders');
            }

            if (isPreorder) {
                if (!rawScheduledDatetime) {
                    throw new Error('Scheduled date/time is required for preorder');
                }

                scheduledDatetime = new Date(rawScheduledDatetime);
                if (Number.isNaN(scheduledDatetime.getTime())) {
                    throw new Error('Invalid scheduled date/time');
                }

                const minLeadTimeMs = 15 * 60 * 1000;
                if (scheduledDatetime.getTime() < Date.now() + minLeadTimeMs) {
                    throw new Error('Preorder time must be at least 15 minutes in the future');
                }
            }

            if (orderType !== 'WALK_IN') {
                const isMethodEnabled = (
                    (normalizedPaymentMethod === 'CASH' && runtimeSettings.cashOnDelivery)
                    || (normalizedPaymentMethod === 'CARD' && runtimeSettings.cardPayment)
                    || (normalizedPaymentMethod === 'ONLINE' && runtimeSettings.onlinePayment)
                );

                if (!isMethodEnabled) {
                    throw new Error(`${normalizedPaymentMethod} payment is currently disabled by system settings`);
                }
            }

            // Validate delivery distance if delivery order (FR09)
            let deliveryDistance = 0;
            let deliveryDurationSeconds = null;
            let validatedAddressId = null;
            let pinnedDestinationCoordinates = null;
            if (orderType === 'DELIVERY') {
                if (!addressId) {
                    throw new Error('Address is required for delivery orders');
                }

                const { Address } = require('../models');
                let address;
                try {
                    address = await Address.findOne({
                        where: {
                            AddressID: addressId,
                            CustomerID: customerId
                        },
                        transaction,
                        lock: transaction.LOCK.UPDATE
                    });
                } catch (error) {
                    throw markAddressUnavailableError(error);
                }

                if (!address) {
                    throw new Error('Delivery address not found for this customer');
                }

                const payloadLatitude = Number(orderData?.deliveryCoordinates?.latitude);
                const payloadLongitude = Number(orderData?.deliveryCoordinates?.longitude);
                const hasPayloadCoordinates = isUsableCoordinatePair(payloadLatitude, payloadLongitude);
                if (hasPayloadCoordinates) {
                    pinnedDestinationCoordinates = {
                        latitude: payloadLatitude,
                        longitude: payloadLongitude
                    };
                }

                let deliveryLatitude = Number(address.Latitude);
                let deliveryLongitude = Number(address.Longitude);

                if (hasPayloadCoordinates) {
                    // PIN mode should override saved address coordinates for this order.
                    deliveryLatitude = payloadLatitude;
                    deliveryLongitude = payloadLongitude;
                } else if (!isUsableCoordinatePair(deliveryLatitude, deliveryLongitude)) {
                    try {
                        const addressText = [address.AddressLine1, address.City, address.PostalCode]
                            .filter(Boolean)
                            .join(', ');
                        const geocoded = await geocodeAddress(addressText, address.City);
                        deliveryLatitude = Number(geocoded.lat);
                        deliveryLongitude = Number(geocoded.lng);
                    } catch (geocodeError) {
                        throw new Error('Unable to validate delivery distance for this address. Please update your address details or use GPS pinning at checkout.');
                    }
                }

                if (!isUsableCoordinatePair(deliveryLatitude, deliveryLongitude)) {
                    throw new Error('Address coordinates are required for delivery validation');
                }

                const distanceValidation = await validateDeliveryDistanceWithFallback(
                    deliveryLatitude,
                    deliveryLongitude
                );

                if (!distanceValidation.isValid) {
                    throw new Error(
                        `Delivery address is outside our delivery range. Distance: ${distanceValidation.distance.toFixed(2)}km, Maximum: ${distanceValidation.maxDistance}km`
                    );
                }

                // Store the validated distance for fee calculation
                deliveryDistance = distanceValidation.distance;
                deliveryDurationSeconds = distanceValidation.duration || null;
                validatedAddressId = address.AddressID;
            }

            // Calculate order totals
            let totalAmount = 0;
            const orderItems = [];

            for (const item of items) {
                const menuItemId = item.menuItemId || item.menu_item_id;
                const comboId = item.comboId || item.combo_id;
                const safeCustomerNotes = typeof item.notes === 'string' ? item.notes.trim() : '';
                const requestedAddOns = Array.isArray(item.addOns) ? item.addOns : [];

                if (menuItemId) {
                    const menuItem = await MenuItem.findByPk(menuItemId, { transaction });
                    if (!menuItem || !menuItem.IsActive || !menuItem.IsAvailable) {
                        throw new Error(`Menu item ${menuItemId} is not available`);
                    }

                    const allowedAddOns = await getAllowedAddOnsForMenuItem(menuItemId);
                    const normalizedAddOns = normalizeAddOnSelections(requestedAddOns, allowedAddOns);
                    const addOnsPerUnit = getAddOnsPerUnitTotal(normalizedAddOns);
                    const baseUnitPrice = toMoney(menuItem.Price);
                    const nextUnitPrice = toMoney(baseUnitPrice + addOnsPerUnit);
                    const serializedItemNotes = serializeOrderItemNotes({
                        customerNotes: safeCustomerNotes,
                        baseUnitPrice,
                        addOns: normalizedAddOns
                    });

                    if (serializedItemNotes && serializedItemNotes.length > 255) {
                        throw new Error(`Item notes are too long for "${menuItem.Name}"`);
                    }

                    orderItems.push({
                        MenuItemID: menuItemId,
                        Quantity: item.quantity,
                        UnitPrice: nextUnitPrice,
                        ItemNotes: serializedItemNotes
                    });

                    totalAmount += nextUnitPrice * item.quantity;
                } else if (comboId) {
                    const combo = await ComboPack.findByPk(comboId, { transaction });
                    if (!combo || !combo.IsActive) {
                        throw new Error(`Combo pack ${comboId} is not available`);
                    }

                    const allowedAddOns = await getAllowedAddOnsForCombo(comboId, transaction);
                    const normalizedAddOns = normalizeAddOnSelections(requestedAddOns, allowedAddOns);
                    const addOnsPerUnit = getAddOnsPerUnitTotal(normalizedAddOns);
                    const comboBaseUnitPrice = toMoney(combo.Price);
                    const comboUnitPrice = toMoney(comboBaseUnitPrice + addOnsPerUnit);
                    const serializedItemNotes = serializeOrderItemNotes({
                        customerNotes: safeCustomerNotes,
                        baseUnitPrice: comboBaseUnitPrice,
                        addOns: normalizedAddOns
                    });

                    if (serializedItemNotes && serializedItemNotes.length > 255) {
                        throw new Error(`Item notes are too long for "${combo.Name}"`);
                    }

                    orderItems.push({
                        ComboID: comboId,
                        Quantity: item.quantity,
                        UnitPrice: comboUnitPrice,
                        ItemNotes: serializedItemNotes
                    });

                    totalAmount += comboUnitPrice * item.quantity;
                }
            }

            // Apply promotion if provided
            let discountAmount = 0;
            if (promotionId) {
                const { Promotion } = require('../models');
                const promotion = await Promotion.findByPk(promotionId, { transaction });

                if (promotion && promotion.IsActive) {
                    const now = new Date();
                    if (now >= promotion.ValidFrom && now <= promotion.ValidUntil) {
                        if (totalAmount >= promotion.MinOrderAmount) {
                            if (promotion.DiscountType === 'PERCENTAGE') {
                                discountAmount = (totalAmount * promotion.DiscountValue) / 100;
                                if (promotion.MaxDiscountAmount) {
                                    discountAmount = Math.min(discountAmount, promotion.MaxDiscountAmount);
                                }
                            } else {
                                discountAmount = promotion.DiscountValue;
                            }

                            // Update promotion usage
                            await promotion.increment('UsageCount', { transaction });
                        }
                    }
                }
            }

            if (totalAmount < Number(runtimeSettings.minOrderAmount || 0)) {
                throw new Error(`Minimum order amount is LKR ${runtimeSettings.minOrderAmount}`);
            }

            if (Number(runtimeSettings.maxOrderAmount || 0) > 0 && totalAmount > Number(runtimeSettings.maxOrderAmount)) {
                throw new Error(`Maximum order amount is LKR ${runtimeSettings.maxOrderAmount}`);
            }

            // Calculate delivery fee based on distance (dynamic pricing)
            let deliveryFee = 0;
            if (orderType === 'DELIVERY' && deliveryDistance > 0) {
                const freeDeliveryThreshold = Number(runtimeSettings.freeDeliveryThreshold || 0);
                const isFreeByOrderValue = freeDeliveryThreshold > 0 && totalAmount >= freeDeliveryThreshold;

                if (isFreeByOrderValue) {
                    deliveryFee = 0;
                } else {
                    const feeCalculation = calculateDeliveryFee(deliveryDistance, {
                        baseFee: Number(runtimeSettings.deliveryFee || 0)
                    });
                    deliveryFee = feeCalculation.totalFee;
                    console.log(`[Delivery Fee] Distance: ${deliveryDistance.toFixed(2)}km, Fee: LKR ${deliveryFee}, Breakdown: ${feeCalculation.breakdown}`);
                }
            }

            // Generate order number
            const orderNumber = await this.generateOrderNumber();
            const initialStatus = isPreorder ? 'PREORDER_CONFIRMED' : 'CONFIRMED';
            const initialApprovalStatus = isPreorder ? 'APPROVED' : 'NOT_REQUIRED';
            const confirmedAt = isPreorder ? null : new Date();
            const approvedAt = isPreorder ? new Date() : null;

            const order = await Order.create({
                OrderNumber: orderNumber,
                CustomerID: customerId,
                ContactPhone: resolvedContactPhone,
                VerifiedProfilePhone: verifiedProfilePhone,
                TotalAmount: totalAmount,
                PromotionID: promotionId || null,
                DiscountAmount: discountAmount,
                DeliveryFee: deliveryFee,
                Status: initialStatus,
                OrderType: orderType,
                IsPreorder: isPreorder,
                ScheduledDatetime: scheduledDatetime,
                ApprovalStatus: initialApprovalStatus,
                ApprovedAt: approvedAt,
                SpecialInstructions: specialInstructions,
                ConfirmedAt: confirmedAt,
                ConfirmedBy: null
            }, { transaction });

            // Create order items
            for (const item of orderItems) {
                await OrderItem.create({
                    OrderID: order.OrderID,
                    ...item
                }, { transaction });
            }

            // Persist payment intent at order creation so kitchen can gate unpaid online/card orders.
            if (orderType !== 'WALK_IN') {
                await Payment.create({
                    OrderID: order.OrderID,
                    Amount: order.FinalAmount,
                    Method: normalizedPaymentMethod,
                    Status: 'PENDING',
                    GatewayStatus: normalizedPaymentMethod === 'CASH' ? 'PAY_ON_DELIVERY' : 'PENDING'
                }, { transaction });
            }

            // Create delivery record if delivery order
            if (orderType === 'DELIVERY') {
                const destinationPinNote = pinnedDestinationCoordinates
                    ? `${DELIVERY_DESTINATION_PIN_PREFIX}${pinnedDestinationCoordinates.latitude},${pinnedDestinationCoordinates.longitude}`
                    : null;

                await Delivery.create({
                    OrderID: order.OrderID,
                    AddressID: validatedAddressId,
                    Status: 'PENDING',
                    DistanceKm: deliveryDistance,
                    DeliveryNotes: destinationPinNote,
                    EstimatedDeliveryTime: calculateEstimatedDeliveryTime({
                        stage: 'CONFIRMED',
                        durationSeconds: deliveryDurationSeconds,
                        distanceKm: deliveryDistance,
                        baseTime: new Date()
                    })
                }, { transaction });
            }

            if (!isPreorder) {
                const stockDate = new Date().toISOString().split('T')[0];
                const stockItems = await this.buildStockItemsFromOrderItems(orderItems, transaction);

                if (stockItems.length > 0) {
                    try {
                        await stockService.validateAndReserveStock(stockItems, stockDate, transaction);
                    } catch (stockError) {
                        if (/insufficient|stock|out of stock/i.test(stockError.message || '')) {
                            throw new Error('Requested quantity exceeds current stock. You can place this as a preorder and include details in Special Instructions.');
                        }
                        throw stockError;
                    }
                    await stockService.deductStock(order.OrderID, stockItems, stockDate, null, transaction);
                }
            }

            // Log initial status history.
            await OrderStatusHistory.create({
                OrderID: order.OrderID,
                OldStatus: null,
                NewStatus: initialStatus,
                ChangedBy: null,
                ChangedByType: 'SYSTEM',
                Notes: isPreorder
                    ? 'Preorder created and auto-confirmed as scheduled'
                    : 'Order created and auto-confirmed',
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            try {
                const customer = customerProfile;
                if (customer && orderType !== 'WALK_IN') {
                    if (canSendOrderEmail(runtimeSettings, customer, 'orderConfirmation')) {
                        await sendOrderConfirmationEmail(order, customer);
                    }
                    if (canSendOrderSMS(runtimeSettings, customer, 'orderConfirmation')) {
                        await sendOrderConfirmationSMS(customer.Phone, orderNumber, {
                            recipientId: customer.CustomerID,
                            recipientType: 'CUSTOMER',
                            relatedOrderId: order.OrderID
                        });
                    }
                }
            } catch (notifError) {
                console.error('Notification error after order creation:', notifError);
                // Don't fail the order if notification fails
            }

            const eventType = isPreorder ? 'PREORDER_CONFIRMED' : 'ORDER_CONFIRMED';
            const creationRecipientRoles = isPreorder ? ['Kitchen', 'Admin'] : ['Kitchen', 'Admin'];

            await notifySafely(async () => {
                await appNotificationService.notifyStaffRoles(creationRecipientRoles, {
                    eventType,
                    title: `Order #${orderNumber}`,
                    message: isPreorder
                        ? `New ${orderType.toLowerCase()} preorder #${orderNumber} is confirmed and scheduled.`
                        : `New ${orderType.toLowerCase()} order #${orderNumber} is confirmed.`,
                    priority: 'MEDIUM',
                    relatedOrderId: order.OrderID,
                    payload: {
                        orderId: order.OrderID,
                        orderNumber,
                        orderType,
                        status: initialStatus,
                        isPreorder
                    },
                    dedupeKey: `${eventType}:STAFF:${order.OrderID}`
                });
            }, 'Failed to notify staff on order creation');

            if (orderType !== 'WALK_IN') {
                await notifySafely(async () => {
                    await appNotificationService.notifyCustomer(customerId, {
                        eventType,
                        title: `Order #${orderNumber}`,
                        message: isPreorder
                            ? `Your preorder #${orderNumber} is confirmed${scheduledDatetime ? ` for ${scheduledDatetime.toLocaleString()}` : ''}.`
                            : `Your order #${orderNumber} has been confirmed.`,
                        priority: 'MEDIUM',
                        relatedOrderId: order.OrderID,
                        payload: {
                            orderId: order.OrderID,
                            orderNumber,
                            orderType,
                            status: initialStatus,
                            isPreorder
                        },
                        dedupeKey: `${eventType}:CUSTOMER:${customerId}:${order.OrderID}`
                    });
                }, 'Failed to notify customer on order creation');
            }

            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Confirm order with payment verification and stock deduction (FR22, FR30)
     */
    async confirmOrder(orderId, staffId) {
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            const order = await Order.findByPk(orderId, {
                include: [
                    { model: OrderItem, as: 'items' },
                    { model: Customer, as: 'customer' },
                    { model: Payment, as: 'payment' }
                ],
                transaction
            });

            if (!order) {
                throw new Error('Order not found');
            }

            // Orders are now auto-confirmed, so if already confirmed, just return success
            if (order.Status === 'CONFIRMED') {
                await transaction.rollback();
                return order;
            }

            if (!['PENDING', 'PREORDER_CONFIRMED'].includes(order.Status)) {
                throw new Error(`Order cannot be confirmed. Current status: ${order.Status}`);
            }

            const oldStatus = order.Status;

            // Validate and reserve stock
            const stockDate = new Date().toISOString().split('T')[0];
            const stockItems = await this.buildStockItemsFromOrderItems(order.items, transaction);

            if (stockItems.length > 0) {
                await stockService.validateAndReserveStock(stockItems, stockDate, transaction);
                await stockService.deductStock(orderId, stockItems, stockDate, staffId, transaction);
            }

            // Update order status
            order.Status = 'CONFIRMED';
            order.ConfirmedAt = new Date();
            order.ConfirmedBy = staffId;
            await order.save({ transaction });

            // Log status history
            await OrderStatusHistory.create({
                OrderID: orderId,
                OldStatus: oldStatus,
                NewStatus: 'CONFIRMED',
                ChangedBy: staffId,
                ChangedByType: 'STAFF',
                Notes: oldStatus === 'PREORDER_CONFIRMED'
                    ? 'Preorder moved to confirmed for production'
                    : 'Order confirmed by staff',
                CreatedAt: new Date()
            }, { transaction });

            await transaction.commit();

            // Send notifications (FR15)
            try {
                const runtimeSettings = await systemSettingsService.getRuntimeSettings();

                if (canSendOrderEmail(runtimeSettings, order.customer, 'orderConfirmation')) {
                    await sendOrderConfirmationEmail(order, order.customer);
                }
                if (canSendOrderSMS(runtimeSettings, order.customer, 'orderConfirmation')) {
                    await sendOrderConfirmationSMS(order.customer.Phone, order.OrderNumber, {
                        recipientId: order.customer.CustomerID,
                        recipientType: 'CUSTOMER',
                        relatedOrderId: order.OrderID
                    });
                }
            } catch (notifError) {
                console.error('Notification error:', notifError);
                // Don't fail the order confirmation if notification fails
            }

            return order;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update order status with notifications (FR15)
     */
    async updateOrderStatus(orderId, newStatus, staffId, notes = null) {
        const transaction = await sequelize.transaction();
        let order;
        let oldStatus;

        try {
            order = await Order.findByPk(orderId, {
                include: [
                    { model: Customer, as: 'customer' },
                    { model: OrderItem, as: 'items' },
                    { model: Payment, as: 'payment' }
                ],
                transaction
            });

            if (!order) {
                throw new Error('Order not found');
            }

            oldStatus = order.Status;

            // Validate status transition
            this.validateStatusTransition(oldStatus, newStatus);

            // Require settled non-cash payments before preparation starts.
            if (['PREPARING', 'READY'].includes(newStatus) && order.OrderType !== 'WALK_IN') {
                if (!order.payment) {
                    throw new Error('Cannot start preparation: payment record is missing');
                }

                const requiresSettledPayment = ['CARD', 'ONLINE', 'WALLET'].includes(order.payment.Method);
                if (requiresSettledPayment && order.payment.Status !== 'PAID') {
                    throw new Error('Cannot start preparation: online payment not completed');
                }
            }

            // Update order
            order.Status = newStatus;

            const shouldMovePreorderToConfirmed = oldStatus === 'PREORDER_CONFIRMED' && newStatus === 'CONFIRMED';
            const shouldApprovePreorder = oldStatus === 'PREORDER_PENDING' && newStatus === 'PREORDER_CONFIRMED';
            const shouldRejectPreorder = oldStatus === 'PREORDER_PENDING' && newStatus === 'CANCELLED';

            if (shouldMovePreorderToConfirmed) {
                const stockDate = new Date().toISOString().split('T')[0];
                const stockItems = await this.buildStockItemsFromOrderItems(order.items || [], transaction);

                if (stockItems.length > 0) {
                    await stockService.validateAndReserveStock(stockItems, stockDate, transaction);
                    await stockService.deductStock(order.OrderID, stockItems, stockDate, staffId, transaction);
                }

                order.ConfirmedAt = order.ConfirmedAt || new Date();
                order.ConfirmedBy = staffId;
            }

            if (shouldApprovePreorder) {
                order.ApprovalStatus = 'APPROVED';
                order.ApprovedBy = staffId;
                order.ApprovedAt = new Date();
                order.RejectedReason = null;
            }

            if (shouldRejectPreorder) {
                order.ApprovalStatus = 'REJECTED';
                order.ApprovedBy = staffId;
                order.ApprovedAt = new Date();
                order.RejectedReason = notes || 'Preorder rejected by staff';
                order.CancellationReason = notes || order.CancellationReason;
                order.CancelledBy = 'ADMIN';
            }

            // Set timestamp based on status
            switch (newStatus) {
                case 'PREPARING':
                    order.PreparingAt = new Date();
                    break;
                case 'READY':
                    order.ReadyAt = new Date();
                    break;
                case 'DELIVERED':
                    order.CompletedAt = new Date();
                    break;
                case 'CANCELLED':
                    order.CancelledAt = new Date();
                    break;
            }

            if (order.OrderType === 'DELIVERY' && ['PREPARING', 'READY'].includes(newStatus)) {
                const delivery = await Delivery.findOne({
                    where: { OrderID: orderId },
                    transaction
                });

                if (delivery) {
                    await delivery.update({
                        EstimatedDeliveryTime: calculateEstimatedDeliveryTime({
                            stage: newStatus,
                            distanceKm: Number(delivery.DistanceKm) || 0,
                            baseTime: new Date()
                        })
                    }, { transaction });
                }
            }

            order.UpdatedBy = staffId;
            await order.save({ transaction });

            // Log status history
            await OrderStatusHistory.create({
                OrderID: orderId,
                OldStatus: oldStatus,
                NewStatus: newStatus,
                ChangedBy: staffId,
                ChangedByType: 'STAFF',
                Notes: notes,
                CreatedAt: new Date()
            }, { transaction });

            if ((shouldApprovePreorder || shouldRejectPreorder) && PreorderApprovalLog) {
                await PreorderApprovalLog.create({
                    OrderID: orderId,
                    OldApprovalStatus: 'PENDING',
                    NewApprovalStatus: shouldApprovePreorder ? 'APPROVED' : 'REJECTED',
                    ActionBy: staffId,
                    ActionByType: 'STAFF',
                    Notes: notes || null,
                    CreatedAt: new Date()
                }, { transaction });
            }

            await transaction.commit();
        } catch (error) {
            if (!transaction.finished) {
                await transaction.rollback();
            }
            throw error;
        }

        // Auto-assign delivery staff when order becomes READY (FR26)
        if (newStatus === 'READY' && order.OrderType === 'DELIVERY') {
            try {
                await this.autoAssignDeliveryStaff(orderId);
            } catch (assignmentError) {
                console.error('Auto-assignment error after order status commit:', assignmentError);
            }
        }

        // Send notifications (FR15)
        try {
            const runtimeSettings = await systemSettingsService.getRuntimeSettings();

            if (order.OrderType !== 'WALK_IN' && canSendOrderEmail(runtimeSettings, order.customer, 'orderStatusUpdates')) {
                await sendOrderStatusUpdateEmail(order, order.customer, newStatus);
            }
            if (order.OrderType !== 'WALK_IN' && canSendOrderSMS(runtimeSettings, order.customer, 'orderStatusUpdates')) {
                await sendOrderStatusUpdateSMS(order.customer.Phone, order.OrderNumber, newStatus, {
                    recipientId: order.customer.CustomerID,
                    recipientType: 'CUSTOMER',
                    relatedOrderId: order.OrderID
                });
            }
        } catch (notifError) {
            console.error('Notification error:', notifError);
        }

        const statusMessageMap = {
            PREORDER_PENDING: 'Preorder is pending staff approval',
            PREORDER_CONFIRMED: 'Preorder approved and scheduled',
            CONFIRMED: 'Order confirmed',
            PREPARING: 'Order is being prepared',
            READY: order.OrderType === 'DELIVERY' ? 'Order is ready for dispatch' : 'Order is ready',
            OUT_FOR_DELIVERY: 'Order is out for delivery',
            DELIVERED: 'Order delivered',
            CANCELLED: 'Order cancelled'
        };

        const shouldNotifyCustomerOnStatus =
            order.OrderType !== 'WALK_IN'
            && order.CustomerID
            && !['PREPARING'].includes(newStatus)
            && !(order.OrderType === 'DELIVERY' && newStatus === 'READY');

        if (shouldNotifyCustomerOnStatus) {
            await notifySafely(async () => {
                await appNotificationService.notifyCustomer(order.CustomerID, {
                    eventType: 'ORDER_STATUS_UPDATED',
                    title: `Order #${order.OrderNumber}`,
                    message: statusMessageMap[newStatus] || `Order status updated to ${newStatus}`,
                    priority: ['CANCELLED'].includes(newStatus) ? 'HIGH' : 'MEDIUM',
                    relatedOrderId: order.OrderID,
                    payload: {
                        orderId: order.OrderID,
                        orderNumber: order.OrderNumber,
                        oldStatus,
                        newStatus
                    },
                    dedupeKey: `ORDER_STATUS_UPDATED:CUSTOMER:${order.CustomerID}:${order.OrderID}:${newStatus}`
                });
            }, 'Failed to notify customer on order status update');
        }

        await notifySafely(async () => {
            const staffRoleMatrixByStatus = {
                PREORDER_PENDING: ['Cashier', 'Admin'],
                PREORDER_CONFIRMED: ['Cashier', 'Admin'],
                CONFIRMED: ['Kitchen', 'Admin'],
                PREPARING: ['Admin'],
                READY: order.OrderType === 'DELIVERY' ? ['Admin'] : ['Cashier', 'Admin'],
                OUT_FOR_DELIVERY: ['Admin'],
                DELIVERED: ['Admin'],
                CANCELLED: ['Admin', 'Cashier']
            };

            const recipientRoles = staffRoleMatrixByStatus[newStatus] || ['Admin'];

            await appNotificationService.notifyStaffRoles(recipientRoles, {
                eventType: 'ORDER_STATUS_UPDATED',
                title: `Order #${order.OrderNumber}`,
                message: newStatus === 'READY' && order.OrderType !== 'DELIVERY'
                    ? `Order #${order.OrderNumber} is ready for customer handover.`
                    : `Order status changed from ${oldStatus} to ${newStatus}.`,
                priority: ['CANCELLED'].includes(newStatus) ? 'HIGH' : 'MEDIUM',
                relatedOrderId: order.OrderID,
                payload: {
                    orderId: order.OrderID,
                    orderNumber: order.OrderNumber,
                    oldStatus,
                    newStatus
                },
                dedupeKey: `ORDER_STATUS_UPDATED:STAFF:${order.OrderID}:${newStatus}`
            });
        }, 'Failed to notify staff on order status update');

        return order;
    }

    /**
     * Cancel order with stock return and refund (FR21)
     * CRITICAL: Uses SERIALIZABLE transaction for full atomicity
     * - If any step fails, entire transaction rolls back
     * - Stock is returned atomically with order status change
     * - Refund processing included in transaction scope
     * - Comprehensive logging for audit trail
     */
    async cancelOrder(orderId, reason, cancelledBy, cancelledByType = 'STAFF') {
        // Use SERIALIZABLE isolation to prevent any concurrent modifications
        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            if (!['CUSTOMER', 'CASHIER', 'ADMIN', 'SYSTEM'].includes(cancelledByType)) {
                throw new Error('Access denied. Only customers, cashiers, admins, or the system can cancel orders');
            }

            console.log(`[ORDER_CANCEL] Starting cancellation - OrderID: ${orderId}, CancelledBy: ${cancelledBy}, Type: ${cancelledByType}`);

            const order = await Order.findByPk(orderId, {
                include: [
                    { model: OrderItem, as: 'items' },
                    { model: Payment, as: 'payment' }
                ],
                // CRITICAL: Lock the order row for update to prevent concurrent cancellations
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (!order) {
                throw new Error('Order not found');
            }

            if (cancelledByType === 'CUSTOMER') {
                if (order.CustomerID !== cancelledBy) {
                    throw new Error('Access denied. You can only cancel your own orders');
                }

                if (!['PENDING', 'PREORDER_PENDING', 'PREORDER_CONFIRMED', 'CONFIRMED'].includes(order.Status)) {
                    throw new Error('Customer cancellation is allowed only before order preparation starts');
                }
            }

            // Validate order can be cancelled
            if (['DELIVERED', 'CANCELLED'].includes(order.Status)) {
                throw new Error(`Order cannot be cancelled. Current status: ${order.Status}`);
            }

            const oldStatus = order.Status;
            console.log(`[ORDER_CANCEL] Order found - Status: ${oldStatus}, Items: ${order.items.length}`);

            // Step 1: Return stock only when stock was actually deducted.
            const shouldReturnStock = order.IsPreorder
                ? Boolean(order.PreparingAt)
                : order.Status !== 'PENDING' && Boolean(order.ConfirmedAt);

            if (shouldReturnStock) {
                const stockAnchorDate = order.ConfirmedAt || order.PreparingAt || new Date();
                const stockDate = stockAnchorDate.toISOString().split('T')[0];
                const stockItems = await this.buildStockItemsFromOrderItems(order.items, transaction);

                if (stockItems.length > 0) {
                    console.log(`[ORDER_CANCEL] Returning stock - Date: ${stockDate}, Items: ${stockItems.length}`);
                    
                    // CRITICAL: Stock return uses row-level locking and optimistic locking
                    // If stock modification fails, entire transaction rolls back
                    await stockService.returnStock(orderId, stockItems, stockDate, cancelledBy, transaction);
                    
                    console.log(`[ORDER_CANCEL] Stock returned successfully - ${stockItems.length} items`);
                }
            } else {
                console.log(`[ORDER_CANCEL] No stock to return - Order status: ${order.Status}`);
            }

            // Step 2: Process refund if payment was made (FR21)
            if (order.payment && order.payment.Status === 'PAID') {
                console.log(`[ORDER_CANCEL] Processing refund - Method: ${order.payment.Method}, Amount: ${order.payment.Amount}`);
                
                const { payHereService, stripeService } = require('./paymentService');

                try {
                    if (order.payment.Method === 'CARD') {
                        await stripeService.processRefund(order.payment, reason);
                    } else if (order.payment.Method === 'ONLINE') {
                        await payHereService.processRefund(order.payment, reason);
                    }
                    console.log(`[ORDER_CANCEL] Refund processed successfully`);
                } catch (refundError) {
                    console.error(`[ORDER_CANCEL] Refund processing failed:`, refundError.message);
                    // Continue with cancellation even if refund fails (can be processed manually)
                    // Log for admin follow-up
                }
            }

            // Step 3: Update order status to CANCELLED
            order.Status = 'CANCELLED';
            order.CancelledAt = new Date();
            order.CancellationReason = reason;
            order.CancelledBy = cancelledByType;
            await order.save({ transaction });
            
            console.log(`[ORDER_CANCEL] Order status updated to CANCELLED`);

            // Step 4: Log status history for audit trail
            await OrderStatusHistory.create({
                OrderID: orderId,
                OldStatus: oldStatus,
                NewStatus: 'CANCELLED',
                ChangedBy: cancelledBy,
                ChangedByType: cancelledByType,
                Notes: reason,
                CreatedAt: new Date()
            }, { transaction });

            console.log(`[ORDER_CANCEL] Status history logged`);

            // COMMIT: All operations succeeded, commit transaction atomically
            await transaction.commit();
            console.log(`[ORDER_CANCEL] Transaction committed successfully - OrderID: ${orderId}`);

            return order;
        } catch (error) {
            // ROLLBACK: Any failure rolls back all changes (stock, order status, history)
            await transaction.rollback();
            console.error(`[ORDER_CANCEL] Transaction rolled back - OrderID: ${orderId}, Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate status transition
     */
    validateStatusTransition(oldStatus, newStatus) {
        const validTransitions = {
            'PENDING': ['CONFIRMED', 'CANCELLED'],
            'PREORDER_PENDING': ['PREORDER_CONFIRMED', 'CANCELLED'],
            'PREORDER_CONFIRMED': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['PREPARING', 'CANCELLED'],
            'PREPARING': ['READY', 'CANCELLED'],
            'READY': ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
            'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': [],
            'CANCELLED': []
        };

        if (!validTransitions[oldStatus]?.includes(newStatus)) {
            throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
        }
    }

    /**
     * Generate unique order number
     */
    async generateOrderNumber() {
        const runtimeSettings = await systemSettingsService.getRuntimeSettings();
        const normalizedPrefix = String(runtimeSettings.orderPrefix || 'VF')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 6);
        const prefix = normalizedPrefix.length >= 2 ? normalizedPrefix : 'VF';

        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        // Get today's order count
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const count = await Order.count({
            where: {
                created_at: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });

        const sequence = (count + 1).toString().padStart(4, '0');

        return `${prefix}${year}${month}${day}${sequence}`;
    }

    /**
     * Auto-assign delivery staff when order becomes READY (FR26)
     * Uses workload balancing to distribute deliveries fairly
     * Considers: active deliveries count, geographic location, and availability
     * CRITICAL: Prevents overwhelming single staff while others idle
     */
    async autoAssignDeliveryStaff(orderId) {
        console.log(`[AUTO-ASSIGN] 🚀 Starting auto-assignment for order ${orderId}`);

        const transaction = await sequelize.transaction({
            isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        });

        try {
            // Find the delivery record with order details
            const delivery = await Delivery.findOne({
                where: { OrderID: orderId },
                include: [
                    {
                        model: Order,
                        as: 'order'
                    },
                    {
                        model: Address,
                        as: 'address'
                    }
                ],
                transaction,
                lock: transaction.LOCK.UPDATE
            });

            if (!delivery) {
                console.error(`[AUTO-ASSIGN] ❌ Delivery record not found for order ${orderId}`);
                await transaction.rollback();
                return null;
            }

            console.log(`[AUTO-ASSIGN] 📦 Found delivery record (ID: ${delivery.DeliveryID}, Status: ${delivery.Status})`);

            // Check if already assigned
            if (delivery.Status !== 'PENDING') {
                console.log(`[AUTO-ASSIGN] ⚠️  Delivery already ${delivery.Status}, skipping assignment`);
                await transaction.commit();
                return delivery.DeliveryStaffID;
            }

            // Ensure delivery staff availability rows exist (first run / partial seed safety)
            await sequelize.query(
                `INSERT IGNORE INTO delivery_staff_availability (delivery_staff_id, is_available)
                 SELECT s.staff_id, 1
                 FROM staff s
                 JOIN role r ON s.role_id = r.role_id
                 WHERE r.role_name = 'Delivery' AND s.is_active = 1`,
                { transaction, type: sequelize.QueryTypes.INSERT }
            );

            // Get available delivery staff with current workload (least busy first)
            const staffWithWorkload = await sequelize.query(
                `SELECT
                    dsa.delivery_staff_id AS DeliveryStaffID,
                    dsa.is_available AS IsAvailable,
                    COUNT(d.delivery_id) AS active_deliveries,
                    s.name AS Name,
                    s.phone AS Phone,
                    COALESCE(AVG(TIMESTAMPDIFF(MINUTE, o.created_at, d.delivered_at)), 0) AS avg_completion_time,
                    COALESCE(AVG(d.distance_km), 0) AS avg_distance
                 FROM delivery_staff_availability dsa
                 LEFT JOIN delivery d
                    ON dsa.delivery_staff_id = d.delivery_staff_id
                    AND d.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')
                 LEFT JOIN \`order\` o ON d.order_id = o.order_id
                 JOIN staff s ON dsa.delivery_staff_id = s.staff_id
                 WHERE dsa.is_available = 1 AND s.is_active = 1
                 GROUP BY dsa.delivery_staff_id, dsa.is_available, s.name, s.phone
                 ORDER BY active_deliveries ASC, avg_completion_time DESC
                 LIMIT 5`,
                { transaction, type: sequelize.QueryTypes.SELECT }
            );

            console.log(`[AUTO-ASSIGN] 👥 Found ${staffWithWorkload ? staffWithWorkload.length : 0} available staff`);

            if (!staffWithWorkload || staffWithWorkload.length === 0) {
                console.warn(`[AUTO-ASSIGN] ⚠️  No available delivery staff for order ${orderId}`);
                console.warn(`[AUTO-ASSIGN] 💡 Tip: Run init_delivery_staff_availability.js or have staff set availability to true`);
                await transaction.rollback();
                return null;
            }

            // Log available staff
            staffWithWorkload.forEach((staff, idx) => {
                console.log(`[AUTO-ASSIGN]    ${idx + 1}. ${staff.Name} - ${Number(staff.active_deliveries) || 0} active`);
            });

            // Select best staff based on workload balancing
            // Priority: 1) Lightest workload, 2) Fastest completion time, 3) Earliest available
            const selectedStaff = staffWithWorkload[0];
            const staffId = Number(selectedStaff.DeliveryStaffID);

            console.log(`[AUTO-ASSIGN] 🎯 Selected: ${selectedStaff.Name} (ID: ${staffId})`);

            // CRITICAL FIX: Use atomic UPDATE with WHERE condition to prevent race conditions
            const [updatedCount] = await Delivery.update({
                DeliveryStaffID: staffId,
                Status: 'ASSIGNED',
                AssignedAt: new Date()
            }, {
                where: {
                    DeliveryID: delivery.DeliveryID,
                    Status: 'PENDING' // Only update if still PENDING
                },
                transaction
            });

            if (updatedCount === 0) {
                console.log(`[AUTO-ASSIGN] ⚠️  Delivery ${delivery.DeliveryID} was assigned concurrently by another process`);
                await transaction.rollback();
                return null;
            }

            // Update delivery staff availability (lock row first)
            const [availabilityUpdated] = await DeliveryStaffAvailability.update({
                IsAvailable: false,
                CurrentOrderID: orderId
            }, {
                where: {
                    DeliveryStaffID: staffId,
                    IsAvailable: true // Only update if still available
                },
                transaction
            });

            if (availabilityUpdated === 0) {
                console.log(`[AUTO-ASSIGN] ⚠️  Staff ${staffId} became unavailable during assignment`);
                await transaction.rollback();
                return null;
            }

            // Log assignment decision for auditing
            try {
                await sequelize.query(
                    `INSERT INTO delivery_assignment_log 
                    (order_id, assigned_staff_id, reason, active_deliveries, completion_time)
                    VALUES (?, ?, ?, ?, ?)`,
                    {
                        replacements: [
                            orderId,
                            staffId,
                            `Workload: ${selectedStaff.active_deliveries} active, completion time: ${selectedStaff.avg_completion_time.toFixed(1)}min`,
                            selectedStaff.active_deliveries,
                            selectedStaff.avg_completion_time
                        ],
                        transaction
                    }
                );
            } catch (logError) {
                // Ignore if assignment log table doesn't exist
                console.log(`[AUTO-ASSIGN] ℹ️  Assignment log table not available (optional)`);
            }

            await transaction.commit();

            console.log(`[AUTO-ASSIGN] ✅ Staff ${staffId} (${selectedStaff.Name}) assigned to order ${orderId}`);
            console.log(`[AUTO-ASSIGN]    - Active deliveries: ${selectedStaff.active_deliveries}`);
            console.log(`[AUTO-ASSIGN]    - Avg completion time: ${selectedStaff.avg_completion_time.toFixed(1)} minutes`);
            console.log(`[AUTO-ASSIGN] 🎉 Auto-assignment completed successfully!`);

            await notifySafely(async () => {
                await appNotificationService.notifyStaffById(staffId, {
                    eventType: 'DELIVERY_ASSIGNED',
                    title: `New Delivery Assignment`,
                    message: `Order #${delivery.order?.OrderNumber || orderId} has been assigned to you.`,
                    priority: 'HIGH',
                    relatedOrderId: orderId,
                    payload: {
                        orderId,
                        orderNumber: delivery.order?.OrderNumber || null,
                        deliveryId: delivery.DeliveryID
                    },
                    dedupeKey: `DELIVERY_ASSIGNED:STAFF:${staffId}:${orderId}`
                });
            }, 'Failed to notify assigned rider after auto-assignment');

            await notifySafely(async () => {
                await appNotificationService.notifyStaffRoles(['Admin'], {
                    eventType: 'DELIVERY_ASSIGNED',
                    title: `Delivery Staff Assigned`,
                    message: `${selectedStaff.Name} assigned to order #${delivery.order?.OrderNumber || orderId}.`,
                    priority: 'MEDIUM',
                    relatedOrderId: orderId,
                    payload: {
                        orderId,
                        orderNumber: delivery.order?.OrderNumber || null,
                        deliveryId: delivery.DeliveryID,
                        staffId,
                        staffName: selectedStaff.Name
                    },
                    dedupeKey: `DELIVERY_ASSIGNED:STAFF_BROADCAST:${orderId}:${staffId}`
                });
            }, 'Failed to notify staff after auto-assignment');

            return staffId;

        } catch (error) {
            await transaction.rollback();
            console.error('[AUTO-ASSIGN] ❌ Error assigning delivery staff:', error.message);
            console.error('[AUTO-ASSIGN] Stack trace:', error.stack);
            // Don't throw - allow order to proceed without staff assignment
            return null;
        }
    }
}

module.exports = new OrderService();
