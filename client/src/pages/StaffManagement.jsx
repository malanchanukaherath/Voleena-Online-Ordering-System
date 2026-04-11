import React, { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import FilterResetButton from '../components/ui/FilterResetButton';
import AddStaffModal from '../components/AddStaffModal';
import { staffApi } from '../services/staffCustomerApi';

const StaffManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [error, setError] = useState(null);

    // Fetch staff and roles on mount
    useEffect(() => {
        fetchStaff();
        fetchRoles();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await staffApi.getAll();
            setStaff(data.staff || []);
        } catch (err) {
            console.error('Failed to fetch staff:', err);
            setError(err.response?.data?.error || 'Failed to load staff members');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const data = await staffApi.getRoles();
            setRoles(data.roles || []);
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        }
    };

    const handleAddStaff = async (staffData) => {
        try {
            const result = await staffApi.create(staffData);

            if (result.staff) {
                // Success - refresh staff list
                await fetchStaff();
                alert(`Staff member ${result.staff.name} created successfully!`);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to create staff member';

            // Check if staff already exists
            if (err.response?.status === 409 && err.response?.data?.existingStaff) {
                const existing = err.response.data.existingStaff;
                alert(`Staff already exists:\n\nName: ${existing.name}\nEmail: ${existing.email}\nRole: ${existing.role}\nStatus: ${existing.isActive ? 'Active' : 'Inactive'}`);
            } else {
                throw new Error(errorMsg);
            }
        }
    };

    const handleToggleStatus = async (staffId, currentStatus) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this staff member?`)) {
            try {
                await staffApi.updateStatus(staffId, !currentStatus);
                await fetchStaff();
            } catch (err) {
                alert(err.response?.data?.error || 'Failed to update staff status');
            }
        }
    };

    const roleOptions = [
        { value: '', label: 'All Roles' },
        ...roles.map(role => ({ value: role.name, label: role.name }))
    ];

    const filteredStaff = staff.filter(member => {
        const matchesSearch = member.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.Email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = !roleFilter || member.role?.RoleName === roleFilter;
        return matchesSearch && matchesRole;
    });

    const hasActiveFilters = Boolean(searchTerm || roleFilter);

    const clearFilters = () => {
        setSearchTerm('');
        setRoleFilter('');
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            Admin: 'bg-purple-100 text-purple-800',
            Cashier: 'bg-blue-100 text-blue-800',
            Kitchen: 'bg-orange-100 text-orange-800',
            Delivery: 'bg-green-100 text-green-800',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const parsedDate = new Date(dateString);
        if (Number.isNaN(parsedDate.getTime())) return 'N/A';
        return parsedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
                        <p className="text-gray-600">Manage staff members and their roles</p>
                    </div>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <FaUserPlus className="inline mr-2" />
                        Add Staff Member
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={FaSearch}
                        />
                    </div>
                    <Select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        options={roleOptions}
                    />
                    {hasActiveFilters && (
                        <div className="flex items-end">
                            <FilterResetButton
                                onClick={clearFilters}
                                className="w-full justify-center md:w-auto"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Total Staff</p>
                    <p className="text-3xl font-bold text-primary-600">{staff.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Active</p>
                    <p className="text-3xl font-bold text-green-600">
                        {staff.filter(s => s.IsActive).length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Admins</p>
                    <p className="text-3xl font-bold text-purple-600">
                        {staff.filter(s => s.role?.RoleName === 'Admin').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 mb-1">Delivery Staff</p>
                    <p className="text-3xl font-bold text-blue-600">
                        {staff.filter(s => s.role?.RoleName === 'Delivery').length}
                    </p>
                </div>
            </div>

            {/* Staff Table */}
            {loading ? (
                <LoadingSkeleton type="table" rows={10} />
            ) : filteredStaff.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Staff Member
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStaff.map((member) => (
                                    <tr key={member.StaffID} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                                                    <span className="text-primary-600 font-semibold">
                                                        {member.Name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{member.Name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{member.Email}</div>
                                            <div className="text-xs text-gray-500">{member.Phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(member.role?.RoleName)}`}>
                                                {member.role?.RoleName || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{formatDate(member.createdAt || member.CreatedAt || member.created_at)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {member.IsActive ? (
                                                <span className="text-green-600 text-sm">● Active</span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">● Inactive</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleToggleStatus(member.StaffID, member.IsActive)}
                                                className={`${member.IsActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                                                title={member.IsActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {member.IsActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <EmptyState
                    type="search"
                    title="No staff members found"
                    description="No staff match your search criteria"
                    action={hasActiveFilters ? <FilterResetButton onClick={clearFilters} /> : null}
                />
            )}

            <AddStaffModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddStaff}
                roles={roles}
            />
        </div>
    );
};

export default StaffManagement;
