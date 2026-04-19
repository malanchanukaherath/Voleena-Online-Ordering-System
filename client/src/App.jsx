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

// Inner component so it can access ThemeContext for the toast theme
// Code Review: Function AppInner in client\src\App.jsx. Used in: client/src/App.jsx.
const AppInner = () => {
  const { theme } = useTheme();
  return (
    <>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
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

// Code Review: Function App in client\src\App.jsx. Used in: client/src/App.jsx, client/src/main.jsx.
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
