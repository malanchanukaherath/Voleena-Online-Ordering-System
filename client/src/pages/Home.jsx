import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { FaUtensils, FaTruck, FaClock, FaStar } from 'react-icons/fa';
import { menuItemService } from '../services/menuService';
import { addToCart } from '../utils/cartStorage';
import { toast } from 'react-toastify';

const Home = () => {
    const { isAuthenticated } = useAuth();
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const [featuredItems, setFeaturedItems] = useState([]);
    const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);

    const resolveImageUrl = (imagePath) => {
        if (!imagePath) {
            return null;
        }
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        return `${apiBaseUrl}${imagePath}`;
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
                        isAvailable: !!item.IsActive
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

        toast.success('Added to cart');
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
