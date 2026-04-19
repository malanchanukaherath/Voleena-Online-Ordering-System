// CODEMAP: BACKEND_CONTROLLER_FEEDBACKCONTROLLER
// PURPOSE: Handles incoming requests, processes logic, and returns responses.
// SEARCH_HINT: Look here for request handling logic and data processing.
const { Feedback, Order, Customer, Staff } = require('../models');

// Code Review: Function getFeedbackErrorMessage in server\controllers\feedbackController.js. Used in: server/controllers/feedbackController.js.
const getFeedbackErrorMessage = (error, fallback) => {
    return error?.message || error?.original?.sqlMessage || fallback;
};

const ALLOWED_POSITIVE_TAGS = ['Good taste', 'Fast delivery'];
const ALLOWED_ISSUE_TAGS = ['Late delivery', 'Wrong item', 'Poor packaging'];

// Code Review: Function sanitizeTagArray in server\controllers\feedbackController.js. Used in: server/controllers/feedbackController.js.
const sanitizeTagArray = (value, allowed) => {
    if (!Array.isArray(value)) {
        return [];
    }

    const unique = [...new Set(value.map((tag) => String(tag || '').trim()))];
    return unique.filter((tag) => allowed.includes(tag));
};

// Code Review: Function encodeFeedbackPayload in server\controllers\feedbackController.js. Used in: server/controllers/feedbackController.js.
const encodeFeedbackPayload = ({ comment, positiveTags, issueTags }) => {
    return JSON.stringify({
        comment: String(comment || '').trim(),
        positiveTags: sanitizeTagArray(positiveTags, ALLOWED_POSITIVE_TAGS),
        issueTags: sanitizeTagArray(issueTags, ALLOWED_ISSUE_TAGS)
    });
};

// Code Review: Function decodeFeedbackPayload in server\controllers\feedbackController.js. Used in: server/controllers/adminController.js, server/controllers/feedbackController.js.
const decodeFeedbackPayload = (rawComment) => {
    const fallback = {
        comment: rawComment || '',
        positiveTags: [],
        issueTags: []
    };

    if (!rawComment || typeof rawComment !== 'string') {
        return fallback;
    }

    try {
        const parsed = JSON.parse(rawComment);
        if (!parsed || typeof parsed !== 'object') {
            return fallback;
        }

        return {
            comment: String(parsed.comment || ''),
            positiveTags: sanitizeTagArray(parsed.positiveTags, ALLOWED_POSITIVE_TAGS),
            issueTags: sanitizeTagArray(parsed.issueTags, ALLOWED_ISSUE_TAGS)
        };
    } catch {
        return fallback;
    }
};

// Code Review: Function toResponseFeedback in server\controllers\feedbackController.js. Used in: server/controllers/feedbackController.js.
const toResponseFeedback = (record) => {
    const plain = record?.get ? record.get({ plain: true }) : record;
    const decoded = decodeFeedbackPayload(plain.Comment);

    return {
        ...plain,
        Comment: decoded.comment,
        PositiveTags: decoded.positiveTags,
        IssueTags: decoded.issueTags
    };
};

exports.submitFeedback = async (req, res) => {
    try {
        const customerId = req.user.id;
        const rating = Number.parseInt(req.body.rating, 10);
        const comment = String(req.body.comment || '').trim();
        const providedOrderId = req.body.orderId || req.body.order_id;
        const positiveTags = sanitizeTagArray(req.body.positiveTags, ALLOWED_POSITIVE_TAGS);
        const issueTags = sanitizeTagArray(req.body.issueTags, ALLOWED_ISSUE_TAGS);
        const feedbackType = 'ORDER';

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const orderId = Number.parseInt(providedOrderId, 10);
        if (!Number.isInteger(orderId) || orderId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        const order = await Order.findOne({
            where: {
                OrderID: orderId,
                CustomerID: customerId
            }
        });

        if (!order) {
            return res.status(403).json({
                success: false,
                message: 'Order not found for this customer'
            });
        }

        if (order.Status !== 'DELIVERED') {
            return res.status(400).json({
                success: false,
                message: 'Feedback can only be submitted after delivery'
            });
        }

        const existing = await Feedback.findOne({
            where: {
                CustomerID: customerId,
                OrderID: order.OrderID,
                FeedbackType: feedbackType
            }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Feedback already submitted for this order'
            });
        }

        const feedback = await Feedback.create({
            Rating: rating,
            Comment: encodeFeedbackPayload({ comment, positiveTags, issueTags }),
            CustomerID: customerId,
            OrderID: order?.OrderID || null,
            FeedbackType: feedbackType
        });

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: toResponseFeedback(feedback)
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        return res.status(500).json({
            success: false,
            message: getFeedbackErrorMessage(error, 'Failed to submit feedback')
        });
    }
};

exports.getMyFeedback = async (req, res) => {
    try {
        const customerId = req.user.id;

        const feedbackList = await Feedback.findAll({
            where: { CustomerID: customerId },
            include: [
                {
                    model: Order,
                    as: 'order',
                    attributes: ['OrderID', 'OrderNumber', 'OrderType', 'Status']
                },
                {
                    model: Staff,
                    as: 'responder',
                    attributes: ['StaffID', 'Name']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return res.json({
            success: true,
            data: feedbackList.map(toResponseFeedback)
        });
    } catch (error) {
        console.error('Get my feedback error:', error);
        return res.status(500).json({
            success: false,
            message: getFeedbackErrorMessage(error, 'Failed to fetch feedback records')
        });
    }
};

exports.getAdminFeedback = async (req, res) => {
    try {
        const feedbackList = await Feedback.findAll({
            where: { FeedbackType: 'ORDER' },
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['CustomerID', 'Name', 'Email', 'Phone']
                },
                {
                    model: Order,
                    as: 'order',
                    attributes: ['OrderID', 'OrderNumber', 'OrderType', 'Status']
                },
                {
                    model: Staff,
                    as: 'responder',
                    attributes: ['StaffID', 'Name']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return res.json({
            success: true,
            data: feedbackList.map(toResponseFeedback)
        });
    } catch (error) {
        console.error('Get admin feedback error:', error);
        return res.status(500).json({
            success: false,
            message: getFeedbackErrorMessage(error, 'Failed to fetch feedback records')
        });
    }
};

exports.respondToFeedback = async (req, res) => {
    try {
        const feedbackId = Number.parseInt(req.params.id, 10);
        const adminId = req.user.id;
        const adminResponse = String(req.body.response || req.body.adminResponse || '').trim();

        if (!Number.isInteger(feedbackId) || feedbackId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feedback ID'
            });
        }

        if (!adminResponse) {
            return res.status(400).json({
                success: false,
                message: 'Response is required'
            });
        }

        const feedback = await Feedback.findByPk(feedbackId);
        if (!feedback) {
            return res.status(404).json({
                success: false,
                message: 'Feedback not found'
            });
        }

        feedback.AdminResponse = adminResponse;
        feedback.RespondedAt = new Date();
        feedback.RespondedBy = adminId;
        await feedback.save();

        const refreshed = await Feedback.findByPk(feedbackId, {
            include: [{
                model: Staff,
                as: 'responder',
                attributes: ['StaffID', 'Name']
            }]
        });

        return res.json({
            success: true,
            message: 'Feedback response saved successfully',
            data: toResponseFeedback(refreshed)
        });
    } catch (error) {
        console.error('Respond to feedback error:', error);
        return res.status(500).json({
            success: false,
            message: getFeedbackErrorMessage(error, 'Failed to save feedback response')
        });
    }
};
