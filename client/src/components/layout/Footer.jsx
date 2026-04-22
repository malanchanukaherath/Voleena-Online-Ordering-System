// CODEMAP: FRONTEND_COMPONENTS_LAYOUT_FOOTER_JSX
// WHAT_THIS_IS: This file supports frontend behavior for Footer.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/layout/Footer.jsx
// - Search text: Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { usePublicSettings } from '../../hooks/usePublicSettings';

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
};

// Simple: This cleans or formats the business hour.
const formatBusinessHour = (value) => {
    if (!value || typeof value !== 'string') return '--';
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return '--';
    const period = hours >= 12 ? 'PM' : 'AM';
    const normalizedHour = hours % 12 || 12;
    return `${normalizedHour}:${String(minutes).padStart(2, '0')} ${period}`;
};

// Simple: This shows the footer section.
const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { settings } = usePublicSettings();
    const restaurantName = settings.restaurantName || 'Voleena Foods';
    const businessHours = settings.businessHours || {};

    return (
        <footer className="bg-slate-900 text-slate-300 border-t border-slate-800/80 dark:bg-slate-950 dark:border-slate-700/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About Section */}
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-sm">
                                <span className="text-white font-bold text-xl">{restaurantName.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-xl font-bold text-white">{restaurantName}</span>
                        </div>
                        <p className="text-sm leading-6 text-slate-300">
                            Delicious traditional Sri Lankan meals, combo packs, and catering services delivered to your doorstep.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/" className="hover:text-primary-300 transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/menu" className="hover:text-primary-300 transition-colors">
                                    Menu
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="hover:text-primary-300 transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="hover:text-primary-300 transition-colors">
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
                                <span className="leading-5">{settings.address}</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaPhone className="w-4 h-4" />
                                <span>{settings.phone}</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <FaEnvelope className="w-4 h-4" />
                                <span>{settings.email}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Operating Hours */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Operating Hours</h3>
                        <ul className="space-y-2 text-sm">
                            {DAY_ORDER.map((day) => {
                                const dayData = businessHours[day] || {};
                                const label = DAY_LABELS[day] || day;
                                const hoursLabel = dayData.closed
                                    ? 'Closed'
                                    : `${formatBusinessHour(dayData.open)} - ${formatBusinessHour(dayData.close)}`;

                                return (
                                    <li key={day} className="flex justify-between gap-4">
                                        <span>{label}:</span>
                                        <span className="text-white text-right">{hoursLabel}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm gap-3 dark:border-slate-700">
                    <p>&copy; {currentYear} {restaurantName}. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 sm:mt-0">
                        <Link to="/privacy" className="hover:text-primary-300 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/terms" className="hover:text-primary-300 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

