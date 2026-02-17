import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import InventoryDashboard from './components/InventoryDashboard/InventoryDashboard';
import DeliveryTracking from './components/DeliveryTracking/DeliveryTracking';
import CustomerManagement from './components/CustomerManagement/CustomerManagement';

const RootLayout = () => {
  return (
    <div className="app-container">
      <main>
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
      ],
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;