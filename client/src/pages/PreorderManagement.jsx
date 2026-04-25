import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FilterResetButton from '../components/ui/FilterResetButton';
import { getPreorderRequests, updatePreorderRequestStatus } from '../services/preorderRequestApi';

const statusFilterOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'CANCELLED', label: 'Cancelled' }
];

const actionOptions = [
    { value: 'APPROVED', label: 'Approve' },
    { value: 'REJECTED', label: 'Reject' },
    { value: 'CANCELLED', label: 'Cancel' }
];

const statusClasses = {
    SUBMITTED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
    APPROVED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800',
    REJECTED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800',
    CANCELLED: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
};

const formatDateTime = (value) => {
    if (!value) return 'Not set';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Invalid date' : parsed.toLocaleString();
};

const getItemSummary = (item) => {
    const itemName = item.menuItem?.Name || item.combo?.Name || item.RequestedName || item.requestedName || 'Custom item';
    const quantity = item.Quantity || item.quantity || 1;
    return `${quantity}x ${itemName}`;
};

const mapRequest = (request) => ({
    id: request.PreorderRequestID,
    requestNumber: request.RequestNumber,
    customerId: request.CustomerID,
    customerName: request.customer?.Name || request.ContactName,
    profilePhone: request.customer?.Phone || '',
    contactName: request.ContactName,
    contactPhone: request.ContactPhone,
    contactEmail: request.ContactEmail,
    requestedFor: request.RequestedFor,
    requestDetails: request.RequestDetails,
    adminNotes: request.AdminNotes || '',
    rejectedReason: request.RejectedReason || '',
    status: request.Status,
    approvedAt: request.ApprovedAt,
    rejectedAt: request.RejectedAt,
    approverName: request.approver?.Name || '',
    rejectorName: request.rejector?.Name || '',
    linkedOrderNumber: request.linkedOrder?.OrderNumber || '',
    createdAt: request.created_at || request.createdAt,
    items: Array.isArray(request.items) ? request.items : []
});

const PreorderManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [error, setError] = useState('');
    const [drafts, setDrafts] = useState({});
    const [savingId, setSavingId] = useState(null);

    const loadRequests = useCallback(async ({ showLoading = false } = {}) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            const response = await getPreorderRequests({ limit: 200, offset: 0 });
            const records = response.data?.data || [];
            setRequests(records.map(mapRequest));
            setError('');
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || 'Failed to load preorder requests');
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        const loadSafely = async (options = {}) => {
            if (!isActive) return;
            await loadRequests(options);
        };

        loadSafely({ showLoading: true });
        const intervalId = setInterval(() => loadSafely(), 5000);

        return () => {
            isActive = false;
            clearInterval(intervalId);
        };
    }, [loadRequests]);

    const filteredRequests = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        return requests
            .filter((request) => {
                const matchesSearch = !query
                    || request.requestNumber?.toLowerCase().includes(query)
                    || request.customerName?.toLowerCase().includes(query)
                    || request.contactEmail?.toLowerCase().includes(query)
                    || request.requestDetails?.toLowerCase().includes(query)
                    || request.items.some((item) => getItemSummary(item).toLowerCase().includes(query));
                const matchesStatus = !statusFilter || request.status === statusFilter;

                return matchesSearch && matchesStatus;
            })
            .sort((left, right) => new Date(left.requestedFor).getTime() - new Date(right.requestedFor).getTime());
    }, [requests, searchTerm, statusFilter]);

    const hasActiveFilters = Boolean(searchTerm || statusFilter);

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
    };

    const updateDraft = (requestId, updates) => {
        setDrafts((previous) => ({
            ...previous,
            [requestId]: {
                status: '',
                adminNotes: '',
                rejectedReason: '',
                ...(previous[requestId] || {}),
                ...updates
            }
        }));
    };

    const getDraft = (request) => drafts[request.id] || {
        status: '',
        adminNotes: request.adminNotes || '',
        rejectedReason: request.rejectedReason || ''
    };

    const handleApplyAction = async (request) => {
        const draft = getDraft(request);
        if (!draft.status) {
            setError('Choose an action before applying changes.');
            return;
        }

        setSavingId(request.id);
        try {
            await updatePreorderRequestStatus(request.id, {
                status: draft.status,
                adminNotes: draft.adminNotes,
                rejectedReason: draft.rejectedReason
            });

            setDrafts((previous) => {
                const next = { ...previous };
                delete next[request.id];
                return next;
            });
            await loadRequests();
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || 'Failed to update preorder request');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="px-0 py-1 sm:py-2">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Preorder Requests</h1>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                    Review separate preorder requests with customer details, requested items, notes, and approval decisions outside the normal order workflow.
                </p>
            </div>

            <div className="card p-4 sm:p-5 mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search by request, customer, email, or item..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            icon={FaSearch}
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        options={statusFilterOptions}
                    />
                    <div className="flex items-end">
                        {hasActiveFilters ? (
                            <FilterResetButton
                                onClick={clearFilters}
                                className="w-full justify-center md:w-auto"
                            />
                        ) : (
                            <div className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                {filteredRequests.length} requests
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <LoadingSkeleton type="table" rows={8} />
            ) : filteredRequests.length > 0 ? (
                <div className="space-y-5">
                    {filteredRequests.map((request) => {
                        const draft = getDraft(request);
                        const statusClassName = statusClasses[request.status] || statusClasses.CANCELLED;

                        return (
                            <div key={request.id} className="card p-5 sm:p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{request.requestNumber}</h2>
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClassName}`}>
                                                {request.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                                            Submitted {formatDateTime(request.createdAt)} for {formatDateTime(request.requestedFor)}
                                        </p>
                                        {request.linkedOrderNumber && (
                                            <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                                                Linked order reserved for later: {request.linkedOrderNumber}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-slate-400">
                                        <p><span className="font-semibold text-gray-900 dark:text-slate-100">Customer:</span> {request.customerName}</p>
                                        <p><span className="font-semibold text-gray-900 dark:text-slate-100">Contact:</span> {request.contactName}</p>
                                        <p>{request.contactPhone}</p>
                                        <p>{request.contactEmail}</p>
                                    </div>
                                </div>

                                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
                                    <div className="xl:col-span-2 space-y-5">
                                        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Customer Request</h3>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap dark:text-slate-300">{request.requestDetails}</p>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Requested Items</h3>
                                            {request.items.length > 0 ? (
                                                <div className="space-y-3">
                                                    {request.items.map((item) => (
                                                        <div key={item.PreorderRequestItemID || `${request.id}-${getItemSummary(item)}`} className="rounded-lg border border-gray-100 px-3 py-2 dark:border-slate-700">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{getItemSummary(item)}</p>
                                                            {item.Notes && (
                                                                <p className="mt-1 text-xs text-gray-600 dark:text-slate-400 whitespace-pre-wrap">{item.Notes}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 dark:text-slate-400">No structured items were attached. Use the request details above.</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Approval Fields</h3>
                                                <p className="text-sm text-gray-600 dark:text-slate-400">Approved at: {formatDateTime(request.approvedAt)}</p>
                                                <p className="text-sm text-gray-600 dark:text-slate-400">Approved by: {request.approverName || 'Not set'}</p>
                                            </div>
                                            <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                                                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Rejection Fields</h3>
                                                <p className="text-sm text-gray-600 dark:text-slate-400">Rejected at: {formatDateTime(request.rejectedAt)}</p>
                                                <p className="text-sm text-gray-600 dark:text-slate-400">Rejected by: {request.rejectorName || 'Not set'}</p>
                                                <p className="mt-2 text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{request.rejectedReason || 'No rejection reason recorded.'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-xl border border-gray-200 p-4 dark:border-slate-700">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-3">Admin Decision</h3>
                                            <Select
                                                label="Action"
                                                value={draft.status}
                                                onChange={(event) => updateDraft(request.id, { status: event.target.value })}
                                                options={actionOptions}
                                                disabled={savingId === request.id}
                                            />
                                            <div className="mt-4">
                                                <Textarea
                                                    label="Admin Notes"
                                                    value={draft.adminNotes}
                                                    onChange={(event) => updateDraft(request.id, { adminNotes: event.target.value })}
                                                    rows={4}
                                                    maxLength={800}
                                                    disabled={savingId === request.id}
                                                    placeholder="Internal notes visible in admin management."
                                                />
                                            </div>
                                            <div className="mt-4">
                                                <Textarea
                                                    label="Rejected Reason"
                                                    value={draft.rejectedReason}
                                                    onChange={(event) => updateDraft(request.id, { rejectedReason: event.target.value })}
                                                    rows={3}
                                                    maxLength={500}
                                                    disabled={savingId === request.id}
                                                    placeholder="Required when rejecting a request."
                                                />
                                            </div>
                                            <div className="mt-4 flex gap-3">
                                                <Button
                                                    onClick={() => handleApplyAction(request)}
                                                    disabled={savingId === request.id}
                                                >
                                                    {savingId === request.id ? 'Saving...' : 'Apply'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => updateDraft(request.id, {
                                                        status: '',
                                                        adminNotes: request.adminNotes || '',
                                                        rejectedReason: request.rejectedReason || ''
                                                    })}
                                                    disabled={savingId === request.id}
                                                >
                                                    Reset
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    type="search"
                    title="No preorder requests found"
                    description={hasActiveFilters ? 'No preorder requests match your current filters.' : 'No preorder requests have been submitted yet.'}
                    action={hasActiveFilters ? <FilterResetButton onClick={clearFilters} /> : null}
                />
            )}
        </div>
    );
};

export default PreorderManagement;
