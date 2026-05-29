import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Ticket, FolderKanban, Users, LogOut, Menu, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/tickets', icon: Ticket, label: 'Tickets', end: false },
  { to: '/projects', icon: FolderKanban, label: 'Projects', end: false },
  { to: '/technicians', icon: Users, label: 'Technicians', end: false },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-navy-800 flex items-center">
        <img
          src="https://easydatagroup.com/img/edi-logo.svg"
          alt="Easy Data Integration"
          className="h-10 w-auto"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-navy-600 text-xs font-semibold uppercase tracking-wider px-4 mb-2">Menu</p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
            <ChevronRight size={14} className="ml-auto opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-navy-800 pt-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-navy-800 mb-2">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            <img
              src="https://easydatagroup.com/img/pattern.png"
              alt="avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user}</p>
            <p className="text-navy-500 text-xs">Administrator</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-navy-400 hover:text-red-400 hover:bg-red-950/30 transition-all text-sm">
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-navy-50 overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 bg-navy-950 shrink-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-60 bg-navy-950 flex flex-col"><SidebarContent /></div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-navy-100 px-6 py-4 flex items-center gap-4 shrink-0">
          <button className="lg:hidden text-navy-600" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-navy-800">{user}</p>
              <p className="text-xs text-navy-400">Administrator</p>
            </div>
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              <img
                src="https://easydatagroup.com/img/pattern.png"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
