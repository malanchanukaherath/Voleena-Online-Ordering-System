import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import {
    FaMapMarkerAlt,
    FaPhone,
    FaBox,
    FaTruck,
    FaCheckCircle,
    FaClock,
    FaBan,
    FaMoneyBillWave,
    FaMapMarkedAlt
} from 'react-icons/fa';
import {
    cancelOrder,
    getDeliveryLocation,
    getOrderAddOnOptions,
    getOrderById,
    updateOrderItemAddOns
} from '../services/orderApi';
import { comboPackService, menuItemService } from '../services/menuService';
import { addToCart } from '../utils/cartStorage';
import { resolveAssetUrl } from '../config/api';

const ORDER_ADDON_NOTES_PREFIX = '__VOLEENA_ADDONS__:';

const toMoney = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 0;
    }

    return Number(parsed.toFixed(2));
};

const toFiniteNumber = (value, fallback = null) => {
    if (value === null || value === undefined || value === '') {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrderItemAddOnsFromNotes = (rawNotes, fallbackUnitPrice) => {
    const notes = String(rawNotes || '').trim();
    const safeFallback = toMoney(fallbackUnitPrice);

    if (!notes || !notes.startsWith(ORDER_ADDON_NOTES_PREFIX)) {
        return {
            baseUnitPrice: safeFallback,
            selectedAddOns: []
        };
    }

    try {
        const payload = JSON.parse(notes.slice(ORDER_ADDON_NOTES_PREFIX.length));
        const selectedAddOns = Array.isArray(payload?.addOns)
            ? payload.addOns
                .map((entry) => ({
                    id: String(entry?.id || '').trim(),
                    quantity: Math.max(1, Number.parseInt(entry?.quantity, 10) || 1)
                }))
                .filter((entry) => entry.id)
            : [];

        const baseUnitPrice = Number.isFinite(Number(payload?.baseUnitPrice))
            ? toMoney(payload.baseUnitPrice)
            : safeFallback;

        return {
            baseUnitPrice,
            selectedAddOns
        };
    } catch (error) {
        return {
            baseUnitPrice: safeFallback,
            selectedAddOns: []
        };
    }
};

const formatTimeLabel = (value) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const formatEtaCountdown = (value) => {
    if (!value) {
        return null;
    }

    const eta = new Date(value);
    if (Number.isNaN(eta.getTime())) {
        return null;
    }

    const minutesRemaining = Math.max(0, Math.round((eta.getTime() - Date.now()) / 60000));
    if (minutesRemaining <= 0) {
        return 'Any moment now';
    }

    if (minutesRemaining === 1) {
        return 'About 1 minute';
    }

    return `About ${minutesRemaining} minutes`;
};

const paymentMethodLabel = (paymentMethod) => {
    const normalized = String(paymentMethod || '').toUpperCase();
    if (normalized === 'ONLINE') {
        return 'Online Payment';
    }
    if (normalized === 'CARD') {
        return 'Card Payment';
    }

    return 'Cash on Delivery';
};

const OrderTracking = () => {
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [isCancelling, setIsCancelling] = useState(false);
    const [liveLocation, setLiveLocation] = useState(null);
    const [liveLocationError, setLiveLocationError] = useState('');

    const [selectedItem, setSelectedItem] = useState(null);
    const [showItemPreviewModal, setShowItemPreviewModal] = useState(false);
    const [relatedItems, setRelatedItems] = useState([]);
    const [loadingRelatedItems, setLoadingRelatedItems] = useState(false);
    const [comparisonIds, setComparisonIds] = useState([]);

    const [addOnContext, setAddOnContext] = useState({
        canCustomize: false,
        reason: null,
        itemsByOrderItemId: {}
    });
    const [loadingAddOnContext, setLoadingAddOnContext] = useState(false);
    const [showAddOnModal, setShowAddOnModal] = useState(false);
    const [editingOrderItemId, setEditingOrderItemId] = useState(null);
    const [editableAddOnSelections, setEditableAddOnSelections] = useState({});
    const [isSavingAddOns, setIsSavingAddOns] = useState(false);

    const openToast = useCallback((message, type = 'success') => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
    }, []);

    const mapOrderData = useCallback((data = {}) => {
        const deliveryPerson = data.delivery?.deliveryStaff || data.delivery?.staff || null;

        return {
            id: data.OrderID,
            orderNumber: data.OrderNumber,
            status: data.Status,
            orderType: data.OrderType,
            isPreorder: Boolean(data.IsPreorder ?? data.isPreorder),
            scheduledDatetime: data.ScheduledDatetime || data.scheduledDatetime || null,
            approvalStatus: data.ApprovalStatus || data.approvalStatus || null,
            approvalNotes: data.ApprovalNotes || data.approvalNotes || null,
            paymentMethod: data.payment?.Method || 'CASH',
            paymentStatus: data.payment?.Status || null,
            subtotal: toMoney(data.TotalAmount || 0),
            discountAmount: toMoney(data.DiscountAmount || 0),
            deliveryFee: toMoney(data.DeliveryFee || 0),
            finalAmount: toMoney(data.FinalAmount || data.TotalAmount || 0),
            customer: {
                name: data.customer?.Name || 'Customer',
                phone: data.customer?.Phone || ''
            },
            deliveryId: data.delivery?.DeliveryID || data.delivery?.deliveryId || null,
            deliveryAddress: data.delivery?.address ? {
                line1: data.delivery.address.AddressLine1,
                city: data.delivery.address.City,
                district: data.delivery.address.District || '',
                latitude: toFiniteNumber(data.delivery.address.Latitude ?? data.delivery.address.latitude),
                longitude: toFiniteNumber(data.delivery.address.Longitude ?? data.delivery.address.longitude)
            } : null,
            deliveryPerson: deliveryPerson ? {
                name: deliveryPerson.Name,
                phone: deliveryPerson.Phone
            } : null,
            confirmedAt: data.ConfirmedAt || data.confirmedAt || null,
            preparingAt: data.PreparingAt || data.preparingAt || null,
            readyAt: data.ReadyAt || data.readyAt || null,
            deliveryAssignedAt: data.delivery?.AssignedAt || data.delivery?.assignedAt || null,
            pickedUpAt: data.delivery?.PickedUpAt || data.delivery?.pickedUpAt || null,
            estimatedDeliveryTime: data.delivery?.EstimatedDeliveryTime || data.delivery?.estimatedDeliveryTime || null,
            placedAt: data.CreatedAt,
            completedAt: data.CompletedAt || data.completedAt,
            deliveredAt: data.delivery?.DeliveredAt || data.delivery?.deliveredAt,
            cancelledAt: data.CancelledAt || data.cancelledAt || null,
            approvedAt: data.ApprovedAt || data.approvedAt || null,
            items: (data.items || []).map((entry) => {
                const unitPrice = toMoney(entry.UnitPrice || 0);
                const parsedAddOns = parseOrderItemAddOnsFromNotes(entry.ItemNotes, unitPrice);

                return {
                    orderItemId: entry.OrderItemID,
                    itemType: entry.MenuItemID ? 'MENU' : 'COMBO',
                    itemId: entry.MenuItemID || entry.ComboID,
                    menuItemId: entry.MenuItemID || null,
                    comboId: entry.ComboID || null,
                    name: entry.menuItem?.Name || entry.combo?.Name || 'Item',
                    description: entry.menuItem?.Description || entry.combo?.Description || 'No description available.',
                    categoryId: entry.menuItem?.CategoryID || null,
                    categoryName: entry.menuItem?.category?.Name || null,
                    quantity: Number(entry.Quantity || 0),
                    price: unitPrice,
                    image: resolveAssetUrl(entry.menuItem?.ImageURL || entry.combo?.ImageURL || null),
                    selectedAddOns: parsedAddOns.selectedAddOns,
                    baseUnitPrice: parsedAddOns.baseUnitPrice,
                    lineTotal: toMoney(unitPrice * Number(entry.Quantity || 0))
                };
            })
        };
    }, []);

    const fetchOrder = useCallback(async () => {
        try {
            const response = await getOrderById(orderId);
            const data = response.data?.data;
            if (!data) {
                return null;
            }

            const mapped = mapOrderData(data);
            setOrder(mapped);
            return mapped;
        } catch (error) {
            console.error('Failed to load order:', error);
            return null;
        }
    }, [mapOrderData, orderId]);

    const fetchAddOnContext = useCallback(async (resolvedOrder) => {
        if (!resolvedOrder?.id) {
            setAddOnContext({
                canCustomize: false,
                reason: null,
                itemsByOrderItemId: {}
            });
            return;
        }

        try {
            setLoadingAddOnContext(true);
            const response = await getOrderAddOnOptions(resolvedOrder.id);
            const payload = response.data?.data;

            if (!payload) {
                return;
            }

            const itemsByOrderItemId = (payload.items || []).reduce((accumulator, entry) => {
                accumulator[String(entry.orderItemId)] = entry;
                return accumulator;
            }, {});

            setAddOnContext({
                canCustomize: Boolean(payload.canCustomize),
                reason: payload.reason || null,
                itemsByOrderItemId
            });
        } catch (error) {
            console.error('Failed to load add-on context:', error);
            setAddOnContext({
                canCustomize: false,
                reason: error?.response?.data?.message || 'Unable to load item customization options right now.',
                itemsByOrderItemId: {}
            });
        } finally {
            setLoadingAddOnContext(false);
        }
    }, []);

    const fetchRelatedItems = useCallback(async (item) => {
        if (!item) {
            setRelatedItems([]);
            return;
        }

        setLoadingRelatedItems(true);
        try {
            if (item.itemType === 'MENU') {
                const response = await menuItemService.getAll({
                    isActive: 'true',
                    categoryId: item.categoryId || undefined,
                    _: Date.now()
                });

                const related = (response.data || [])
                    .map((entry) => ({
                        id: entry.MenuItemID || entry.ItemID,
                        type: 'menu',
                        name: entry.Name,
                        description: entry.Description || 'No description available.',
                        price: toMoney(entry.Price),
                        image: resolveAssetUrl(entry.ImageURL || entry.Image_URL || null)
                    }))
                    .filter((entry) => String(entry.id) !== String(item.menuItemId || item.itemId))
                    .slice(0, 5);

                setRelatedItems(related);
            } else {
                const response = await comboPackService.getActive({ _: Date.now() });
                const related = (response.data || [])
                    .map((entry) => ({
                        id: entry.ComboID || entry.ComboPackID,
                        type: 'combo',
                        name: entry.Name,
                        description: entry.Description || 'No description available.',
                        price: toMoney(entry.Price),
                        image: resolveAssetUrl(entry.ImageURL || entry.Image_URL || null)
                    }))
                    .filter((entry) => String(entry.id) !== String(item.comboId || item.itemId))
                    .slice(0, 5);

                setRelatedItems(related);
            }
        } catch (error) {
            console.error('Failed to load related items:', error);
            setRelatedItems([]);
        } finally {
            setLoadingRelatedItems(false);
        }
    }, []);

    const quickAddToCart = useCallback((item) => {
        try {
            addToCart({
                id: item.id,
                type: item.type,
                menuItemId: item.type === 'menu' ? item.id : null,
                comboId: item.type === 'combo' ? item.id : null,
                name: item.name,
                price: toMoney(item.price),
                image: item.image || null,
                isAvailable: true
            }, 1);

            openToast(`${item.name} added to cart.`, 'success');
        } catch (error) {
            openToast(error.message || 'Failed to add item to cart.', 'error');
        }
    }, [openToast]);

    const openItemPreview = useCallback((item) => {
        setSelectedItem(item);
        setComparisonIds([]);
        setShowItemPreviewModal(true);
        fetchRelatedItems(item);
    }, [fetchRelatedItems]);

    const closeItemPreview = useCallback(() => {
        setShowItemPreviewModal(false);
        setSelectedItem(null);
        setRelatedItems([]);
        setComparisonIds([]);
    }, []);

    const toggleCompareItem = useCallback((itemId) => {
        setComparisonIds((previous) => {
            if (previous.includes(itemId)) {
                return previous.filter((entry) => entry !== itemId);
            }

            if (previous.length >= 2) {
                openToast('You can compare up to 3 items including the selected item.', 'warning');
                return previous;
            }

            return [...previous, itemId];
        });
    }, [openToast]);

    const openAddOnEditor = useCallback((item) => {
        const contextItem = addOnContext.itemsByOrderItemId[String(item.orderItemId)];
        if (!contextItem) {
            return;
        }

        const nextSelections = (contextItem.selectedAddOns || []).reduce((accumulator, entry) => {
            accumulator[String(entry.id)] = Number(entry.quantity || 1);
            return accumulator;
        }, {});

        setEditingOrderItemId(String(item.orderItemId));
        setEditableAddOnSelections(nextSelections);
        setShowAddOnModal(true);
    }, [addOnContext.itemsByOrderItemId]);

    const closeAddOnEditor = useCallback(() => {
        setShowAddOnModal(false);
        setEditingOrderItemId(null);
        setEditableAddOnSelections({});
    }, []);

    const setAddOnEnabled = useCallback((addOnId, isEnabled) => {
        setEditableAddOnSelections((previous) => {
            const next = { ...previous };
            if (isEnabled) {
                next[addOnId] = next[addOnId] || 1;
            } else {
                delete next[addOnId];
            }
            return next;
        });
    }, []);

    const adjustAddOnQuantity = useCallback((addOnId, requestedQuantity, maxQuantity) => {
        setEditableAddOnSelections((previous) => {
            const normalized = Math.max(1, Math.min(Number(requestedQuantity || 1), Number(maxQuantity || 1)));
            return {
                ...previous,
                [addOnId]: normalized
            };
        });
    }, []);

    const saveAddOnSelections = useCallback(async () => {
        if (!order || !editingOrderItemId) {
            return;
        }

        const payload = Object.entries(editableAddOnSelections)
            .filter(([, quantity]) => Number(quantity) > 0)
            .map(([id, quantity]) => ({
                id,
                quantity: Number(quantity)
            }));

        setIsSavingAddOns(true);
        try {
            await updateOrderItemAddOns(order.id, editingOrderItemId, payload);
            closeAddOnEditor();

            const refreshedOrder = await fetchOrder();
            if (refreshedOrder) {
                await fetchAddOnContext(refreshedOrder);
            }

            openToast('Item customization saved successfully.', 'success');
        } catch (error) {
            openToast(error?.response?.data?.message || error.message || 'Failed to save item customization.', 'error');
        } finally {
            setIsSavingAddOns(false);
        }
    }, [closeAddOnEditor, editableAddOnSelections, editingOrderItemId, fetchAddOnContext, fetchOrder, openToast, order]);

    useEffect(() => {
        let isMounted = true;

        const loadOrderState = async () => {
            const resolvedOrder = await fetchOrder();
            if (isMounted && resolvedOrder) {
                await fetchAddOnContext(resolvedOrder);
            }
        };

        loadOrderState();

        const intervalId = setInterval(async () => {
            const resolvedOrder = await fetchOrder();
            if (isMounted && resolvedOrder) {
                await fetchAddOnContext(resolvedOrder);
            }
        }, 5000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [fetchAddOnContext, fetchOrder]);

    useEffect(() => {
        const deliveryId = order?.deliveryId;
        const hasAssignedDeliveryPerson = Boolean(order?.deliveryPerson?.name || order?.deliveryPerson?.phone);
        const shouldTrackLiveLocation = order?.orderType === 'DELIVERY'
            && !['CANCELLED', 'DELIVERED'].includes(order?.status)
            && Number.isInteger(Number(deliveryId))
            && hasAssignedDeliveryPerson;

        if (!shouldTrackLiveLocation) {
            setLiveLocation(null);
            setLiveLocationError('');
            return;
        }

        let isMounted = true;

        const fetchLiveLocation = async () => {
            try {
                const response = await getDeliveryLocation(deliveryId);
                const payload = response?.data?.data;

                if (!payload || !isMounted) {
                    return;
                }

                setLiveLocation({
                    lat: toFiniteNumber(payload.lat),
                    lng: toFiniteNumber(payload.lng),
                    lastUpdate: payload.lastUpdate || null,
                    status: payload.status || null
                });
                setLiveLocationError('');
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                if (error?.response?.status === 503) {
                    setLiveLocationError(error.response?.data?.message || 'Live location tracking is temporarily unavailable.');
                    return;
                }

                if ([403, 404].includes(error?.response?.status)) {
                    setLiveLocationError('Live rider location is not available for this order right now.');
                    return;
                }

                setLiveLocationError('Unable to fetch live rider location right now.');
            }
        };

        fetchLiveLocation();
        const intervalId = setInterval(fetchLiveLocation, 10000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [order?.deliveryId, order?.deliveryPerson?.name, order?.deliveryPerson?.phone, order?.orderType, order?.status]);

    const canCancelOrder = () => {
        const cancellableStatuses = ['CONFIRMED', 'PREORDER_PENDING', 'PREORDER_CONFIRMED'];
        const isNotCancelled = order?.status !== 'CANCELLED';
        return cancellableStatuses.includes(order?.status) && isNotCancelled;
    };

    const getDeliveryEtaText = () => {
        if (!order || order.orderType !== 'DELIVERY' || order.status === 'CANCELLED' || order.status === 'DELIVERED') {
            return null;
        }

        if (order.status === 'PREORDER_PENDING') {
            return order.scheduledDatetime
                ? `Preorder awaiting approval for ${new Date(order.scheduledDatetime).toLocaleString()}`
                : 'Preorder awaiting staff approval';
        }

        if (order.status === 'PREORDER_CONFIRMED') {
            return order.scheduledDatetime
                ? `Scheduled for ${new Date(order.scheduledDatetime).toLocaleString()}`
                : 'Preorder approved and scheduled';
        }

        const countdown = formatEtaCountdown(order.estimatedDeliveryTime);

        if (order.status === 'OUT_FOR_DELIVERY') {
            return countdown ? `Arriving ${countdown.toLowerCase()}` : 'Your order is on the way';
        }

        if (order.status === 'READY') {
            return countdown ? `Ready for dispatch, ${countdown.toLowerCase()} to delivery` : 'Ready for dispatch';
        }

        if (order.status === 'PREPARING') {
            return countdown ? `Preparing now, ${countdown.toLowerCase()} to delivery` : 'Preparing your order';
        }

        if (order.status === 'CONFIRMED') {
            return countdown ? `Estimated delivery ${countdown.toLowerCase()}` : 'Estimated delivery updating';
        }

        return countdown ? `Estimated delivery ${countdown.toLowerCase()}` : 'Estimated delivery updating';
    };

    const getTimelineTime = (status) => {
        if (!order) {
            return '';
        }

        switch (status) {
            case 'PLACED':
                return formatTimeLabel(order.placedAt);
            case 'PREORDER_PENDING':
                return formatTimeLabel(order.placedAt);
            case 'PREORDER_CONFIRMED':
                return formatTimeLabel(order.approvedAt);
            case 'CONFIRMED':
                return formatTimeLabel(order.confirmedAt || order.placedAt);
            case 'PREPARING':
                return formatTimeLabel(order.preparingAt);
            case 'READY':
                return formatTimeLabel(order.readyAt || order.deliveryAssignedAt);
            case 'OUT_FOR_DELIVERY':
                return formatTimeLabel(order.deliveryAssignedAt || order.pickedUpAt);
            case 'DELIVERED':
                return formatTimeLabel(order.deliveredAt);
            case 'CANCELLED':
                return formatTimeLabel(order.cancelledAt);
            default:
                return '';
        }
    };

    const destinationLat = toFiniteNumber(order?.deliveryAddress?.latitude);
    const destinationLng = toFiniteNumber(order?.deliveryAddress?.longitude);
    const liveLat = toFiniteNumber(liveLocation?.lat);
    const liveLng = toFiniteNumber(liveLocation?.lng);
    const hasDestinationCoordinates = Number.isFinite(destinationLat) && Number.isFinite(destinationLng);
    const hasLiveCoordinates = Number.isFinite(liveLat) && Number.isFinite(liveLng);
    const isAssignedToRider = Boolean(order?.deliveryPerson?.name || order?.deliveryPerson?.phone);

    const liveRouteUrl = hasDestinationCoordinates && hasLiveCoordinates
        ? `https://www.google.com/maps/dir/?api=1&origin=${liveLat},${liveLng}&destination=${destinationLat},${destinationLng}&travelmode=driving`
        : hasDestinationCoordinates
            ? `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}&travelmode=driving`
            : hasLiveCoordinates
                ? `https://www.google.com/maps/search/?api=1&query=${liveLat},${liveLng}`
                : null;

    const handleCancelOrder = async () => {
        if (!order) {
            return;
        }

        setIsCancelling(true);
        try {
            await cancelOrder(order.id, 'Cancelled by customer');

            const refreshedOrder = await fetchOrder();
            if (refreshedOrder) {
                await fetchAddOnContext(refreshedOrder);
            } else {
                setOrder((previous) => ({ ...previous, status: 'CANCELLED', cancelledAt: new Date().toISOString() }));
            }

            const isCashOnDelivery = order.paymentMethod === 'CASH';
            openToast(
                isCashOnDelivery
                    ? 'Order cancelled successfully.'
                    : 'Order cancelled successfully. Your refund will be reviewed and processed through the payment provider.',
                'success'
            );
        } catch (error) {
            if (error?.code === 'ECONNABORTED') {
                openToast('Cancellation is taking longer than expected. Please wait a moment; status will refresh automatically.', 'warning');
            } else {
                openToast(error?.response?.data?.message || error.message || 'Failed to cancel order', 'error');
            }
        } finally {
            setIsCancelling(false);
            setShowCancelModal(false);
        }
    };

    const isPreorderFlow = Boolean(order?.isPreorder);

    const trackingSteps = [
        {
            status: 'PLACED',
            label: 'Order Placed',
            time: getTimelineTime('PLACED'),
            completed: true,
            icon: FaBox
        }
    ];

    if (isPreorderFlow) {
        trackingSteps.push(
            {
                status: 'PREORDER_PENDING',
                label: 'Awaiting Approval',
                time: getTimelineTime('PREORDER_PENDING'),
                completed: ['PREORDER_PENDING', 'PREORDER_CONFIRMED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'READY', 'CANCELLED'].includes(order?.status),
                icon: FaClock,
                current: order?.status === 'PREORDER_PENDING'
            },
            {
                status: 'PREORDER_CONFIRMED',
                label: 'Preorder Approved',
                time: getTimelineTime('PREORDER_CONFIRMED'),
                completed: ['PREORDER_CONFIRMED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'READY'].includes(order?.status),
                icon: FaCheckCircle,
                current: order?.status === 'PREORDER_CONFIRMED'
            }
        );
    }

    trackingSteps.push(
        {
            status: 'CONFIRMED',
            label: 'Order Confirmed',
            time: getTimelineTime('CONFIRMED'),
            completed: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'READY'].includes(order?.status),
            icon: FaCheckCircle,
            current: order?.status === 'CONFIRMED'
        },
        {
            status: 'PREPARING',
            label: 'Preparing',
            time: getTimelineTime('PREPARING'),
            completed: ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'READY'].includes(order?.status),
            icon: FaClock,
            current: order?.status === 'PREPARING'
        }
    );

    if (order?.orderType === 'DELIVERY') {
        trackingSteps.push({
            status: 'OUT_FOR_DELIVERY',
            label: 'Out for Delivery',
            time: getTimelineTime('OUT_FOR_DELIVERY'),
            completed: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order?.status),
            icon: FaTruck,
            current: order?.status === 'OUT_FOR_DELIVERY'
        });
        trackingSteps.push({
            status: 'DELIVERED',
            label: 'Delivered',
            time: getTimelineTime('DELIVERED'),
            completed: order?.status === 'DELIVERED',
            icon: FaCheckCircle,
            current: order?.status === 'DELIVERED'
        });
    } else if (order?.orderType === 'TAKEAWAY') {
        trackingSteps.push({
            status: 'READY',
            label: 'Ready for Pickup',
            time: getTimelineTime('READY'),
            completed: ['READY', 'DELIVERED'].includes(order?.status),
            icon: FaCheckCircle,
            current: order?.status === 'READY'
        });
    }

    if (order?.status === 'CANCELLED') {
        trackingSteps.push({
            status: 'CANCELLED',
            label: 'Order Cancelled',
            time: getTimelineTime('CANCELLED'),
            completed: true,
            icon: FaBan,
            current: true
        });
    }

    const comparedItems = useMemo(() => {
        if (!selectedItem) {
            return [];
        }

        const selectedRelated = relatedItems.filter((entry) => comparisonIds.includes(entry.id));
        return [
            {
                id: selectedItem.itemId,
                type: selectedItem.itemType === 'MENU' ? 'menu' : 'combo',
                name: selectedItem.name,
                description: selectedItem.description,
                price: toMoney(selectedItem.price),
                image: selectedItem.image
            },
            ...selectedRelated
        ].slice(0, 3);
    }, [comparisonIds, relatedItems, selectedItem]);

    const editingAddOnContextItem = useMemo(() => {
        if (!editingOrderItemId) {
            return null;
        }

        return addOnContext.itemsByOrderItemId[String(editingOrderItemId)] || null;
    }, [addOnContext.itemsByOrderItemId, editingOrderItemId]);

    const editingOrderItem = useMemo(() => {
        if (!editingOrderItemId) {
            return null;
        }

        return (order?.items || []).find((entry) => String(entry.orderItemId) === String(editingOrderItemId)) || null;
    }, [editingOrderItemId, order?.items]);

    const selectedEditableAddOns = useMemo(() => {
        const available = editingAddOnContextItem?.availableAddOns || [];
        return available
            .filter((entry) => Number(editableAddOnSelections[entry.id] || 0) > 0)
            .map((entry) => ({
                ...entry,
                quantity: Number(editableAddOnSelections[entry.id] || 0)
            }));
    }, [editableAddOnSelections, editingAddOnContextItem]);

    const editingBaseUnitPrice = toMoney(editingAddOnContextItem?.baseUnitPrice || editingOrderItem?.baseUnitPrice || editingOrderItem?.price || 0);
    const editingExtrasPerUnit = toMoney(selectedEditableAddOns.reduce((sum, entry) => sum + toMoney(entry.price) * Number(entry.quantity || 0), 0));
    const editingUpdatedUnitPrice = toMoney(editingBaseUnitPrice + editingExtrasPerUnit);
    const editingQuantity = Number(editingOrderItem?.quantity || 1);
    const editingLineTotal = toMoney(editingUpdatedUnitPrice * editingQuantity);
    const currentLineTotal = toMoney(Number(editingOrderItem?.price || 0) * editingQuantity);
    const projectedSubtotal = toMoney((order?.subtotal || 0) - currentLineTotal + editingLineTotal);
    const projectedFinalAmount = Math.max(toMoney(projectedSubtotal - toMoney(order?.discountAmount || 0) + toMoney(order?.deliveryFee || 0)), 0);

    if (!order) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow p-6">Loading order details...</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Link to="/orders" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
                    {'<'} Back to Orders
                </Link>
                <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
                <p className="text-gray-600">Order #{order.orderNumber}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className={`${order.status === 'CANCELLED' ? 'bg-red-50 border-red-500' : 'bg-primary-50 border-primary-500'} border-2 rounded-lg p-6`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className={`text-xl font-semibold ${order.status === 'CANCELLED' ? 'text-red-900' : 'text-primary-900'}`}>
                                    Current Status
                                </h2>
                                <p className={order.status === 'CANCELLED' ? 'text-red-700' : 'text-primary-700'}>
                                    {order.status === 'CANCELLED' ? 'Your order has been cancelled' :
                                        order.status === 'PREORDER_PENDING' ? 'Your preorder is awaiting staff approval' :
                                            order.status === 'PREORDER_CONFIRMED' ? 'Your preorder is approved and scheduled' :
                                        order.status === 'CONFIRMED' ? 'Your order is confirmed!' :
                                            order.status === 'PREPARING' ? 'Your order is being prepared' :
                                                order.status === 'READY' ? (order.orderType === 'TAKEAWAY' ? 'Your order is ready for pickup!' : 'Your order is ready!') :
                                                    order.status === 'OUT_FOR_DELIVERY' ? 'Your order is on the way!' :
                                                        'Your order has been delivered!'}
                                </p>
                            </div>
                            <StatusBadge status={order.status} type="order" />
                        </div>
                        {order.isPreorder && order.scheduledDatetime && order.status !== 'CANCELLED' && (
                            <div className="text-sm text-primary-800 mb-2">
                                Scheduled for: <span className="font-semibold">{new Date(order.scheduledDatetime).toLocaleString()}</span>
                            </div>
                        )}
                        {order.status === 'DELIVERED' && order.orderType === 'DELIVERY' && order.deliveredAt && (
                            <div className="text-sm text-green-800 bg-green-50 p-2 rounded mt-3">
                                <p>Delivered on: <span className="font-semibold">{new Date(order.deliveredAt).toLocaleString()}</span></p>
                            </div>
                        )}
                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && order.orderType === 'DELIVERY' && (
                            <div className="text-sm text-primary-800">
                                <p>{getDeliveryEtaText() || 'Estimated delivery updating'}</p>
                            </div>
                        )}
                    </div>

                    {canCancelOrder() && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Order Cancellation</h3>

                            <div className="space-y-4">
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                                    <p className="text-sm text-yellow-800">
                                        You can cancel this order before preparation starts.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCancelModal(true)}
                                    className="text-red-600 border-red-600 hover:bg-red-50 w-full"
                                >
                                    <FaBan className="inline mr-2" />
                                    Cancel Order
                                </Button>
                            </div>
                        </div>
                    )}

                    {order.status === 'CANCELLED' && (
                        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
                            <div className="flex items-start gap-3">
                                <FaMoneyBillWave className="text-green-600 text-2xl mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-green-900 mb-2">Refund Status</h3>
                                    <div className="space-y-2 text-sm text-green-800">
                                        {order.paymentMethod === 'CASH' ? (
                                            <p>Order cancelled successfully.</p>
                                        ) : (
                                            <p>Order cancelled successfully. Your refund will be reviewed and processed through the payment provider.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {order.orderType === 'DELIVERY' && order.deliveryAddress && !['CANCELLED', 'DELIVERED'].includes(order.status) && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <FaMapMarkedAlt className="mr-2 text-primary-600" />
                                Live Delivery Tracking
                            </h3>

                            {!isAssignedToRider ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                    <p>Delivery person has not been assigned yet. Live rider tracking will appear once assignment is complete.</p>
                                </div>
                            ) : hasDestinationCoordinates ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                                        <p>Your order is on the way to:</p>
                                        <p className="font-medium mt-1">{order.deliveryAddress.line1}, {order.deliveryAddress.city}</p>
                                    </div>

                                    {hasLiveCoordinates ? (
                                        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
                                            <p>Rider live location is updating in near real-time.</p>
                                            <p className="font-medium mt-1">Current: {liveLat.toFixed(6)}, {liveLng.toFixed(6)}</p>
                                            {liveLocation?.lastUpdate && (
                                                <p className="text-xs mt-1">Last update: {new Date(liveLocation.lastUpdate).toLocaleTimeString()}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                            <p>Waiting for rider GPS updates...</p>
                                        </div>
                                    )}

                                    {liveLocationError && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                            <p>{liveLocationError}</p>
                                        </div>
                                    )}

                                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                                        <FaMapMarkedAlt className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                                        <p className="text-sm text-gray-600">
                                            Open Google Maps for rider and destination view
                                        </p>
                                        {liveRouteUrl && (
                                            <a
                                                href={liveRouteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block mt-3 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-sm"
                                            >
                                                Open in Google Maps
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
                                    <p>Your order is on the way. GPS tracking is not available for this delivery.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-6">Order Progress</h3>
                        <div className="space-y-6">
                            {trackingSteps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={index} className="relative flex items-start">
                                        {index < trackingSteps.length - 1 && (
                                            <div
                                                className={`absolute left-5 top-12 bottom-0 w-0.5 ${step.completed ? 'bg-primary-500' : 'bg-gray-300'}`}
                                                style={{ height: 'calc(100% + 1.5rem)' }}
                                            />
                                        )}

                                        <div
                                            className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${step.completed
                                                ? step.status === 'CANCELLED' ? 'bg-red-500 text-white' : 'bg-primary-500 text-white'
                                                : 'bg-gray-200 text-gray-500'
                                                } ${step.current ? 'ring-4 ring-primary-100' : ''}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        <div className="ml-4 flex-1">
                                            <h4 className={`font-semibold ${step.current ? 'text-primary-600' : step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {step.label}
                                            </h4>
                                            {step.time && (
                                                <p className="text-sm text-gray-500 mt-1">{step.time}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4">Order Details</h3>
                        <div className="space-y-3 text-sm">
                            {order.items.map((item) => {
                                const addOnEntry = addOnContext.itemsByOrderItemId[String(item.orderItemId)];
                                const selectedAddOns = addOnEntry?.selectedAddOns || item.selectedAddOns || [];
                                const canCustomizeThisItem = Boolean(addOnEntry?.canCustomize);

                                return (
                                    <div key={item.orderItemId} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => openItemPreview(item)}
                                                className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0"
                                                title="View item details"
                                            >
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] text-gray-400">No image</span>
                                                )}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => openItemPreview(item)}
                                                    className="text-left font-medium text-gray-900 hover:text-primary-600"
                                                >
                                                    {item.quantity}x {item.name}
                                                </button>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>

                                                {selectedAddOns.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {selectedAddOns.map((entry) => (
                                                            <span key={`${item.orderItemId}-${entry.id}`} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px]">
                                                                + {entry.quantity} {entry.name || entry.id}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {canCustomizeThisItem && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openAddOnEditor(item)}
                                                        className="mt-2 text-xs font-medium text-primary-700 hover:text-primary-800"
                                                    >
                                                        Customize Add-ons
                                                    </button>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className="font-semibold">LKR {item.lineTotal.toFixed(2)}</p>
                                                <p className="text-xs text-gray-500">LKR {item.price.toFixed(2)} each</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="border-t pt-3 space-y-1">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Subtotal</span>
                                    <span>LKR {order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Discount</span>
                                    <span>- LKR {order.discountAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span>LKR {order.deliveryFee.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="border-t pt-3 flex justify-between font-semibold">
                                <span>Final Amount</span>
                                <span className="text-primary-600">LKR {order.finalAmount.toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-3">
                                <p className="text-gray-600">Payment Method:</p>
                                <p className="font-medium">{paymentMethodLabel(order.paymentMethod)}</p>
                                {order.paymentStatus && (
                                    <p className="text-xs text-gray-500">Status: {order.paymentStatus}</p>
                                )}
                                {loadingAddOnContext && (
                                    <p className="text-xs text-gray-500 mt-1">Loading item customization options...</p>
                                )}
                                {!loadingAddOnContext && addOnContext.reason && (
                                    <p className="text-xs text-amber-700 mt-1">{addOnContext.reason}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {order.orderType === 'DELIVERY' && order.status !== 'CANCELLED' && order.deliveryAddress && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="font-semibold mb-4">Delivery Information</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-start">
                                    <FaMapMarkerAlt className="text-primary-600 mt-1 mr-2" />
                                    <div>
                                        <p className="font-medium">Delivery Address</p>
                                        <p className="text-gray-600">
                                            {order.deliveryAddress.line1}<br />
                                            {order.deliveryAddress.city}, {order.deliveryAddress.district}
                                        </p>
                                    </div>
                                </div>
                                {order.deliveryPerson && (
                                    <div className="flex items-start">
                                        <FaPhone className="text-primary-600 mt-1 mr-2" />
                                        <div>
                                            <p className="font-medium">Delivery Person</p>
                                            <p className="text-gray-600">{order.deliveryPerson.name}</p>
                                            <p className="text-gray-600">{order.deliveryPerson.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCancelModal && (
                <Modal
                    isOpen={showCancelModal}
                    onClose={() => setShowCancelModal(false)}
                    title="Cancel Order"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            Are you sure you want to cancel this order?
                        </p>

                        {order.paymentMethod === 'ONLINE' && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <p className="text-sm text-blue-800">
                                    <strong>Refund Information:</strong><br />
                                    Refunds for online payments are reviewed and processed through the payment provider. Processing time may vary by provider.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button onClick={handleCancelOrder} variant="danger" disabled={isCancelling}>
                                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
                            </Button>
                            <Button onClick={() => setShowCancelModal(false)} variant="outline">
                                Keep Order
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {showItemPreviewModal && selectedItem && (
                <Modal
                    isOpen={showItemPreviewModal}
                    onClose={closeItemPreview}
                    title={selectedItem.name}
                    size="xl"
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="rounded-lg overflow-hidden bg-gray-100 h-64">
                                {selectedItem.image ? (
                                    <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No image available</div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-2">{selectedItem.itemType === 'MENU' ? 'Menu Item' : 'Combo Pack'}</p>
                                <p className="text-base text-gray-700 mb-4">{selectedItem.description}</p>
                                <p className="text-2xl font-bold text-primary-600 mb-4">LKR {toMoney(selectedItem.price).toFixed(2)}</p>
                                <Button
                                    onClick={() => quickAddToCart({
                                        id: selectedItem.itemId,
                                        type: selectedItem.itemType === 'MENU' ? 'menu' : 'combo',
                                        name: selectedItem.name,
                                        price: toMoney(selectedItem.price),
                                        image: selectedItem.image
                                    })}
                                >
                                    Quick Add to Cart
                                </Button>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3">Similar Items</h4>
                            {loadingRelatedItems ? (
                                <p className="text-sm text-gray-500">Loading related items...</p>
                            ) : relatedItems.length === 0 ? (
                                <p className="text-sm text-gray-500">No related items found.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {relatedItems.map((entry) => {
                                        const isCompared = comparisonIds.includes(entry.id);

                                        return (
                                            <div key={`${entry.type}:${entry.id}`} className="border border-gray-200 rounded-lg p-3">
                                                <div className="h-28 rounded bg-gray-100 overflow-hidden mb-2">
                                                    {entry.image ? (
                                                        <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                                                    )}
                                                </div>
                                                <p className="font-medium text-sm line-clamp-1">{entry.name}</p>
                                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{entry.description}</p>
                                                <p className="text-sm font-semibold text-primary-600 mt-2">LKR {entry.price.toFixed(2)}</p>

                                                <div className="flex items-center justify-between mt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCompareItem(entry.id)}
                                                        className={`text-xs font-medium ${isCompared ? 'text-primary-700' : 'text-gray-600'} hover:text-primary-700`}
                                                    >
                                                        {isCompared ? 'Compared' : 'Compare'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => quickAddToCart(entry)}
                                                        className="text-xs font-medium text-primary-700 hover:text-primary-800"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {comparedItems.length > 1 && (
                            <div>
                                <h4 className="font-semibold mb-3">Quick Comparison</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {comparedItems.map((entry, index) => (
                                        <div key={`${entry.type}:${entry.id || index}`} className="border border-gray-200 rounded-lg p-3">
                                            <p className="font-medium text-sm">{entry.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">Price</p>
                                            <p className="text-base font-semibold text-primary-700">LKR {toMoney(entry.price).toFixed(2)}</p>
                                            <p className="text-xs text-gray-500 mt-2 line-clamp-3">{entry.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {showAddOnModal && editingAddOnContextItem && editingOrderItem && (
                <Modal
                    isOpen={showAddOnModal}
                    onClose={closeAddOnEditor}
                    title={`Customize: ${editingOrderItem.name}`}
                    size="lg"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Add extras to your item. Changes are only allowed before preparation starts.
                        </p>

                        {(editingAddOnContextItem.availableAddOns || []).map((entry) => {
                            const currentQty = Number(editableAddOnSelections[entry.id] || 0);
                            const enabled = currentQty > 0;

                            return (
                                <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <label className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={enabled}
                                                onChange={(event) => setAddOnEnabled(entry.id, event.target.checked)}
                                            />
                                            <span className="text-sm font-medium">{entry.name}</span>
                                        </label>
                                        <span className="text-sm text-gray-700">LKR {toMoney(entry.price).toFixed(2)}</span>
                                    </div>

                                    {enabled && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => adjustAddOnQuantity(entry.id, currentQty - 1, entry.maxQuantity)}
                                                className="w-7 h-7 rounded border border-gray-300 text-sm"
                                                disabled={currentQty <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="text-sm min-w-[2rem] text-center">{currentQty}</span>
                                            <button
                                                type="button"
                                                onClick={() => adjustAddOnQuantity(entry.id, currentQty + 1, entry.maxQuantity)}
                                                className="w-7 h-7 rounded border border-gray-300 text-sm"
                                                disabled={currentQty >= Number(entry.maxQuantity || 1)}
                                            >
                                                +
                                            </button>
                                            <span className="text-xs text-gray-500">max {entry.maxQuantity}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3 text-sm">
                            <div className="flex justify-between">
                                <span>Base unit price</span>
                                <span>LKR {editingBaseUnitPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Add-ons per unit</span>
                                <span>LKR {editingExtrasPerUnit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-blue-200 pt-2 mt-2">
                                <span>Updated unit price</span>
                                <span>LKR {editingUpdatedUnitPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span>Updated line total ({editingQuantity}x)</span>
                                <span>LKR {editingLineTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-blue-200 pt-2 mt-2">
                                <span>Projected order total</span>
                                <span>LKR {projectedFinalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={closeAddOnEditor} disabled={isSavingAddOns}>
                                Cancel
                            </Button>
                            <Button onClick={saveAddOnSelections} disabled={isSavingAddOns}>
                                {isSavingAddOns ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            <Toast
                message={toastMessage}
                type={toastType}
                isVisible={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
};

export default OrderTracking;
