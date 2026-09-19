import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import {
  LayoutDashboard, Users, ShieldCheck, Award, Briefcase, CalendarCheck,
  IndianRupee, MapPin, Wallet, HeartHandshake, ShieldPlus, Landmark,
  GraduationCap, BarChart3, FileCheck, LifeBuoy, ScrollText, Menu
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Workers',
    items: [
      { path: '/admin/workers', label: 'Worker Registry', icon: Users },
      { path: '/admin/verification', label: 'Verification', icon: ShieldCheck },
      { path: '/admin/certifications', label: 'Certifications', icon: Award },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/admin/services', label: 'Services', icon: Briefcase },
      { path: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
      { path: '/admin/pricing', label: 'Pricing', icon: IndianRupee },
      { path: '/admin/travel-cost', label: 'Travel Cost', icon: MapPin },
    ],
  },
  {
    title: 'Finance',
    items: [
      { path: '/admin/payments', label: 'Payments', icon: Wallet },
      { path: '/admin/welfare', label: 'Welfare', icon: HeartHandshake },
      { path: '/admin/insurance', label: 'Insurance', icon: ShieldPlus },
    ],
  },
  {
    title: 'Programs',
    items: [
      { path: '/admin/schemes', label: 'Govt Schemes', icon: Landmark },
      { path: '/admin/training', label: 'Training', icon: GraduationCap },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/admin/requirements', label: 'Requirements', icon: FileCheck },
      { path: '/admin/support', label: 'Support', icon: LifeBuoy },
      { path: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    ],
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { sidebarOpen, closeSidebar, sidebarCollapsed } = useAdmin();

  const handleNav = (path) => {
    navigate(path);
    closeSidebar();
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'admin-sidebar-overlay--visible' : ''}`}
        onClick={closeSidebar}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''} ${sidebarCollapsed ? 'admin-sidebar--collapsed' : ''}`}>
        {/* Brand */}
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">SAHKAAR</span>
          {!sidebarCollapsed && <span className="admin-sidebar__badge">Admin</span>}
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar__nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.title} className="admin-sidebar__section">
              {!sidebarCollapsed && (
                <div className="admin-sidebar__section-title">{section.title}</div>
              )}
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <button
                    key={item.path}
                    className={`admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`}
                    onClick={() => handleNav(item.path)}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className="admin-sidebar__link-icon" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile toggle */}
      <MobileToggle />
    </>
  );
}

function MobileToggle() {
  const { toggleSidebar } = useAdmin();
  return (
    <button className="admin-sidebar__toggle" onClick={toggleSidebar} aria-label="Toggle sidebar">
      <Menu size={22} />
    </button>
  );
}
