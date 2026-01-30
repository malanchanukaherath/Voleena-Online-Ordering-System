import React from 'react';
import { useParams } from 'react-router-dom';

const MenuItemDetail = () => {
    const { itemId } = useParams();

    const item = {
        name: 'Chicken Burger',
        description: 'Crispy chicken patty with fresh vegetables, served in a toasted sesame bun with our special sauce',
        price: 450.00,
        category: 'Burgers',
        ingredients: ['Chicken patty', 'Lettuce', 'Tomato', 'Onion', 'Cheese', 'Special sauce'],
        isAvailable: true,
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">Item Image</span>
                </div>
                <div className="p-8">
                    <div className="mb-6">
                        <span className="text-sm text-gray-500 mb-2 block">{item.category}</span>
                        <h1 className="text-4xl font-bold mb-4">{item.name}</h1>
                        <p className="text-xl text-gray-700 mb-6">{item.description}</p>
                        <p className="text-3xl font-bold text-primary-600">LKR {item.price.toFixed(2)}</p>
                    </div>
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Ingredients:</h3>
                        <ul className="list-disc list-inside text-gray-700">
                            {item.ingredients.map((ing, idx) => <li key={idx}>{ing}</li>)}
                        </ul>
                    </div>
                    <button className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50" disabled={!item.isAvailable}>
                        {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuItemDetail;
