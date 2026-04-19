import React, { useEffect, useMemo, useState } from 'react';
import { FaStar, FaReply } from 'react-icons/fa';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import { getAdminFeedback, respondToFeedback } from '../services/feedbackService';

// Simple: This shows the feedback management section.
const FeedbackManagement = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [expandedResponseId, setExpandedResponseId] = useState(null);
    const [responseDraft, setResponseDraft] = useState('');
    const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

    // Simple: This gets the feedback.
    const loadFeedback = async () => {
        try {
            setIsLoading(true);
            setErrorMessage('');
            const response = await getAdminFeedback();
            setFeedbacks(Array.isArray(response.data?.data) ? response.data.data : []);
        } catch (error) {
            const message = error?.response?.data?.message || error?.response?.data?.error || 'Failed to load feedback records';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFeedback();
    }, []);

    const filteredFeedback = useMemo(() => {
        return feedbacks;
    }, [feedbacks]);
    // Simple: This shows the stars.
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <FaStar key={i} className={`inline w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
        ));
    };

    // Simple: This cleans or formats the feedback date.
    const formatFeedbackDate = (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
    };

    // Simple: This handles what happens when open reply is triggered.
    const handleOpenReply = (feedback) => {
        setExpandedResponseId(feedback.FeedbackID);
        setResponseDraft(feedback.AdminResponse || '');
    };

    // Simple: This handles what happens when submit reply is triggered.
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
            await loadFeedback();
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
                <p className="text-gray-600 dark:text-slate-400">View and respond to delivered order feedback</p>
            </div>

            {errorMessage && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400">
                    {errorMessage}
                </div>
            )}

            <div className="space-y-4">
                {isLoading && (
                    <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                        Loading feedback records...
                    </div>
                )}

                {filteredFeedback.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500 dark:bg-slate-800 dark:text-slate-400">
                        No feedback records available yet.
                    </div>
                ) : !isLoading && filteredFeedback.map(feedback => (
                    <div key={feedback.FeedbackID} className={`bg-white rounded-lg shadow p-6 dark:bg-slate-800 dark:shadow-slate-900/50 ${!feedback.AdminResponse ? 'border-l-4 border-yellow-400' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold">{feedback.customer?.Name || 'Unknown Customer'}</h3>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded dark:bg-slate-700 dark:text-slate-300">{feedback.FeedbackType}</span>
                                    {feedback.order?.OrderNumber && <span className="text-xs text-gray-500 dark:text-slate-400">#{feedback.order.OrderNumber}</span>}
                                </div>
                                <p className="text-xs text-gray-500 mb-2 dark:text-slate-400">
                                    {feedback.customer?.Phone || 'No phone'} {feedback.customer?.Email ? `| ${feedback.customer.Email}` : ''}
                                </p>
                                <div className="flex items-center gap-2">
                                    {renderStars(feedback.Rating)}
                                    <span className="text-sm text-gray-500 dark:text-slate-400">{formatFeedbackDate(feedback.created_at)}</span>
                                </div>
                                {feedback.order && (
                                    <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">
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
                        <p className="text-gray-700 dark:text-slate-300">{feedback.Comment || 'No comment provided.'}</p>

                        {(feedback.PositiveTags?.length > 0 || feedback.IssueTags?.length > 0) && (
                            <div className="mt-3 space-y-2">
                                {feedback.PositiveTags?.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-medium text-green-700">Likes:</span>
                                        {feedback.PositiveTags.map((tag) => (
                                            <span key={`${feedback.FeedbackID}-pos-${tag}`} className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {feedback.IssueTags?.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <span className="font-medium text-red-700">Issues:</span>
                                        {feedback.IssueTags.map((tag) => (
                                            <span key={`${feedback.FeedbackID}-issue-${tag}`} className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

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
                            <div className="mt-4 pl-4 border-l-2 border-gray-200 dark:border-slate-600">
                                <p className="text-sm text-gray-600 dark:text-slate-400"><strong>Admin Reply:</strong> {feedback.AdminResponse}</p>
                                {feedback.responder?.Name && (
                                    <p className="text-xs text-gray-500 mt-1 dark:text-slate-500">
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
