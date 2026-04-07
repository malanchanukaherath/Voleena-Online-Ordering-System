import React, { useEffect, useMemo, useState } from 'react';
import { FaStar, FaReply } from 'react-icons/fa';
import Select from '../components/ui/Select';
import FilterResetButton from '../components/ui/FilterResetButton';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import { getAdminFeedback, respondToFeedback } from '../services/feedbackService';

const FeedbackManagement = () => {
    const [typeFilter, setTypeFilter] = useState('');
    const [feedbacks, setFeedbacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [expandedResponseId, setExpandedResponseId] = useState(null);
    const [responseDraft, setResponseDraft] = useState('');
    const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

    const loadFeedback = async (type = '') => {
        try {
            setIsLoading(true);
            setErrorMessage('');
            const response = await getAdminFeedback(type ? { type } : {});
            setFeedbacks(Array.isArray(response.data?.data) ? response.data.data : []);
        } catch (error) {
            const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to load feedback records';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFeedback(typeFilter);
    }, [typeFilter]);

    const filteredFeedback = useMemo(() => {
        return feedbacks;
    }, [feedbacks]);
    const hasActiveFilters = Boolean(typeFilter);

    const clearFilters = () => {
        setTypeFilter('');
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <FaStar key={i} className={`inline w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
        ));
    };

    const formatFeedbackDate = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
    };

    const handleOpenReply = (feedback) => {
        setExpandedResponseId(feedback.FeedbackID);
        setResponseDraft(feedback.AdminResponse || '');
    };

    const handleSubmitReply = async (feedbackId) => {
        if (!responseDraft.trim()) {
            return;
        }

        try {
            setIsSubmittingResponse(true);
            setErrorMessage('');
            await respondToFeedback(feedbackId, responseDraft.trim());
            setExpandedResponseId(null);
            setResponseDraft('');
            await loadFeedback(typeFilter);
        } catch (error) {
            const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to save response';
            setErrorMessage(message);
        } finally {
            setIsSubmittingResponse(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Feedback Management</h1>
                <p className="text-gray-600">View and respond to customer feedback</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="w-full md:max-w-xs">
                        <Select
                            label="Filter by Type"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            options={[
                                { value: '', label: 'All Feedback' },
                                { value: 'ORDER', label: 'Order Experience' },
                                { value: 'DELIVERY', label: 'Delivery Service' },
                                { value: 'GENERAL', label: 'General Feedback' },
                            ]}
                        />
                    </div>
                    <FilterResetButton onClick={clearFilters} disabled={!hasActiveFilters} />
                </div>
            </div>

            {errorMessage && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                </div>
            )}

            <div className="space-y-4">
                {isLoading && (
                    <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
                        Loading feedback records...
                    </div>
                )}

                {filteredFeedback.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <span>{hasActiveFilters ? 'No feedback matches the selected filter.' : 'No feedback records available yet.'}</span>
                            {hasActiveFilters && <FilterResetButton onClick={clearFilters} />}
                        </div>
                    </div>
                ) : !isLoading && filteredFeedback.map(feedback => (
                    <div key={feedback.FeedbackID} className={`bg-white rounded-lg shadow p-6 ${!feedback.AdminResponse ? 'border-l-4 border-yellow-400' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold">{feedback.customer?.Name || 'Unknown Customer'}</h3>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">{feedback.FeedbackType}</span>
                                    {feedback.order?.OrderNumber && <span className="text-xs text-gray-500">#{feedback.order.OrderNumber}</span>}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    {feedback.customer?.Phone || 'No phone'} {feedback.customer?.Email ? `| ${feedback.customer.Email}` : ''}
                                </p>
                                <div className="flex items-center gap-2">
                                    {renderStars(feedback.Rating)}
                                    <span className="text-sm text-gray-500">{formatFeedbackDate(feedback.created_at)}</span>
                                </div>
                                {feedback.order && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Order: {feedback.order.OrderType} | Status: {feedback.order.Status}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {!feedback.AdminResponse && (
                                    <button
                                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                        onClick={() => handleOpenReply(feedback)}
                                    >
                                        <FaReply />Reply
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-gray-700">{feedback.Comment || 'No comment provided.'}</p>

                        {expandedResponseId === feedback.FeedbackID && !feedback.AdminResponse && (
                            <div className="mt-4">
                                <Textarea
                                    label="Admin Reply"
                                    value={responseDraft}
                                    onChange={(e) => setResponseDraft(e.target.value)}
                                    name="adminResponse"
                                    rows={3}
                                    maxLength={1000}
                                    required
                                />
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        onClick={() => handleSubmitReply(feedback.FeedbackID)}
                                        disabled={isSubmittingResponse || !responseDraft.trim()}
                                    >
                                        {isSubmittingResponse ? 'Saving...' : 'Save Reply'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setExpandedResponseId(null);
                                            setResponseDraft('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {feedback.AdminResponse && (
                            <div className="mt-4 pl-4 border-l-2 border-gray-200">
                                <p className="text-sm text-gray-600"><strong>Admin Reply:</strong> {feedback.AdminResponse}</p>
                                {feedback.responder?.Name && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Responded by {feedback.responder.Name} on {formatFeedbackDate(feedback.RespondedAt)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeedbackManagement;
