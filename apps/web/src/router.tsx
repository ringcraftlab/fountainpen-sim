import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SimulatorPage } from './pages/SimulatorPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { InventoryPage } from './pages/InventoryPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/simulator" replace /> },
      { path: 'simulator', element: <SimulatorPage /> },
      { path: 'collections', element: <CollectionsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
    ],
  },
]);
