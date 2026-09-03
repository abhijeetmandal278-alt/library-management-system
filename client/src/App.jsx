import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import ScannerPage from './pages/ScannerPage';
import TransactionsPage from './pages/TransactionsPage';
import ExportPage from './pages/ExportPage';
import ReportsPage from './pages/ReportsPage';
import ChatBot from './components/ai/ChatBot';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      {children}
      <ChatBot />
    </Layout>
  );
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/books" element={<ProtectedRoute><BooksPage /></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
      <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#1e293b',
            color: '#f1f5f9',
            fontSize: '14px',
          },
        }} 
      />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
