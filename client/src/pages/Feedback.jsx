import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import { FaStar } from 'react-icons/fa';

const Feedback = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        orderNumber: '',
        rating: 0,
        feedbackType: 'ORDER',
        comment: '',
    });
    const [errors, setErrors] = useState({});
    const [hoveredStar, setHoveredStar] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleRating = (rating) => {
        setFormData(prev => ({ ...prev, rating }));
        if (errors.rating) {
            setErrors(prev => ({ ...prev, rating: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.rating) newErrors.rating = 'Please select a rating';
        if (!formData.comment.trim()) newErrors.comment = 'Please provide your feedback';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setSubmitError('Feedback submission is not available yet. Please try again later.');
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-green-700 mb-2">Thank You!</h2>
                    <p className="text-green-600 mb-4">Your feedback has been submitted successfully.</p>
                    <p className="text-sm text-gray-600">We appreciate your input and will use it to improve our service.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Share Your Feedback</h1>
                <p className="text-gray-600">We'd love to hear about your experience</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Order Number (Optional) */}
                <Input
                    label="Order Number (Optional)"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleChange}
                    placeholder="e.g., ORD-2024-001"
                    helperText="If you want to provide feedback about a specific order"
                />

                {/* Feedback Type */}
                <Select
                    label="Feedback Type"
                    name="feedbackType"
                    value={formData.feedbackType}
                    onChange={handleChange}
                    options={[
                        { value: 'ORDER', label: 'Order Experience' },
                        { value: 'DELIVERY', label: 'Delivery Service' },
                        { value: 'GENERAL', label: 'General Feedback' },
                    ]}
                    required
                />

                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating <span className="text-red-500">*</span>
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
                                    className={`w-10 h-10 ${star <= (hoveredStar || formData.rating)
                                            ? 'text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            </button>
                        ))}
                        <span className="ml-4 text-sm text-gray-600">
                            {formData.rating > 0 && (
                                <>
                                    {formData.rating === 1 && 'Poor'}
                                    {formData.rating === 2 && 'Fair'}
                                    {formData.rating === 3 && 'Good'}
                                    {formData.rating === 4 && 'Very Good'}
                                    {formData.rating === 5 && 'Excellent'}
                                </>
                            )}
                        </span>
                    </div>
                    {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
                </div>

                {/* Comment */}
                <Textarea
                    label="Your Feedback"
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    error={errors.comment}
                    placeholder="Tell us about your experience..."
                    rows={6}
                    maxLength={500}
                    required
                />

                {/* Submit Button */}
                <div className="flex gap-4">
                    <Button type="submit" className="flex-1">
                        Submit Feedback
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                </div>
                {submitError && (
                    <p className="text-sm text-red-600">{submitError}</p>
                )}
            </form>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Your Privacy Matters</p>
                <p>Your feedback helps us improve. We'll never share your information with third parties.</p>
            </div>
        </div>
    );
};

export default Feedback;
