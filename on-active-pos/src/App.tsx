import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSessionStore } from './stores/sessionStore';
import { isSalesmanRole } from './types/employee';
import { SalesmanShell } from './components/layout/SalesmanShell';
import { TillShell } from './components/layout/TillShell';
import Login from './pages/Login';
import { ToastContainer } from './components/shared/Toast';
import { useNotificationListener } from './hooks/useNotifications';
import { AnimatedRoutes } from './components/shared/AnimatedRoutes';
import { PageTransition } from './components/shared/PageTransition';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Salesman pages
import SalesFloor from './pages/salesman/SalesFloor';
import MyOrders from './pages/salesman/MyOrders';

// Till pages
import TillRegister from './pages/till/TillRegister';
import Settings from './pages/till/Settings';
import Customers from './pages/Customers';
import Orders from './pages/till/Orders';
import OnlineOrders from './pages/till/OnlineOrders';
import EndOfDay from './pages/till/EndOfDay';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const employee = useSessionStore((s) => s.employee);
  useNotificationListener();

  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* SALESMAN ROUTES */}
        <Route
          path="/sales/*"
          element={
            <ProtectedRoute>
              <SalesmanShell>
                <AnimatedRoutes>
                  <Route path="/" element={<PageTransition><SalesFloor /></PageTransition>} />
                  <Route path="/my-orders" element={<PageTransition><MyOrders /></PageTransition>} />
                  <Route path="/customers" element={<PageTransition><Customers /></PageTransition>} />
                </AnimatedRoutes>
              </SalesmanShell>
            </ProtectedRoute>
          }
        />

        {/* TILL ROUTES */}
        <Route
          path="/till/*"
          element={
            <ProtectedRoute>
              <TillShell>
                <AnimatedRoutes>
                  <Route path="/" element={<PageTransition><TillRegister /></PageTransition>} />
                  <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
                  <Route path="/online-orders" element={<PageTransition><OnlineOrders /></PageTransition>} />
                  <Route path="/customers" element={<PageTransition><Customers /></PageTransition>} />
                  <Route path="/end-of-day" element={<PageTransition><EndOfDay /></PageTransition>} />
                  <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
                </AnimatedRoutes>
              </TillShell>
            </ProtectedRoute>
          }
        />

        {/* Root redirect based on role */}
        <Route
          path="/"
          element={
            employee
              ? <Navigate to={isSalesmanRole(employee.role) ? '/sales' : '/till'} replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
