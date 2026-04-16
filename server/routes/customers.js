const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Customer, Address } = require('../models');
const { requireAdmin, requireCashier, requireCustomer } = require('../middleware/auth');
const { logCustomerCreation } = require('../utils/auditLogger');

const normalizeOptionalEmail = (email) => {
    if (email === undefined || email === null) {
        return null;
    }

    const trimmed = String(email).trim().toLowerCase();
    return trimmed || null;
};

const normalizePhone = (phone) => String(phone || '').replace(/\s/g, '');

const isValidProfileName = (name) => typeof name === 'string' && name.trim().length >= 2;
const isValidProfileEmail = (email) => email === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidProfilePhone = (phone) => /^[+]?[0-9]{9,15}$/.test(phone);
const isValidNotificationPreference = (value) => ['EMAIL', 'SMS', 'BOTH'].includes(value);

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

const handleAddressTableMissing = (res, error) => {
    if (!isAddressTableMissingError(error)) {
        return false;
    }

    return res.status(503).json({
        error: 'Address features are temporarily unavailable. Please contact support.'
    });
};

const findCustomerWithOptionalAddresses = async (customerId, attributes) => {
    try {
        const customer = await Customer.findByPk(customerId, {
            attributes,
            include: [{
                model: Address,
                as: 'addresses'
            }]
        });

        if (!customer) {
            return { customer: null, addressUnavailable: false };
        }

        return { customer, addressUnavailable: false };
    } catch (error) {
        if (!isAddressTableMissingError(error)) {
            throw error;
        }

        const customer = await Customer.findByPk(customerId, { attributes });
        if (!customer) {
            return { customer: null, addressUnavailable: true };
        }

        const payload = customer.toJSON();
        payload.addresses = [];

        return { customer: payload, addressUnavailable: true };
    }
};

const createAddressForCustomer = async (customerId, payload = {}) => {
    const { addressLine1, addressLine2, city, postalCode, district, latitude, longitude } = payload;

    const normalizedAddressLine1 = String(addressLine1 || '').trim();
    const normalizedCity = String(city || '').trim();

    if (!normalizedAddressLine1 || !normalizedCity) {
        return { error: 'Address line 1 and city are required', status: 400 };
    }

    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const hasCoordinates = Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude);

    const address = await Address.create({
        CustomerID: customerId,
        AddressLine1: normalizedAddressLine1,
        AddressLine2: addressLine2 ? addressLine2.trim() : null,
        City: normalizedCity,
        PostalCode: postalCode ? postalCode.trim() : null,
        District: district ? district.trim() : null,
        Latitude: hasCoordinates ? parsedLatitude : null,
        Longitude: hasCoordinates ? parsedLongitude : null
    });

    return { address };
};

/**
 * POST /api/customers
 * Admin/Cashier: Manually register a new customer
 * Checks for duplicates by phone and email
 */
