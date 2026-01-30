const express = require('express');
const router = express.Router();
const { Staff, Role, Customer } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logStaffCreation } = require('../utils/auditLogger');

/**
 * GET /api/staff/roles
 * Admin-only: Get available staff roles
 */
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const roles = await Role.findAll({
            attributes: ['RoleID', 'RoleName']
        });

        // Filter out Customer role and map to frontend format
        const staffRoles = roles
            .filter(role => role.RoleName !== 'Customer')
            .map(role => ({
                id: role.RoleID,
                name: role.RoleName
            }));

        return res.json({ roles: staffRoles });
    } catch (error) {
        console.error('Get roles error:', error);
        return res.status(500).json({ error: 'Failed to retrieve roles' });
    }
});

/**
 * POST /api/staff
 * Admin-only: Create new staff account
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, phone, password, roleId } = req.body;

        // Validation
        if (!name || !email || !phone || !password || !roleId) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (name.trim().length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // ============================================================
        // PRE-EXISTENCE CHECK (CRITICAL)
        // ============================================================

        // Check if email already exists in Staff table
        const existingStaff = await Staff.findOne({
            where: { Email: normalizedEmail },
            include: [{
                model: Role,
                as: 'role',
                attributes: ['RoleID', 'RoleName']
            }]
        });

        if (existingStaff) {
            // Log duplicate attempt
            await logStaffCreation(req, existingStaff, existingStaff.role?.RoleName || 'Unknown', false);

            return res.status(409).json({
                error: 'A staff account with this email already exists.',
                existingStaff: {
                    id: existingStaff.StaffID,
                    name: existingStaff.Name,
                    email: existingStaff.Email,
                    role: existingStaff.role?.RoleName,
                    isActive: existingStaff.IsActive
                }
            });
        }

        // Check if email exists in Customer table (prevent cross-contamination)
        const existingCustomer = await Customer.findOne({
            where: { Email: normalizedEmail }
        });

        if (existingCustomer) {
            return res.status(409).json({
                error: 'This email is already registered as a customer account.'
            });
        }

        // ============================================================
        // ROLE VALIDATION
        // ============================================================

        // Verify role exists and is a staff role (not Customer)
        const role = await Role.findByPk(roleId);
        if (!role) {
            return res.status(400).json({ error: 'Invalid role ID' });
        }

        if (role.RoleName === 'Customer') {
            return res.status(400).json({
                error: 'Cannot create Customer as Staff. Use customer registration endpoint.'
            });
        }

        // Valid staff roles: Admin, Cashier, Kitchen, Delivery
        const validStaffRoles = ['Admin', 'Cashier', 'Kitchen', 'Delivery'];
        if (!validStaffRoles.includes(role.RoleName)) {
            return res.status(400).json({ error: 'Invalid staff role' });
        }

        // ============================================================
        // CREATE STAFF ACCOUNT
        // ============================================================

        const staff = await Staff.create({
            Name: name.trim(),
            Email: normalizedEmail,
            Phone: phone.trim(),
            Password: password,  // Will be hashed by model beforeCreate hook
            RoleID: roleId,
            IsActive: true
        });

        // Log staff creation
        await logStaffCreation(req, staff, role.RoleName, true);

        return res.status(201).json({
            message: 'Staff account created successfully',
            staff: {
                id: staff.StaffID,
                name: staff.Name,
                email: staff.Email,
                phone: staff.Phone,
                role: role.RoleName,
                isActive: staff.IsActive
            }
        });
    } catch (error) {
        console.error('Staff creation error:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: error.errors.map(e => e.message).join(', ')
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Email already registered' });
        }

        return res.status(500).json({ error: 'Failed to create staff account' });
    }
});

/**
 * GET /api/staff
 * Admin-only: Get all staff accounts
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const staff = await Staff.findAll({
            include: [{
                model: Role,
                as: 'role',
                attributes: ['RoleID', 'RoleName']
            }],
            attributes: { exclude: ['Password'] },
            order: [['CreatedAt', 'DESC']]
        });

        return res.json({ staff });
    } catch (error) {
        console.error('Get staff error:', error);
        return res.status(500).json({ error: 'Failed to retrieve staff' });
    }
});

/**
 * PATCH /api/staff/:id
 * Admin-only: Update staff account (activate/deactivate)
 */
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const staff = await Staff.findByPk(id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        if (typeof isActive === 'boolean') {
            staff.IsActive = isActive;
            await staff.save();
        }

        return res.json({
            message: 'Staff updated successfully',
            staff: {
                id: staff.StaffID,
                name: staff.Name,
                isActive: staff.IsActive
            }
        });
    } catch (error) {
        console.error('Update staff error:', error);
        return res.status(500).json({ error: 'Failed to update staff' });
    }
});

module.exports = router;
