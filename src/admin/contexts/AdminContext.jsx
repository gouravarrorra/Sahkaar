import { createContext, useContext, useState, useCallback } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarOpen(p => !p), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleCollapse = useCallback(() => setSidebarCollapsed(p => !p), []);

  return (
    <AdminContext.Provider value={{
      sidebarOpen, toggleSidebar, closeSidebar,
      sidebarCollapsed, toggleCollapse,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