router.post('/', requireCashier, async (req, res) => {
    try {
        const { name, phone, email, address, password, profileImageUrl, ProfileImageURL } = req.body;

        // Validation
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        // Validate phone format
        const cleanPhone = phone.replace(/\s/g, '');
        if (!/^[+]?[0-9]{9,15}$/.test(cleanPhone)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Validate email if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const normalizedEmail = email ? email.trim().toLowerCase() : null;

        // ============================================================
        // PRE-EXISTENCE CHECK (CRITICAL)
        // ============================================================

        // Check by phone (mandatory unique)
        let existingCustomer = await Customer.findOne({
            where: { Phone: cleanPhone }
        });

        // Check by email if provided
        if (!existingCustomer && normalizedEmail) {
            existingCustomer = await Customer.findOne({
                where: { Email: normalizedEmail }
            });
        }

        // If customer exists, return existing customer details
        if (existingCustomer) {
            // Log duplicate attempt
            await logCustomerCreation(req, existingCustomer, false);

            return res.status(200).json({
                exists: true,
                message: 'Customer already exists with this phone number/email.',
                customer: {
                    id: existingCustomer.CustomerID,
                    name: existingCustomer.Name,
                    phone: existingCustomer.Phone,
                    email: existingCustomer.Email,
                    accountStatus: existingCustomer.AccountStatus,
                    isActive: existingCustomer.IsActive,
                    isEmailVerified: existingCustomer.IsEmailVerified,
                    isPhoneVerified: existingCustomer.IsPhoneVerified
                }
            });
        }

        // ============================================================
        // CREATE NEW CUSTOMER
        // ============================================================

        // Generate secure password if not provided
        const customerPassword = password || crypto.randomBytes(8).toString('hex');

        // Create customer
        const customer = await Customer.create({
            Name: name.trim(),
            Phone: cleanPhone,
            Email: normalizedEmail,
            ProfileImageURL: profileImageUrl || ProfileImageURL || null,
            Password: customerPassword, // Will be hashed by model hook
            IsActive: true,
            AccountStatus: 'ACTIVE',
            IsEmailVerified: false,
            IsPhoneVerified: false,
            PreferredNotification: 'BOTH'
        });

        // Create address if provided
        let customerAddress = null;
        if (address && address.addressLine1 && address.city) {
            customerAddress = await Address.create({
                CustomerID: customer.CustomerID,
                AddressLine1: address.addressLine1.trim(),
                AddressLine2: address.addressLine2?.trim() || null,
                City: address.city.trim(),
                PostalCode: address.postalCode?.trim() || null,
                Latitude: address.latitude || null,
                Longitude: address.longitude || null
            });
        }

        // Log customer creation
        await logCustomerCreation(req, customer, true);

        return res.status(201).json({
            exists: false,
            message: 'Customer created successfully',
            customer: {
                id: customer.CustomerID,
                name: customer.Name,
                phone: customer.Phone,
                email: customer.Email,
                accountStatus: customer.AccountStatus,
                isActive: customer.IsActive,
                temporaryPassword: password ? undefined : customerPassword // Only return if auto-generated
            },
            address: customerAddress ? {
                id: customerAddress.AddressID,
                addressLine1: customerAddress.AddressLine1,
                city: customerAddress.City,
                postalCode: customerAddress.PostalCode
            } : null
        });

    } catch (error) {
        console.error('Customer registration error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: error.errors.map(e => e.message).join(', ')
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                error: 'Customer with this phone or email already exists'
            });
        }

        return res.status(500).json({ error: 'Failed to register customer' });
    }
});

/**
 * GET /api/customers
 * Admin/Cashier: Get all customers
 */
router.get('/', requireCashier, async (req, res) => {
    try {
        const { status, search, limit = 50, offset = 0 } = req.query;
        const parsedLimit = Number.parseInt(limit, 10);
        const parsedOffset = Number.parseInt(offset, 10);
        const safeLimit = Number.isNaN(parsedLimit) ? 50 : Math.min(Math.max(parsedLimit, 1), 200);
        const safeOffset = Number.isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0);

        const where = {};

        if (status) {
            where.AccountStatus = status.toUpperCase();
        }

        if (search) {
            const { Op } = require('sequelize');
            where[Op.or] = [
                { Name: { [Op.like]: `%${search}%` } },
                { Phone: { [Op.like]: `%${search}%` } },
                { Email: { [Op.like]: `%${search}%` } }
            ];
        }

        const customers = await Customer.findAll({
            where,
            attributes: { exclude: ['Password'] },
            limit: safeLimit,
            offset: safeOffset,
            order: [['created_at', 'DESC']]
        });

        return res.json({ customers, count: customers.length });
    } catch (error) {
        console.error('Get customers error:', error);
        return res.status(500).json({ error: 'Failed to retrieve customers' });
    }
});

/**
 * GET /api/customers/me
 * Customer: Get current profile and addresses
 */
router.get('/me', requireCustomer, async (req, res) => {
    try {
        const { customer, addressUnavailable } = await findCustomerWithOptionalAddresses(
            req.user.id,
            { exclude: ['Password'] }
        );

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        return res.json({
            success: true,
            data: customer,
            ...(addressUnavailable ? { warning: 'Address features are temporarily unavailable.' } : {})
        });
    } catch (error) {
        console.error('Get customer profile error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to retrieve customer profile' });
    }
});

