import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { initOfflineSync, processSyncQueue } from './sync';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { ReportsPage } from './pages/ReportsPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { RestockPage } from './pages/RestockPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ItemsPage } from './pages/ItemsPage';
import { DiscountsPage, PaymentMethodsPage } from './pages/DiscountsPaymentPages';
import { CustomersPage, SuppliersPage } from './pages/CustomersSuppliersPages';
import { MembersPage, SettingsPage } from './pages/MembersSettingsPages';
import { AiAgentPage, TierBPage } from './pages/AiAndTierBPages';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  useEffect(() => {
    initOfflineSync(showToast);
    processSyncQueue(showToast);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout toastMessage={toast} />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="pos" element={<PosPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="sales-history" element={<SalesHistoryPage />} />
        <Route path="restock" element={<RestockPage />} />
        <Route path="expenses" element={<ExpensesPage />} />

        {/* Items Module */}
        <Route path="items" element={<Navigate to="/items/products" replace />} />
        <Route path="items/products" element={<ItemsPage subPage="products" />} />
        <Route path="items/attributes" element={<ItemsPage subPage="attributes" />} />
        <Route path="items/categories" element={<ItemsPage subPage="categories" />} />
        <Route path="items/brands" element={<ItemsPage subPage="brands" />} />
        <Route path="items/units" element={<ItemsPage subPage="units" />} />

        <Route path="discounts" element={<DiscountsPage />} />
        <Route path="payment-methods" element={<PaymentMethodsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="ai-agent" element={<AiAgentPage />} />
        <Route path="tier-b" element={<TierBPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
