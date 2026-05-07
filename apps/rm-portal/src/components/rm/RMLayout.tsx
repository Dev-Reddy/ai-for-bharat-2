import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { LayoutDashboard, Users, Clock, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from '@tanstack/react-router';
import { authApi } from '../../services/authApi';

export const RMLayout = ({ children }: { children: ReactNode }) => {
  const profile = useAuthStore((state) => state.profile);
  const navigate = useNavigate();
  const menuItems = [
    { to: '/rm/dashboard', icon: <LayoutDashboard size={18}/>, label: "Dashboard" },
    { to: '/rm/leads', icon: <Users size={18}/>, label: "My Leads" },
    { to: '/rm/follow-ups', icon: <Clock size={18}/>, label: "Follow Ups" },
  ];

  return (
    <div className="flex h-screen bg-[#F1F5F9] overflow-hidden font-sans">
      <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-black text-white italic flex items-center gap-2">
            <img src="/LeadOS_Logo.jpg" alt="LeadOS logo" className="w-8 h-8 rounded object-cover not-italic" />
            <span className="not-italic">LeadOS RM</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' }}
              inactiveProps={{ className: 'text-slate-400 hover:bg-slate-800 hover:text-white' }}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-bold transition-all"
            >
              {item.icon} <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={async () => {
              await authApi.logout();
              navigate({ to: "/rm/login" });
            }}
            className="flex items-center gap-3 px-4 py-3 w-full hover:text-white transition-colors text-sm font-bold opacity-50"
          >
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 uppercase tracking-widest text-[10px] font-black text-slate-400">
          <span>LeadOS RM Portal</span>
          <span>{profile?.name}</span>
        </header>
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
};