/**
 * PUT /api/customers/me
 * Customer: Update own profile settings
 */
router.put('/me', requireCustomer, async (req, res) => {
    try {
        const { name, email, phone, preferredNotification, profileImageUrl, ProfileImageURL } = req.body;

        const customer = await Customer.findByPk(req.user.id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedEmail = normalizeOptionalEmail(email);
        const normalizedPhone = normalizePhone(phone);
        const normalizedPreferredNotification = preferredNotification
            ? String(preferredNotification).trim().toUpperCase()
            : customer.PreferredNotification;

        if (!isValidProfileName(normalizedName)) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        if (!normalizedEmail || !isValidProfileEmail(normalizedEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!isValidProfilePhone(normalizedPhone)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        if (!isValidNotificationPreference(normalizedPreferredNotification)) {
            return res.status(400).json({ error: 'Preferred notification must be EMAIL, SMS, or BOTH' });
        }

        const duplicateCustomer = await Customer.findOne({
            where: {
                CustomerID: { [Op.ne]: req.user.id },
                [Op.or]: [
                    { Email: normalizedEmail },
                    { Phone: normalizedPhone }
                ]
            }
        });

        if (duplicateCustomer) {
            if (normalizedEmail && duplicateCustomer.Email === normalizedEmail) {
                return res.status(409).json({ error: 'Email is already used by another customer' });
            }

            if (duplicateCustomer.Phone === normalizedPhone) {
                return res.status(409).json({ error: 'Phone number is already used by another customer' });
            }
        }

        customer.Name = normalizedName;
        customer.Email = normalizedEmail;
        customer.Phone = normalizedPhone;
        customer.PreferredNotification = normalizedPreferredNotification;

        if (profileImageUrl !== undefined || ProfileImageURL !== undefined) {
            customer.ProfileImageURL = profileImageUrl || ProfileImageURL || null;
        }

        await customer.save();

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            data: customer.toJSON()
        });
    } catch (error) {
        console.error('Update current customer profile error:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: error.errors.map(e => e.message).join(', ')
            });
        }

        return res.status(500).json({ error: 'Failed to update customer profile' });
    }
});

/**
 * PUT /api/customers/me/password
 * Customer: Change own password
 */
router.put('/me/password', requireCustomer, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (String(newPassword).length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        const customer = await Customer.findByPk(req.user.id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const passwordMatches = await bcrypt.compare(currentPassword, customer.Password);
        if (!passwordMatches) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        customer.Password = newPassword;
        await customer.save();

        return res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Update customer password error:', error);
        return res.status(500).json({ error: 'Failed to update password' });
    }
});

/**
 * GET /api/customers/me/addresses
 * Customer: List saved addresses
 */
router.get('/me/addresses', requireCustomer, async (req, res) => {
    try {
        const addresses = await Address.findAll({
            where: { CustomerID: req.user.id },
            order: [['created_at', 'DESC']]
        });

        return res.json({ success: true, data: addresses });
    } catch (error) {
        console.error('Get customer addresses error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to retrieve addresses' });
    }
});

/**
 * POST /api/customers/me/addresses
 * Customer: Add a new address
 */
router.post('/me/addresses', requireCustomer, async (req, res) => {
    try {
        const result = await createAddressForCustomer(req.user.id, req.body);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const { address } = result;

        return res.status(201).json({
            success: true,
            addressId: address.AddressID,
            address: {
                id: address.AddressID,
                addressLine1: address.AddressLine1,
                city: address.City,
                postalCode: address.PostalCode,
                latitude: address.Latitude,
                longitude: address.Longitude
            }
        });
    } catch (error) {
        console.error('Create address error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to create address' });
    }
});

/**
 * DELETE /api/customers/me/addresses/:addressId
 * Customer: Delete own address
 */
