import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_VISIBILITY_STORAGE_KEY = 'dashboardSidebarVisible';

// Code Review: Function MainLayout in client\src\components\layout\MainLayout.jsx. Used in: client/src/App.jsx, client/src/components/layout/Footer.jsx, client/src/components/layout/MainLayout.jsx.
const MainLayout = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const isPosRoute = location.pathname.startsWith('/cashier/pos');
    const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }

        return window.localStorage.getItem(SIDEBAR_VISIBILITY_STORAGE_KEY) !== 'false';
    });
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Determine if we should show sidebar (for dashboard pages)
    // Code Review: Function isDashboardRoute in client\src\components\layout\MainLayout.jsx. Used in: client/src/components/layout/MainLayout.jsx.
    const isDashboardRoute = () => {
        const dashboardPaths = ['/admin', '/cashier', '/kitchen', '/delivery'];
        return dashboardPaths.some(path => location.pathname.startsWith(path));
    };

    // Don't show header/footer on login/register pages
    const isAuthPage = ['/login', '/register'].includes(location.pathname);

    const showSidebar = isAuthenticated && isDashboardRoute();
    const showDesktopSidebar = showSidebar && isDesktopSidebarVisible;
    const shouldShowFooter = !(isPosRoute && isFullscreen);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(SIDEBAR_VISIBILITY_STORAGE_KEY, String(isDesktopSidebarVisible));
        }
    }, [isDesktopSidebarVisible]);

    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!isMobileSidebarOpen) {
            return undefined;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMobileSidebarOpen]);

    useEffect(() => {
        if (!showSidebar) {
            setIsMobileSidebarOpen(false);
        }
    }, [showSidebar]);

    useEffect(() => {
        if (!showSidebar || !isMobileSidebarOpen) {
            return undefined;
        }

        // Code Review: Function handleEscapeKey in client\src\components\layout\MainLayout.jsx. Used in: client/src/components/layout/MainLayout.jsx.
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setIsMobileSidebarOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscapeKey);

        return () => {
            window.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showSidebar, isMobileSidebarOpen]);

    useEffect(() => {
        // Code Review: Function handleFullscreenChange in client\src\components\layout\MainLayout.jsx. Used in: client/src/components/layout/MainLayout.jsx.
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        handleFullscreenChange();

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen overflow-x-hidden bg-gradient-to-b from-slate-50/80 via-white to-slate-100/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <Header
                showSidebarToggle={showSidebar}
                isSidebarVisible={isDesktopSidebarVisible}
                isMobileSidebarOpen={isMobileSidebarOpen}
                onToggleSidebar={() => setIsDesktopSidebarVisible((previous) => !previous)}
                onToggleMobileSidebar={() => setIsMobileSidebarOpen((previous) => !previous)}
            />

            <div className="flex flex-1 relative">
                {showSidebar && (
                    <Sidebar
                        className={`hidden lg:block sticky top-16 self-start min-h-[calc(100vh-4rem)] overflow-hidden transition-all duration-300 ease-in-out motion-reduce:transition-none ${showDesktopSidebar
                            ? 'w-64 opacity-100 translate-x-0 bg-white/95 shadow-sm border-r border-gray-200/80 backdrop-blur dark:bg-slate-900/95 dark:border-slate-700'
                            : 'w-0 opacity-0 -translate-x-2 bg-transparent shadow-none pointer-events-none'
                            }`}
                    />
                )}

                {showSidebar && (
                    <>
                        <button
                            type="button"
                            className={`lg:hidden fixed inset-0 z-30 bg-slate-900/35 backdrop-blur-[1px] transition-opacity duration-300 ease-out motion-reduce:transition-none dark:bg-slate-950/60 ${isMobileSidebarOpen
                                ? 'opacity-100 pointer-events-auto'
                                : 'opacity-0 pointer-events-none'
                                }`}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            aria-label="Close sidebar overlay"
                        />

                        <Sidebar
                            className={`lg:hidden fixed top-16 bottom-0 left-0 z-40 w-72 bg-white shadow-xl border-r border-gray-200 overflow-y-auto transform transition-transform duration-300 ease-out motion-reduce:transition-none dark:bg-slate-900 dark:border-slate-700 ${isMobileSidebarOpen
                                ? 'translate-x-0 pointer-events-auto'
                                : '-translate-x-full pointer-events-none'
                                }`}
                            onNavigate={() => setIsMobileSidebarOpen(false)}
                        />
                    </>
                )}

                <main className={`flex-1 min-w-0 w-full py-6 md:py-8 transition-all duration-300 ease-in-out motion-reduce:transition-none ${showSidebar ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
                    <div key={location.pathname} className="route-motion-shell">
                        {children}
                    </div>
                </main>
            </div>

            {shouldShowFooter && <Footer />}
        </div>
    );
};

export default MainLayout;
