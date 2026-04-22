// CODEMAP: FRONTEND_APP_SHELL
// PURPOSE: Compose router, providers, layout, and global toast UI.
// SEARCH_HINT: Start here to explain frontend composition.
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/ErrorBoundary';

// Inner component so it can access ThemeContext for the toast theme
// Simple: This shows the app inner section.
const AppInner = () => {
  const { theme } = useTheme();
  return (
    <>
      <ErrorBoundary>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </ErrorBoundary>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
        progressClassName="!bg-primary-500"
      />
    </>
  );
};

// Simple: This shows the app section.
function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppInner />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
