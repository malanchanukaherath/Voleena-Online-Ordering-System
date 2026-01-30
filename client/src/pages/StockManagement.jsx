import React, { useState } from 'react';
import { FaPlus, FaEdit } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const StockManagement = () => {
    const stock = [
        { id: 1, item: 'Chicken', category: 'Meat', currentQty: 15, unit: 'kg', minQty: 10, lastUpdated: '2024-01-25' },
        { id: 2, item: 'Rice', category: 'Grains', currentQty: 5, unit: 'kg', minQty: 20, lastUpdated: '2024-01-24', lowStock: true },
        { id: 3, item: 'Tomatoes', category: 'Vegetables', currentQty: 8, unit: 'kg', minQty: 5, lastUpdated: '2024-01-25' },
    ];

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Stock Management</h1>
                    <p className="text-gray-600">Monitor and update ingredient stock levels</p>
                </div>
                <Button><FaPlus className="inline mr-2" />Add Stock Item</Button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Qty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {stock.map(item => (
                            <tr key={item.id} className={`hover:bg-gray-50 ${item.lowStock ? 'bg-red-50' : ''}`}>
                                <td className="px-6 py-4 font-medium">{item.item}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                                <td className="px-6 py-4">
                                    <span className={item.lowStock ? 'text-red-600 font-semibold' : ''}>
                                        {item.currentQty} {item.unit}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{item.minQty} {item.unit}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.lastUpdated}</td>
                                <td className="px-6 py-4">
                                    {item.lowStock ? (
                                        <span className="text-red-600 font-medium">⚠️ Low Stock</span>
                                    ) : (
                                        <span className="text-green-600">In Stock</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-blue-600 hover:text-blue-900"><FaEdit /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockManagement;
