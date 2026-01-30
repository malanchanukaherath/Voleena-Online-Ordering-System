import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([
        { id: 1, name: 'Burgers', description: 'Burgers and sandwiches', itemCount: 12, isActive: true },
        { id: 2, name: 'Rice & Curry', description: 'Traditional Sri Lankan meals', itemCount: 8, isActive: true },
        { id: 3, name: 'Pizza', description: 'Italian pizzas', itemCount: 6, isActive: true },
    ]);

    return (
        <div className="p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Category Management</h1>
                    <p className="text-gray-600">Organize menu items into categories</p>
                </div>
                <Button><FaPlus className="inline mr-2" />Add Category</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-xl font-semibold mb-2">{cat.name}</h3>
                        <p className="text-sm text-gray-600 mb-4">{cat.description}</p>
                        <p className="text-sm text-gray-500 mb-4">{cat.itemCount} items</p>
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">
                                <FaEdit className="inline mr-1" />Edit
                            </Button>
                            <button className="px-3 text-red-600 hover:text-red-900"><FaTrash /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManagement;
