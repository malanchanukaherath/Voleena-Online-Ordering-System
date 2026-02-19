import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import { addToCart } from '../utils/cartStorage';
import { menuItemService } from '../services/menuService';

const MenuItemDetail = () => {
    const { itemId } = useParams();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const resolveImageUrl = (imagePath) => {
        if (!imagePath) {
            return null;
        }
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        return `${apiBaseUrl}${imagePath}`;
    };

    const mapMenuItem = (data) => ({
        id: data.MenuItemID || data.ItemID,
        name: data.Name,
        description: data.Description || 'No description available',
        price: parseFloat(data.Price),
        categoryName: data.category?.Name || 'Other',
        image: resolveImageUrl(data.ImageURL || data.Image_URL || null),
        isAvailable: !!data.IsActive
    });

    useEffect(() => {
        let isMounted = true;

        const fetchItem = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await menuItemService.getById(itemId);
                if (response.success && response.data) {
                    if (isMounted) {
                        setItem(mapMenuItem(response.data));
                    }
                    return;
                }
                throw new Error('Menu item not found');
            } catch (error) {
                try {
                    const fallbackResponse = await menuItemService.getAll();
                    const found = fallbackResponse.data?.find(
                        entry => String(entry.MenuItemID || entry.ItemID) === String(itemId)
                    );
                    if (found && isMounted) {
                        setItem(mapMenuItem(found));
                        return;
                    }
                } catch (fallbackError) {
                    if (isMounted) {
                        setError(fallbackError.response?.data?.error || 'Failed to load menu item');
                    }
                    return;
                }

                if (isMounted) {
                    setError('Menu item not found');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchItem();

        return () => {
            isMounted = false;
        };
    }, [itemId]);

    const handleAddToCart = () => {
        if (!item?.isAvailable) {
            toast.error('This item is not available right now');
            return;
        }

        addToCart({
            id: item.id,
            type: 'menu',
            menuItemId: item.id,
            comboId: null,
            name: item.name,
            price: item.price,
            image: item.image
        }, 1);

        toast.success(`✓ ${item.name} added to cart!`);
    };

    if (loading) {
        return <LoadingSkeleton type="card" count={1} />;
    }

    if (error || !item) {
        return (
            <EmptyState
                type="error"
                title="Menu item unavailable"
                description={error || 'This menu item could not be found'}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-gray-400">No image available</span>
                    )}
                </div>
                <div className="p-8">
                    <div className="mb-6">
                        <span className="text-sm text-gray-500 mb-2 block">{item.categoryName}</span>
                        <h1 className="text-4xl font-bold mb-4">{item.name}</h1>
                        <p className="text-xl text-gray-700 mb-6">{item.description}</p>
                        <p className="text-3xl font-bold text-primary-600">LKR {item.price.toFixed(2)}</p>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
                        disabled={!item.isAvailable}
                    >
                        {item.isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuItemDetail;
