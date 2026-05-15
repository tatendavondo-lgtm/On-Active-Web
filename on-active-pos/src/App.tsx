import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSessionStore } from './stores/sessionStore';
import { isSalesmanRole } from './types/employee';
import { SalesmanShell } from './components/layout/SalesmanShell';
import { TillShell } from './components/layout/TillShell';
import Login from './pages/Login';
import { ToastContainer } from './components/shared/Toast';
import { useNotificationListener } from './hooks/useNotifications';

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const employee = useSessionStore((s) => s.employee);
  useNotificationListener();

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* SALESMAN ROUTES */}
        <Route
          path="/sales/*"
          element={
            <ProtectedRoute>
              <SalesmanShell>
                <Routes>
                  <Route path="/" element={<SalesFloor />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path="/customers" element={<Customers />} />
                </Routes>
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
                <Routes>
                  <Route path="/" element={<TillRegister />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/online-orders" element={<OnlineOrders />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/end-of-day" element={<EndOfDay />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
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
    </BrowserRouter>
  );
}
