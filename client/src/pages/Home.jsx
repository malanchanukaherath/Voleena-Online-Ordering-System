import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { FaUtensils, FaTruck, FaClock, FaStar, FaTag } from 'react-icons/fa';
import { menuItemService, comboPackService } from '../services/menuService';
import { addToCart } from '../utils/cartStorage';
import { toast } from 'react-toastify';
import { resolveAssetUrl } from '../config/api';

const Home = () => {
    const { isAuthenticated } = useAuth();
    const [featuredItems, setFeaturedItems] = useState([]);
    const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
    const [comboSpecials, setComboSpecials] = useState([]);
    const [isLoadingCombos, setIsLoadingCombos] = useState(true);

    const resolveImageUrl = (imagePath) => {
        if (!imagePath) {
            return null;
        }
        return resolveAssetUrl(imagePath);
    };

    useEffect(() => {
        const loadFeatured = async () => {
            try {
                const response = await menuItemService.getAll({ isActive: 'true' });
                if (response.success && Array.isArray(response.data)) {
                    const items = response.data.slice(0, 4).map(item => ({
                        id: item.MenuItemID || item.ItemID,
                        name: item.Name,
                        description: item.Description || 'No description available',
                        price: parseFloat(item.Price),
                        image: resolveImageUrl(item.ImageURL || item.Image_URL || null),
                        isAvailable: item.IsAvailable !== undefined ? !!item.IsAvailable : !!item.IsActive
                    }));
                    setFeaturedItems(items);
                } else {
                    setFeaturedItems([]);
                }
            } catch (error) {
                console.error('Error loading featured items:', error);
                setFeaturedItems([]);
            } finally {
                setIsLoadingFeatured(false);
            }
        };

        loadFeatured();
    }, []);

    useEffect(() => {
        const loadCombos = async () => {
            try {
                const response = await comboPackService.getActive();
                if (response.success && Array.isArray(response.data)) {
                    setComboSpecials(response.data.slice(0, 3));
                } else {
                    setComboSpecials([]);
                }
            } catch (error) {
                console.error('Error loading combo specials:', error);
                setComboSpecials([]);
            } finally {
                setIsLoadingCombos(false);
            }
        };
        loadCombos();
    }, []);

    const handleAddComboToCart = (combo) => {
        addToCart({
            id: combo.ComboID || combo.ComboPackID,
            type: 'combo',
            comboId: combo.ComboID || combo.ComboPackID,
            menuItemId: null,
            name: combo.Name,
            price: parseFloat(combo.Price),
            image: resolveImageUrl(combo.ImageURL || combo.Image_URL || null)
        }, 1);
        toast.success(`✓ ${combo.Name} added to cart!`);
    };

    const handleAddToCart = (item) => {
        if (!item.isAvailable) {
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
            image: item.image || null
        }, 1);

        toast.success(`✓ ${item.name} added to cart!`);
    };

    const features = [
        {
            icon: FaUtensils,
            title: 'Delicious Food',
            description: 'Traditional Sri Lankan meals and special combo packs',
        },
        {
            icon: FaTruck,
            title: 'Fast Delivery',
            description: 'Delivered to your door within 15km radius',
        },
        {
            icon: FaClock,
            title: 'Easy Ordering',
            description: 'Order online anytime, anywhere',
        },
        {
            icon: FaStar,
            title: 'Quality Service',
            description: 'Premium ingredients and excellent customer service',
        },
    ];

    return (
        <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            Welcome to Voleena Foods
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
                            Authentic Sri Lankan cuisine delivered fresh to your doorstep.
                            Enjoy our special Sunday combo offers and daily specials!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/menu">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Browse Menu
                                </Button>
                            </Link>
                            {!isAuthenticated && (
                                <Link to="/register">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-gray-100">
                                        Sign Up Now
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Combo Specials Section */}
            {(isLoadingCombos || comboSpecials.length > 0) && (
                <section className="py-12 bg-gradient-to-r from-orange-50 to-yellow-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">🔥 Combo Specials</h2>
                                <p className="text-gray-600 mt-1">Limited-time bundles at unbeatable prices</p>
                            </div>
                            <Link to="/menu" className="text-orange-600 hover:text-orange-700 font-medium">
                                View All →
                            </Link>
                        </div>
                        {isLoadingCombos ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                                        <div className="h-48 bg-orange-100" />
                                        <div className="p-5">
                                            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
                                            <div className="h-3 bg-gray-200 rounded w-full mb-4" />
                                            <div className="h-8 bg-gray-200 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {comboSpecials.map((combo) => {
                                    const imageUrl = resolveImageUrl(combo.ImageURL || combo.Image_URL || null);
                                    const price = parseFloat(combo.Price);
                                    const originalPrice = combo.OriginalPrice ? parseFloat(combo.OriginalPrice) : null;
                                    const discount = combo.DiscountPercentage ? parseFloat(combo.DiscountPercentage) : 0;
                                    return (
                                        <div key={combo.ComboID || combo.ComboPackID} className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                                            <div className="relative">
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={combo.Name} className="w-full h-48 object-cover" />
                                                ) : (
                                                    <div className="w-full h-48 bg-gradient-to-br from-orange-200 to-yellow-200 flex items-center justify-center">
                                                        <FaTag className="text-6xl text-orange-400" />
                                                    </div>
                                                )}
                                                {discount > 0 && (
                                                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                                        <FaTag className="text-xs" />
                                                        {discount}% OFF
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">{combo.Name}</h3>
                                                {combo.Description && (
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{combo.Description}</p>
                                                )}
                                                <div className="flex items-end justify-between mb-4">
                                                    <div>
                                                        {originalPrice && originalPrice > price && (
                                                            <p className="text-sm text-gray-400 line-through">LKR {originalPrice.toFixed(2)}</p>
                                                        )}
                                                        <p className="text-2xl font-bold text-orange-600">LKR {price.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => handleAddComboToCart(combo)}
                                                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                                                >
                                                    Add to Cart
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow"
                                >
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                                        <Icon className="w-8 h-8 text-primary-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-gray-600">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Featured Items Preview */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold">Featured Items</h2>
                        <Link to="/menu" className="text-primary-600 hover:text-primary-700 font-medium">
                            View All →
                        </Link>
                    </div>
                    {isLoadingFeatured ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg shadow-md overflow-hidden"
                                >
                                    <div className="h-48 bg-gray-200" />
                                    <div className="p-4">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                                        <div className="h-3 bg-gray-200 rounded w-full mb-3" />
                                        <div className="h-8 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                >
                                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-400">No image available</span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold mb-2">{item.name}</h3>
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-primary-600">LKR {item.price.toFixed(2)}</span>
                                            <Button size="sm" onClick={() => handleAddToCart(item)}>Add to Cart</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
                            No featured items yet. Check back soon!
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-primary-600 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Order?</h2>
                    <p className="text-xl mb-8">
                        Explore our menu and place your order in just a few clicks!
                    </p>
                    <Link to="/menu">
                        <Button size="lg" className="bg-yellow-400 text-red-900 hover:bg-yellow-300">
                            Order Now
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
