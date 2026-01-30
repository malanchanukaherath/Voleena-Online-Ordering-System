import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { FaUtensils, FaTruck, FaClock, FaStar } from 'react-icons/fa';

const Home = () => {
    const { isAuthenticated } = useAuth();

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <div className="h-48 bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-400">Menu Item {item}</span>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold mb-2">Sample Item {item}</h3>
                                    <p className="text-sm text-gray-600 mb-3">Delicious food description</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-primary-600">LKR 450.00</span>
                                        <Button size="sm">Add to Cart</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
                        <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                            Order Now
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
