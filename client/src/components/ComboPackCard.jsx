import React from 'react';
import { FaTag, FaClock } from 'react-icons/fa';
import Button from './ui/Button';

const ComboPackCard = ({ combo, onAddToCart }) => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const resolveImageUrl = (imagePath) => {
        if (!imagePath) {
            return null;
        }
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        return `${apiBaseUrl}${imagePath}`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const imageUrl = resolveImageUrl(combo.Image_URL || combo.ImageURL || null);

    const discountBadge = combo.DiscountPercentage > 0 && (
        <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
            <FaTag className="text-xs" />
            {combo.DiscountPercentage}% OFF
        </div>
    );

    return (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className="relative">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={combo.Name}
                        className="w-full h-48 object-cover"
                    />
                ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                        <FaTag className="text-6xl text-orange-400" />
                    </div>
                )}
                {discountBadge}
            </div>

            <div className="p-5">
                <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{combo.Name}</h3>
                    {combo.Description && (
                        <p className="text-sm text-gray-600">{combo.Description}</p>
                    )}
                </div>

                <div className="bg-white rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-500 mb-2 font-semibold">Includes:</p>
                    <div className="space-y-1">
                        {combo.items && combo.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-700">
                                    {item.Quantity}x {item.menuItem?.Name || 'Item'}
                                </span>
                                <span className="text-gray-500">
                                    LKR {(item.menuItem?.Price * item.Quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                    <div>
                        {combo.OriginalPrice > combo.Price && (
                            <p className="text-sm text-gray-500 line-through">
                                LKR {combo.OriginalPrice.toFixed(2)}
                            </p>
                        )}
                        <p className="text-2xl font-bold text-orange-600">
                            LKR {combo.Price.toFixed(2)}
                        </p>
                        {combo.Discount > 0 && (
                            <p className="text-xs text-green-600 font-semibold">
                                Save LKR {combo.Discount.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
                    <FaClock />
                    <span>
                        Valid until {formatDate(combo.ScheduleEndDate)}
                    </span>
                </div>

                <Button
                    onClick={() => onAddToCart(combo)}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                >
                    Add Combo to Cart
                </Button>
            </div>
        </div>
    );
};

export default ComboPackCard;
