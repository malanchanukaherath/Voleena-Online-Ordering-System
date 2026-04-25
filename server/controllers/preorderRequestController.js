const preorderRequestService = require('../services/preorderRequestService');

const parsePaging = (queryValue, fallback, max) => {
    const parsed = Number.parseInt(queryValue, 10);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(Math.max(parsed, 0), max);
};

exports.createPreorderRequest = async (req, res) => {
    try {
        const request = await preorderRequestService.createRequest(req.user.id, req.body || {});

        res.status(201).json({
            success: true,
            message: 'Preorder request submitted successfully',
            data: request
        });
    } catch (error) {
        const message = error.message || 'Failed to create preorder request';
        const statusCode = /required|valid|future|active/i.test(message) ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};

exports.getPreorderRequests = async (req, res) => {
    try {
        if (req.user.type === 'Staff' && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const limit = parsePaging(req.query.limit, 100, 200);
        const offset = parsePaging(req.query.offset, 0, 10000);
        const requests = await preorderRequestService.listRequests({
            user: req.user,
            status: req.query.status,
            limit,
            offset
        });

        res.json({
            success: true,
            data: requests,
            meta: {
                limit,
                offset,
                returnedCount: requests.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch preorder requests'
        });
    }
};

exports.getPreorderRequestById = async (req, res) => {
    try {
        if (req.user.type === 'Staff' && req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const request = await preorderRequestService.getRequestById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Preorder request not found'
            });
        }

        if (req.user.type === 'Customer' && request.CustomerID !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        return res.json({
            success: true,
            data: request
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch preorder request'
        });
    }
};

exports.updatePreorderRequestStatus = async (req, res) => {
    try {
        const request = await preorderRequestService.updateStatus(
            req.params.id,
            req.body || {},
            req.user.id
        );

        res.json({
            success: true,
            message: 'Preorder request updated successfully',
            data: request
        });
    } catch (error) {
        const message = error.message || 'Failed to update preorder request';
        const statusCode = /not found/i.test(message)
            ? 404
            : /required|cannot|unsupported/i.test(message)
                ? 400
                : 500;

        res.status(statusCode).json({
            success: false,
            message
        });
    }
};
