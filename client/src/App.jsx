import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout>
          <AppRoutes />
        </MainLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
