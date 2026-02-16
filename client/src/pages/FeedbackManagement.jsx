import React, { useState } from 'react';
import { FaStar, FaReply, FaTrash } from 'react-icons/fa';
import Select from '../components/ui/Select';

const FeedbackManagement = () => {
    const [typeFilter, setTypeFilter] = useState('');

    const feedbacks = [];

    const filteredFeedback = typeFilter ? feedbacks.filter(f => f.type === typeFilter) : feedbacks;

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <FaStar key={i} className={`inline w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} />
        ));
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Feedback Management</h1>
                <p className="text-gray-600">View and respond to customer feedback</p>
            </div>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
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

            <div className="space-y-4">
                {filteredFeedback.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-sm text-gray-500">
                        No feedback records available yet.
                    </div>
                ) : filteredFeedback.map(feedback => (
                    <div key={feedback.id} className={`bg-white rounded-lg shadow p-6 ${!feedback.replied ? 'border-l-4 border-yellow-400' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold">{feedback.customer}</h3>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">{feedback.type}</span>
                                    {feedback.orderNumber && <span className="text-xs text-gray-500">{feedback.orderNumber}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    {renderStars(feedback.rating)}
                                    <span className="text-sm text-gray-500">{feedback.date}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {!feedback.replied && (
                                    <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                                        <FaReply />Reply
                                    </button>
                                )}
                                <button className="text-red-600 hover:text-red-900"><FaTrash /></button>
                            </div>
                        </div>
                        <p className="text-gray-700">{feedback.comment}</p>
                        {feedback.replied && (
                            <div className="mt-4 pl-4 border-l-2 border-gray-200">
                                <p className="text-sm text-gray-600"><strong>Admin Reply:</strong> Thank you for your feedback!</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeedbackManagement;
