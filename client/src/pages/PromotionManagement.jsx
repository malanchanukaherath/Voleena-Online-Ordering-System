import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTag } from 'react-icons/fa';
import Button from '../components/ui/Button';

const PromotionManagement = () => {
    const promotions = [
        { id: 1, code: 'WELCOME10', discount: 10, type: 'percentage', minOrder: 500, uses: 45, maxUses: 100, validUntil: '2024-02-28', isActive: true },
        { id: 2, code: 'FREESHIP', discount: 100, type: 'fixed', minOrder: 1000, uses: 23, maxUses: 50, validUntil: '2024-01-31', isActive: true },
    ];

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Promotion Management</h1>
                    <p className="text-gray-600">Create and manage promotional codes</p>
                </div>
                <Button><FaPlus className="inline mr-2" />New Promotion</Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promo Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {promotions.map(promo => (
                            <tr key={promo.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className="font-mono font-bold text-primary-600 flex items-center">
                                        <FaTag className="mr-2" />{promo.code}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {promo.type === 'percentage' ? `${promo.discount}%` : `LKR ${promo.discount}`}
                                </td>
                                <td className="px-6 py-4">LKR {promo.minOrder}</td>
                                <td className="px-6 py-4">
                                    {promo.uses}/{promo.maxUses}
                                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${(promo.uses / promo.maxUses) * 100}%` }} />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">{promo.validUntil}</td>
                                <td className="px-6 py-4">
                                    {promo.isActive ? <span className="text-green-600">Active</span> : <span className="text-gray-400">Inactive</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button className="text-blue-600 hover:text-blue-900"><FaEdit /></button>
                                        <button className="text-red-600 hover:text-red-900"><FaTrash /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PromotionManagement;
