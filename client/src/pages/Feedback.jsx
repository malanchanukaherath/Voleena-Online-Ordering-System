import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import { FaStar } from 'react-icons/fa';
import { submitFeedback } from '../services/feedbackService';
import { getOrderById } from '../services/orderApi';

const POSITIVE_TAGS = ['Good taste', 'Fast delivery'];
const ISSUE_TAGS = ['Late delivery', 'Wrong item', 'Poor packaging'];

const Feedback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderIdParam = searchParams.get('orderId');

    const [formData, setFormData] = useState({
        rating: 0,
        comment: '',
        positiveTags: [],
        issueTags: []
    });
    const [errors, setErrors] = useState({});
    const [hoveredStar, setHoveredStar] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [order, setOrder] = useState(null);
    const [isLoadingOrder, setIsLoadingOrder] = useState(true);
    const [orderError, setOrderError] = useState('');

    const orderId = useMemo(() => {
        const value = Number.parseInt(orderIdParam, 10);
        return Number.isInteger(value) && value > 0 ? value : null;
    }, [orderIdParam]);

    useEffect(() => {
        const loadOrder = async () => {
            if (!orderId) {
                setOrderError('Feedback must be linked to a delivered order.');
                setIsLoadingOrder(false);
                return;
            }

            try {
                setIsLoadingOrder(true);
                setOrderError('');
                const response = await getOrderById(orderId);
                const data = response.data?.data;

                if (!data) {
                    setOrderError('Order not found.');
                    return;
                }

                if (data.Status !== 'DELIVERED') {
                    setOrderError('Feedback is available only after the order is delivered.');
                    return;
                }

                setOrder(data);
            } catch (error) {
                const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to load order details';
                setOrderError(message);
            } finally {
                setIsLoadingOrder(false);
            }
        };

        loadOrder();
    }, [orderId]);

    const handleRating = (rating) => {
        setFormData((prev) => ({ ...prev, rating }));
        if (errors.rating) {
            setErrors((prev) => ({ ...prev, rating: '' }));
        }
    };

    const toggleTag = (group, value) => {
        setFormData((prev) => {
            const current = prev[group];
            const exists = current.includes(value);
            return {
                ...prev,
                [group]: exists ? current.filter((item) => item !== value) : [...current, value]
            };
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.rating) {
            newErrors.rating = 'Please select a rating';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || !orderId || !order) {
            return;
        }

        setSubmitError('');
        setIsSubmitting(true);

        try {
            await submitFeedback({
                orderId,
                rating: formData.rating,
                comment: formData.comment.trim(),
                positiveTags: formData.positiveTags,
                issueTags: formData.issueTags
            });
            setSubmitted(true);
        } catch (error) {
            const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to submit feedback';
            setSubmitError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderOrderItems = () => {
        const items = Array.isArray(order?.items) ? order.items : [];
        if (items.length === 0) {
            return <p className="text-sm text-gray-500 dark:text-slate-400">No item details found.</p>;
        }

        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {items.map((item) => {
                    const label = item.menuItem?.Name || item.combo?.Name || 'Item';
                    return (
                        <span key={item.OrderItemID || `${label}-${item.Quantity}`} className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 dark:bg-slate-700 dark:text-slate-300">
                            {item.Quantity}x {label}
                        </span>
                    );
                })}
            </div>
        );
    };

    if (submitted) {
        return (
            <div className="max-w-3xl mx-auto">
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-green-700 mb-2">Thank You!</h2>
                    <p className="text-green-600 mb-4">Your feedback has been submitted successfully.</p>
                    <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Share Feedback</h1>
                <p className="text-gray-600 dark:text-slate-400">Your feedback is linked to this delivered order.</p>
            </div>

            {isLoadingOrder ? (
                <div className="bg-white rounded-lg shadow p-6 dark:bg-slate-800 dark:text-slate-300">Loading order details...</div>
            ) : orderError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 dark:bg-red-950/40 dark:border-red-800">
                    <p className="text-red-700 mb-4 dark:text-red-400">{orderError}</p>
                    <Button variant="outline" onClick={() => navigate('/orders')}>Back to Orders</Button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6 dark:bg-slate-800 dark:shadow-slate-900/50">
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:bg-slate-700 dark:border-slate-600">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-200">Order Context</h2>
                        <p className="text-sm text-gray-600 mt-1 dark:text-slate-400">Order ID: #{order.OrderID} · {new Date(order.CreatedAt).toLocaleString()}</p>
                        {renderOrderItems()}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">
                            ⭐ Rate your order <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleRating(star)}
                                    onMouseEnter={() => setHoveredStar(star)}
                                    onMouseLeave={() => setHoveredStar(0)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <FaStar
                                        className={`w-10 h-10 ${star <= (hoveredStar || formData.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    />
                                </button>
                            ))}
                        </div>
                        {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
                    </div>

                    <Textarea
                        label="💬 Write your feedback (optional)"
                        name="comment"
                        value={formData.comment}
                        onChange={(e) => setFormData((prev) => ({ ...prev, comment: e.target.value }))}
                        placeholder="Write your feedback (optional)"
                        rows={4}
                        maxLength={500}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">👍 What did you like? (optional)</label>
                        <div className="flex flex-wrap gap-2">
                            {POSITIVE_TAGS.map((tag) => (
                                <label key={tag} className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.positiveTags.includes(tag)}
                                        onChange={() => toggleTag('positiveTags', tag)}
                                    />
                                    {tag}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-300">👎 Issues? (optional)</label>
                        <div className="flex flex-wrap gap-2">
                            {ISSUE_TAGS.map((tag) => (
                                <label key={tag} className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-sm dark:border-slate-600 dark:text-slate-300">
                                    <input
                                        type="checkbox"
                                        checked={formData.issueTags.includes(tag)}
                                        onChange={() => toggleTag('issueTags', tag)}
                                    />
                                    {tag}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button type="submit" className="flex-1" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/orders')}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </div>

                    {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                </form>
            )}
        </div>
    );
};

export default Feedback;
