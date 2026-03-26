import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import InventoryDashboard from './components/InventoryDashboard/InventoryDashboard';
import DeliveryTracking from './components/DeliveryTracking/DeliveryTracking';
import OrderHandoff from './components/OrderHandoff/OrderHandoff';
import CustomerManagement from './components/CustomerManagement/CustomerManagement';
import ReportsDashboard from './components/ReportsDashboard/ReportsDashboard';
import { getHealth } from './lib/api';

const RootLayout = () => {
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadHealth() {
      setHealthError('');
      try {
        const result = await getHealth();
        if (!mounted) return;
        setHealth(result?.data || null);
      } catch (err) {
        if (!mounted) return;
        setHealthError(err?.message || 'API ချိတ်ဆက်မှု မအောင်မြင်ပါ');
      }
    }

    loadHealth();
    const timer = setInterval(loadHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const apiOk = health?.status === 'ok';
  const dbOk = health?.db?.status === 'ok';

  return (
    <div className="app-container">
      <main>
        {(healthError || (health && (!apiOk || !dbOk))) && (
          <div className="sticky top-0 z-50">
            <div
              className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-xs font-bold ${
                healthError || !apiOk || !dbOk
                  ? "bg-red-50 border-red-100 text-red-700"
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}
            >
              {healthError ? (
                <span>API ချိတ်ဆက်မှု: မအောင်မြင်ပါ — {healthError}</span>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <span>API ချိတ်ဆက်မှု: {apiOk ? "OK" : "မအောင်မြင်ပါ"}</span>
                  <span>Database ချိတ်ဆက်မှု: {dbOk ? "OK" : "မအောင်မြင်ပါ"}</span>
                </div>
              )}
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
};

const ErrorFallback = () => (
  <div style={{ textAlign: 'center', marginTop: '50px' }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for doesn't exist.</p>
    <a href="/overview">Go to Dashboard</a>
  </div>
);

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      errorElement: <ErrorFallback />,
      children: [
        {
          index: true,
          element: <Navigate to="/overview" replace />,
        },
        {
          path: "overview",
          element: <AdminDashboard />,
        },
        {
          path: "inventory",
          element: <InventoryDashboard />,
        },
        {
          path: "customers",
          element: <CustomerManagement />,
        },
        {
          path: "deliveries",
          element: <DeliveryTracking />,
        },
        {
          path: "orders",
          element: <OrderHandoff />,
        },
        {
          path: "reports",
          element: <ReportsDashboard />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
