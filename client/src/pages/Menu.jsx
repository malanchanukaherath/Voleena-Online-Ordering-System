import React, { useState, useEffect } from 'react';
import { FaSearch, FaTimes, FaTag, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import { menuItemService } from '../services/menuService';
import { toast } from 'react-toastify';

const Menu = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [comboPacks, setComboPacks] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [error, setError] = useState(null);

    // Load menu items from API
    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await menuItemService.getAll({ isActive: 'true' });

                if (response.success && response.data) {
                    // Transform API data to match component format
                    const transformedItems = response.data.map(item => ({
                        id: item.ItemID,
                        name: item.Name,
                        description: item.Description || 'No description available',
                        price: parseFloat(item.Price),
                        category: item.category?.Name?.toLowerCase() || 'other',
                        image: item.Image_URL,
                        stockQuantity: item.StockQuantity || 0,
                        isAvailable: item.IsActive && (item.StockQuantity > 0),
                    }));
                    setMenuItems(transformedItems);
                } else {
                    setError('Failed to load menu items');
                    toast.error('Failed to load menu items');
                }
            } catch (error) {
                console.error('Error fetching menu items:', error);
                setError(error.message || 'Failed to load menu items');
                toast.error('Failed to load menu items');
            } finally {
                setLoading(false);
            }
        };

        fetchMenuItems();
    }, []);

    // Load combo packs from localStorage
    useEffect(() => {
        const loadCombos = () => {
            try {
                const stored = localStorage.getItem('voleena_combos');
                if (stored) {
                    const combos = JSON.parse(stored);
                    const now = new Date();
                    const activeCombos = combos.filter(combo => {
                        const start = new Date(combo.startDate);
                        const end = new Date(combo.endDate);
                        return combo.isActive && now >= start && now <= end;
                    });
                    setComboPacks(activeCombos);
                }
            } catch (error) {
                console.error('Error loading combos:', error);
            }
        };

        loadCombos();
        const interval = setInterval(loadCombos, 10000);
        return () => clearInterval(interval);
    }, []);

    const categories = [
        { value: 'burgers', label: 'Burgers' },
        { value: 'rice', label: 'Rice & Curry' },
        { value: 'pasta', label: 'Pasta' },
        { value: 'pizza', label: 'Pizza' },
        { value: 'drinks', label: 'Drinks' },
        { value: 'desserts', label: 'Desserts' },
        { value: 'combos', label: 'Combo Packs' },
    ];

    // Convert combo packs to menu item format
    const comboMenuItems = comboPacks.map(combo => ({
        id: `combo-${combo.id}`,
        name: combo.name,
        description: combo.description,
        price: combo.price,
        originalPrice: combo.price / (1 - combo.discount / 100),
        discount: combo.discount,
        category: 'combos',
        image: combo.image,
        stockQuantity: 999, // Combos always in stock for demo
        isAvailable: true,
        isCombo: true
    }));

    // Combine regular items and combos
    const allItems = [...menuItems, ...comboMenuItems];

    const filteredItems = allItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Get stock badge info
    const getStockBadge = (item) => {
        if (item.stockQuantity === 0) {
            return { text: 'Out of Stock', className: 'bg-red-500 text-white' };
        }
        if (item.stockQuantity <= 5) {
            return { text: `Only ${item.stockQuantity} left!`, className: 'bg-yellow-500 text-white' };
        }
        return null;
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Our Menu</h1>
                <p className="text-gray-600">Browse our delicious selection of food items</p>
                {comboPacks.length > 0 && (
                    <p className="text-sm text-primary-600 mt-2">
                        🎉 {comboPacks.length} special combo pack{comboPacks.length > 1 ? 's' : ''} available now!
                    </p>
                )}
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    <Select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        options={categories}
                        label=""
                        name="category"
                    />
                </div>
            </div>

            {/* Menu Items Grid */}
            {loading ? (
                <LoadingSkeleton type="card" count={8} />
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) => {
                        const stockBadge = getStockBadge(item);
                        return (
                            <div
                                key={item.id}
                                className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow ${!item.isAvailable || item.stockQuantity === 0 ? 'opacity-60' : ''
                                    }`}
                            >
                                <div className="h-48 bg-gray-200 flex items-center justify-center relative">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-sm">No image available</span>
                                    )}

                                    {/* Out of Stock Overlay */}
                                    {(item.stockQuantity === 0 || !item.isAvailable) && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <span className="text-white font-semibold">Out of Stock</span>
                                        </div>
                                    )}

                                    {/* Combo Discount Badge */}
                                    {item.isCombo && item.discount > 0 && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                            <FaTag />
                                            {item.discount}% OFF
                                        </div>
                                    )}

                                    {/* Stock Badge */}
                                    {stockBadge && item.stockQuantity > 0 && (
                                        <div className={`absolute top-2 left-2 ${stockBadge.className} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                                            {item.stockQuantity <= 5 && <FaExclamationTriangle />}
                                            {stockBadge.text}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        {item.isCombo && (
                                            <span className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded">COMBO</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                                    {/* Stock Info */}
                                    {!item.isCombo && (
                                        <p className="text-xs text-gray-500 mb-2">
                                            Stock: {item.stockQuantity > 0 ? `${item.stockQuantity} available` : 'Out of stock'}
                                        </p>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div>
                                            {item.isCombo && item.originalPrice ? (
                                                <div>
                                                    <span className="text-sm text-gray-400 line-through">
                                                        LKR {item.originalPrice.toFixed(2)}
                                                    </span>
                                                    <span className="text-lg font-bold text-primary-600 ml-2">
                                                        LKR {item.price.toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-lg font-bold text-primary-600">
                                                    LKR {item.price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={!item.isAvailable || item.stockQuantity === 0}
                                            title={item.stockQuantity === 0 ? 'Out of stock' : 'Add to cart'}
                                        >
                                            {item.stockQuantity === 0 || !item.isAvailable ? 'Unavailable' : 'Add to Cart'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    type="search"
                    title="No items found"
                    description="Try adjusting your search or filter criteria"
                    action={
                        <Button onClick={() => { setSearchTerm(''); setSelectedCategory(''); }}>
                            Clear Filters
                        </Button>
                    }
                />
            )}
        </div>
    );
};

export default Menu;
