const { Feedback, Order, Customer, Staff } = require('../models');

const normalizeFeedbackType = (value) => {
    const type = String(value || 'ORDER').trim().toUpperCase();
    if (['ORDER', 'DELIVERY', 'GENERAL'].includes(type)) {
        return type;
    }
    return 'ORDER';
};

const getFeedbackErrorMessage = (error, fallback) => {
    return error?.message || error?.original?.sqlMessage || fallback;
};

exports.submitFeedback = async (req, res) => {
    try {
        const customerId = req.user.id;
        const rating = Number.parseInt(req.body.rating, 10);
        const comment = String(req.body.comment || '').trim();
        const feedbackType = normalizeFeedbackType(req.body.feedbackType || req.body.feedback_type);
        const providedOrderId = req.body.orderId || req.body.order_id;
        const providedOrderNumber = String(req.body.orderNumber || req.body.order_number || '').trim();

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        if (!comment) {
            return res.status(400).json({
                success: false,
                message: 'Feedback comment is required'
            });
        }

        let order = null;
        const requireOrderLink = feedbackType === 'ORDER' || feedbackType === 'DELIVERY';

        if (providedOrderId || providedOrderNumber || requireOrderLink) {
            const orderWhere = {
                CustomerID: customerId
            };

            if (providedOrderId) {
                orderWhere.OrderID = Number.parseInt(providedOrderId, 10);
            } else if (providedOrderNumber) {
                orderWhere.OrderNumber = providedOrderNumber;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Order ID or order number is required for order or delivery feedback'
                });
            }

            order = await Order.findOne({ where: orderWhere });

            if (!order) {
                return res.status(403).json({
                    success: false,
                    message: 'Order not found for this customer'
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
                    message: 'Feedback already submitted for this order and type'
                });
            }
        }

        const feedback = await Feedback.create({
            Rating: rating,
            Comment: comment,
            CustomerID: customerId,
            OrderID: order?.OrderID || null,
            FeedbackType: feedbackType
        });

        return res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback
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
            data: feedbackList
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
        const feedbackType = req.query.type ? normalizeFeedbackType(req.query.type) : null;
        const where = feedbackType ? { FeedbackType: feedbackType } : {};

        const feedbackList = await Feedback.findAll({
            where,
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
            data: feedbackList
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
            data: refreshed
        });
    } catch (error) {
        console.error('Respond to feedback error:', error);
        return res.status(500).json({
            success: false,
            message: getFeedbackErrorMessage(error, 'Failed to save feedback response')
        });
    }
};