router.delete('/me/addresses/:addressId', requireCustomer, async (req, res) => {
    try {
        const { addressId } = req.params;

        const address = await Address.findOne({
            where: {
                AddressID: addressId,
                CustomerID: req.user.id
            }
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        await address.destroy();
        return res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Delete customer address error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to delete address' });
    }
});

/**
 * GET /api/customers/:id
 * Admin/Cashier: Get customer by ID
 */
router.get('/:id', requireCashier, async (req, res) => {
    try {
        const { id } = req.params;

        const { customer, addressUnavailable } = await findCustomerWithOptionalAddresses(
            id,
            { exclude: ['Password'] }
        );

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        return res.json({
            customer,
            ...(addressUnavailable ? { warning: 'Address features are temporarily unavailable.' } : {})
        });
    } catch (error) {
        console.error('Get customer error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to retrieve customer' });
    }
});

/**
 * POST /api/customers/:id/addresses
 * Admin/Cashier: Add address for a customer
 */
router.post('/:id/addresses', requireCashier, async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findByPk(id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const result = await createAddressForCustomer(customer.CustomerID, req.body);
        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        const { address } = result;

        return res.status(201).json({
            success: true,
            message: 'Address added successfully',
            addressId: address.AddressID,
            address
        });
    } catch (error) {
        console.error('Create customer address by staff error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to create customer address' });
    }
});

/**
 * PUT /api/customers/:id/addresses/:addressId
 * Admin: Update customer address
 */
router.put('/:id/addresses/:addressId', requireAdmin, async (req, res) => {
    try {
        const { id, addressId } = req.params;
        const { addressLine1, addressLine2, city, postalCode, district, latitude, longitude } = req.body;

        const customer = await Customer.findByPk(id);
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const address = await Address.findOne({
            where: {
                AddressID: addressId,
                CustomerID: customer.CustomerID
            }
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found for this customer' });
        }

        if (addressLine1 !== undefined) {
            const normalized = String(addressLine1).trim();
            if (!normalized) {
                return res.status(400).json({ error: 'Address line 1 cannot be empty' });
            }
            address.AddressLine1 = normalized;
        }

        if (city !== undefined) {
            const normalized = String(city).trim();
            if (!normalized) {
                return res.status(400).json({ error: 'City cannot be empty' });
            }
            address.City = normalized;
        }

        if (addressLine2 !== undefined) address.AddressLine2 = addressLine2 ? String(addressLine2).trim() : null;
        if (postalCode !== undefined) address.PostalCode = postalCode ? String(postalCode).trim() : null;
        if (district !== undefined) address.District = district ? String(district).trim() : null;
        if (latitude !== undefined) address.Latitude = latitude || null;
        if (longitude !== undefined) address.Longitude = longitude || null;

        await address.save();

        return res.json({ success: true, message: 'Address updated successfully', address });
    } catch (error) {
        console.error('Update customer address by admin error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to update customer address' });
    }
});

/**
 * DELETE /api/customers/:id/addresses/:addressId
 * Admin: Delete customer address
 */
router.delete('/:id/addresses/:addressId', requireAdmin, async (req, res) => {
    try {
        const { id, addressId } = req.params;
        const customer = await Customer.findByPk(id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const address = await Address.findOne({
            where: {
                AddressID: addressId,
                CustomerID: customer.CustomerID
            }
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found for this customer' });
        }

        await address.destroy();
        return res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Delete customer address by admin error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to delete customer address' });
    }
});

/**
 * PUT /api/customers/:id
 * Admin/Cashier: Update customer details
 */
router.put('/:id', requireCashier, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, accountStatus } = req.body;

        const customer = await Customer.findByPk(id);

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        // Update fields
        if (name) customer.Name = name.trim();
        if (email !== undefined) customer.Email = email ? email.trim().toLowerCase() : null;
        if (phone) customer.Phone = phone.trim();
        if (accountStatus) customer.AccountStatus = accountStatus.toUpperCase();

        await customer.save();

        return res.json({
            message: 'Customer updated successfully',
            customer: {
                id: customer.CustomerID,
                name: customer.Name,
                email: customer.Email,
                phone: customer.Phone,
                accountStatus: customer.AccountStatus
            }
        });
    } catch (error) {
        console.error('Update customer error:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: error.errors.map(e => e.message).join(', ')
            });
        }

        return res.status(500).json({ error: 'Failed to update customer' });
    }
});

module.exports = router;
