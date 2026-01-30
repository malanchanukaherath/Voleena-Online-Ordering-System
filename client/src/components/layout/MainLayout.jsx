import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const MainLayout = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    // Determine if we should show sidebar (for dashboard pages)
    const isDashboardRoute = () => {
        const dashboardPaths = ['/admin', '/cashier', '/kitchen', '/delivery'];
        return dashboardPaths.some(path => location.pathname.startsWith(path));
    };

    // Don't show header/footer on login/register pages
    const isAuthPage = ['/login', '/register'].includes(location.pathname);

    const showSidebar = isAuthenticated && isDashboardRoute();

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <div className="flex flex-1">
                {showSidebar && <Sidebar />}

                <main className={`flex-1 ${showSidebar ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-8`}>
                    {children}
                </main>
            </div>

            <Footer />
        </div>
    );
};

export default MainLayout;
