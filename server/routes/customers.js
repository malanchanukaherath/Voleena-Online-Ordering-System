const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Customer, Address } = require('../models');
const { requireCashier, requireCustomer } = require('../middleware/auth');
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
        const customer = await Customer.findByPk(req.user.id, {
            attributes: { exclude: ['Password'] },
            include: [{
                model: Address,
                as: 'addresses'
            }]
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        return res.json({ success: true, data: customer });
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
        const { addressLine1, addressLine2, city, postalCode, district, latitude, longitude } = req.body;

        if (!addressLine1 || !city) {
            return res.status(400).json({ error: 'Address line 1 and city are required' });
        }

        let finalLat = latitude;
        let finalLng = longitude;

        // If coordinates not provided, try to geocode the address
        if (!finalLat || !finalLng) {
            try {
                const { geocodeAddress } = require('../services/distanceValidation');
                const addressText = `${addressLine1.trim()}${city ? ', ' + city.trim() : ''}${postalCode ? ', ' + postalCode.trim() : ''}`;
                // Pass city parameter for fallback geocoding (when API key not configured)
                const geocoded = await geocodeAddress(addressText, city);
                finalLat = geocoded.lat;
                finalLng = geocoded.lng;
                console.log(`Geocoded address: ${addressText} -> (${finalLat}, ${finalLng})`);
            } catch (geocodeError) {
                console.warn('Failed to geocode address, saving without coordinates:', geocodeError.message);
                // Continue without coordinates - validation will happen at order time
            }
        }

        const address = await Address.create({
            CustomerID: req.user.id,
            AddressLine1: addressLine1.trim(),
            AddressLine2: addressLine2 ? addressLine2.trim() : null,
            City: city.trim(),
            PostalCode: postalCode ? postalCode.trim() : null,
            District: district ? district.trim() : null,
            Latitude: finalLat || null,
            Longitude: finalLng || null
        });

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
 * GET /api/customers/:id
 * Admin/Cashier: Get customer by ID
 */
router.get('/:id', requireCashier, async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await Customer.findByPk(id, {
            attributes: { exclude: ['Password'] },
            include: [{
                model: Address,
                as: 'addresses'
            }]
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        return res.json({ customer });
    } catch (error) {
        console.error('Get customer error:', error);

        if (handleAddressTableMissing(res, error)) {
            return;
        }

        return res.status(500).json({ error: 'Failed to retrieve customer' });
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
