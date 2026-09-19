import { Outlet } from 'react-router-dom';
import { AdminProvider } from '../contexts/AdminContext';
import AdminSidebar from './AdminSidebar';
import '../styles/AdminLayout.css';
import '../styles/AdminPages.css';

export default function AdminLayout() {
  return (
    <AdminProvider>
      <div className="admin-root">
        <AdminSidebar />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </AdminProvider>
  );
}
