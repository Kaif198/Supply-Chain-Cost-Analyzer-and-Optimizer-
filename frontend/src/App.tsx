import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy-loaded pages for code splitting
const AnalyticsDashboardPage = lazy(() => import('./pages/AnalyticsDashboardPage'));
const CostCalculatorPage = lazy(() => import('./pages/CostCalculatorPage'));
const RouteOptimizerPage = lazy(() => import('./pages/RouteOptimizerPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const PremiseManagementPage = lazy(() => import('./pages/PremiseManagementPage'));
const DeliveryHistoryPage = lazy(() => import('./pages/DeliveryHistoryPage'));
const VehicleFleetPage = lazy(() => import('./pages/VehicleFleetPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const InventoryChainPage = lazy(() => import('./pages/InventoryChain'));
const ForecastingPage = lazy(() => import('./pages/Forecasting'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AnalyticsDashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="calculator"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <CostCalculatorPage />
                  </Suspense>
                }
              />
              <Route
                path="optimizer"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <RouteOptimizerPage />
                  </Suspense>
                }
              />
              <Route
                path="map"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <MapPage />
                  </Suspense>
                }
              />
              <Route
                path="analytics"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AnalyticsDashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="premises"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <PremiseManagementPage />
                  </Suspense>
                }
              />
              <Route
                path="deliveries"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <DeliveryHistoryPage />
                  </Suspense>
                }
              />
              <Route
                path="fleet"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <VehicleFleetPage />
                  </Suspense>
                }
              />
              <Route
                path="inventory-chain"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <InventoryChainPage />
                  </Suspense>
                }
              />
              <Route
                path="forecasting"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ForecastingPage />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
