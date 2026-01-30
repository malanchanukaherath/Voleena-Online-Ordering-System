import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About Section */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">V</span>
                            </div>
                            <span className="text-xl font-bold text-white">Voleena Foods</span>
                        </div>
                        <p className="text-sm">
                            Delicious traditional Sri Lankan meals, combo packs, and catering services delivered to your doorstep.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/" className="hover:text-primary-400 transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/menu" className="hover:text-primary-400 transition-colors">
                                    Menu
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-primary-400 transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-primary-400 transition-colors">
                                    Contact
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Contact Us</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start space-x-2">
                                <FaMapMarkerAlt className="w-4 h-4 mt-1 flex-shrink-0" />
                                <span>Kalagedihena, Gampaha District, Sri Lanka</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaPhone className="w-4 h-4" />
                                <span>+94 71 234 5678</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaEnvelope className="w-4 h-4" />
                                <span>info@voleenafoods.lk</span>
                            </li>
                        </ul>
                    </div>

                    {/* Operating Hours */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Operating Hours</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between">
                                <span>Mon - Fri:</span>
                                <span className="text-white">9:00 AM - 9:00 PM</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Saturday:</span>
                                <span className="text-white">9:00 AM - 10:00 PM</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Sunday:</span>
                                <span className="text-white">10:00 AM - 8:00 PM</span>
                            </li>
                        </ul>
                        <div className="mt-4 flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                                <FaFacebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                                <FaInstagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                                <FaTwitter className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
                    <p>© {currentYear} Voleena Foods. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 sm:mt-0">
                        <Link to="/privacy" className="hover:text-primary-400 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="hover:text-primary-400 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
