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
                        stockQuantity: item.StockQuantity ?? null,
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
        try {
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
        } catch (error) {
            toast.error(error.message || 'Unable to add combo to cart');
        }
    };

    const handleAddToCart = (item) => {
        if (!item.isAvailable) {
            toast.error('This item is not available right now');
            return;
        }

        try {
            addToCart({
                id: item.id,
                type: 'menu',
                menuItemId: item.id,
                comboId: null,
                name: item.name,
                price: item.price,
                image: item.image || null,
                stockQuantity: item.stockQuantity,
                isAvailable: item.isAvailable
            }, 1);

            toast.success(`✓ ${item.name} added to cart!`);
        } catch (error) {
            toast.error(error.message || 'Unable to add item to cart');
        }
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
            <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white pt-16 sm:pt-20 pb-24 overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10" aria-hidden="true">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-sm text-white/90 font-medium mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Now accepting online orders
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-6 break-words max-w-[18rem] sm:max-w-none mx-auto leading-tight">
                            Welcome to Voleena Foods
                        </h1>
                        <p className="text-lg sm:text-xl mb-8 max-w-[20rem] sm:max-w-3xl mx-auto leading-relaxed text-primary-100">
                            Authentic Sri Lankan cuisine delivered fresh to your doorstep.
                            Enjoy our special Sunday combo offers and daily specials!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/menu">
                                <Button size="lg" variant="secondary" className="w-full sm:w-auto font-bold">
                                    Browse Menu
                                </Button>
                            </Link>
                            {!isAuthenticated && (
                                <Link to="/register">
                                    <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/60 text-white hover:bg-white/10 hover:border-white">
                                        Sign Up — It's Free
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Wave divider */}
                <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
                    <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 56L60 48C120 40 240 24 360 20C480 16 600 24 720 28C840 32 960 32 1080 28C1200 24 1320 16 1380 12L1440 8V56H1380C1320 56 1200 56 1080 56C960 56 840 56 720 56C600 56 480 56 360 56C240 56 120 56 60 56H0V56Z" fill="#f8fafc"/>
                    </svg>
                </div>
            </section>

            <section className="py-10 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="card p-6 md:p-8 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div>
                                <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Bulk & Preorders</span>
                                <h2 className="text-xl font-bold text-gray-900">Preorder and Bulk Ordering Available</h2>
                                <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                                    Need food in advance or for larger groups? Place scheduled preorders with bulk quantity notes.
                                </p>
                                <p className="text-xs text-indigo-600 mt-1.5">
                                    Low on stock? Submit as preorder with your preferred date.
                                </p>
                            </div>
                            <div className="flex gap-3 shrink-0">
                                <Link to="/menu">
                                    <Button variant="outline">Browse Menu</Button>
                                </Link>
                                <Link to="/checkout">
                                    <Button>Place a Preorder</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Combo Specials Section */}
            {(isLoadingCombos || comboSpecials.length > 0) && (
                <section className="py-12 bg-gradient-to-r from-orange-50 to-yellow-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-8">
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
            <section className="py-14 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Order With Confidence</h2>
                        <p className="mt-2 text-gray-500 text-sm md:text-base">Everything you need for a great dining experience</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <div
                                    key={index}
                                    className="card motion-surface p-6 text-center cursor-default"
                                >
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 rounded-2xl mb-4 border border-primary-100">
                                        <Icon className="w-7 h-7 text-primary-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 mb-1.5">{feature.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Featured Items Preview */}
            <section className="py-14 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Popular Picks</h2>
                            <p className="mt-1 text-sm text-gray-500">Our most-loved menu items</p>
                        </div>
                        <Link to="/menu" className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
                            View All <span aria-hidden="true">→</span>
                        </Link>
                    </div>
                    {isLoadingFeatured ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div key={index} className="card overflow-hidden">
                                    <div className="skeleton h-48" />
                                    <div className="p-4 space-y-3">
                                        <div className="skeleton h-4 w-3/4" />
                                        <div className="skeleton h-3 w-full" />
                                        <div className="skeleton h-3 w-2/3" />
                                        <div className="skeleton h-8 w-full mt-2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="card overflow-hidden motion-surface cursor-default"
                                >
                                    <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <span className="text-gray-400 text-sm">No image available</span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-900 mb-1 leading-snug">{item.name}</h3>
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-base font-bold text-primary-600">LKR {item.price.toFixed(2)}</span>
                                            <Button size="sm" onClick={() => handleAddToCart(item)}>Add</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card p-8 text-center text-gray-500 text-sm">
                            No featured items yet. Check back soon!
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">Ready to Order?</h2>
                    <p className="text-primary-100 text-base md:text-lg mb-8 max-w-md mx-auto">
                        Explore our menu and place your order in just a few clicks!
                    </p>
                    <Link to="/menu">
                        <Button size="lg" variant="secondary" className="font-bold shadow-lg">
                            Order Now →
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
