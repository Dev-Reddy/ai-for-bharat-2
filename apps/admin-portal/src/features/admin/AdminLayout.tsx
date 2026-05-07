import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "../../lib/routerCompat";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../components/theme-provider";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Megaphone,
  Briefcase,
  BookOpen,
  MessageCircle,
  Settings,
  LogOut,
  Bell,
  Menu,
  Sun,
  Moon,
  AlignLeft,
  Bot,
  User as UserIcon,
  Sparkles,
  BrainCircuit,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authApi } from "../../services/authApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Users, label: "Leads", path: "/admin/leads" },
  { icon: AlignLeft, label: "Follow Ups", path: "/admin/followups" },
  { icon: MessageSquare, label: "Conversations", path: "/admin/conversations" },
  { icon: Briefcase, label: "Campaigns", path: "/admin/campaigns" },
  { icon: UserIcon, label: "Users & RMs", path: "/admin/users" },
  { icon: BookOpen, label: "Knowledge Base", path: "/admin/knowledge" },
  { icon: Sparkles, label: "Analysis Contexts", path: "/admin/analysis-contexts" },
  { icon: BrainCircuit, label: "Knowledge Contexts", path: "/admin/knowledge-contexts" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export default function AdminLayout() {
  const user = useAuthStore((state) => state.profile);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    void authApi.logout().then(() => navigate("/admin/login"));
  };

  if (!user) return null;

  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Lead Assigned", description: "John Doe just requested a demo.", path: "/admin/leads", isRead: false },
    { id: 2, title: "Follow-up Reminder", description: "Call Sarah at 2 PM today.", path: "/admin/followups", isRead: false },
    { id: 3, title: "New Message", description: "Mike sent a message.", path: "/admin/conversations", isRead: false },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notif: any) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    navigate(notif.path);
  };

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-[#111827] text-gray-200 border-r border-gray-200 dark:border-gray-700">
      <div className="flex h-14 items-center shrink-0 px-4 font-bold text-white tracking-tight border-b border-gray-700 gap-2">
        <div className="w-6 h-6 bg-gradient-to-tr from-gray-700 to-gray-900 rounded-md" />
        LeadOS
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const normalize = (p: string) => (p ? p.replace(/\/+$/, "") : p) || "/";
            const lp = normalize(location.pathname);
            const ip = normalize(item.path);
            const isActive = lp === ip || lp.startsWith(ip + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-gray-100" : "text-gray-400"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#0B0F14] text-gray-900 dark:text-gray-200 w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64 w-full">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0B0F14] px-4 shadow-sm sm:px-6">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden text-gray-600 dark:text-gray-300")}>
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open sidebar</span>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 border-r-gray-700 bg-[#111827]">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarContent />
              </SheetContent>
            </Sheet>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
              FinPartner Pro
              </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800")}>
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white">{unreadCount}</Badge>}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-700">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-gray-900 dark:text-white flex justify-between">
                    Notifications
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="xs" onClick={() => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))} className="text-xs h-auto p-0 font-normal">Mark all read</Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  {notifications.map(notif => (
                    <DropdownMenuItem key={notif.id} className="cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-800" onClick={() => handleNotificationClick(notif)}>
                      <div className="flex flex-col">
                        <span className={`font-medium text-sm ${notif.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {notif.title}
                          {!notif.isRead && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500"></span>}
                        </span>
                        <span className="text-xs">{notif.description}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="text-gray-600 dark:text-gray-300 rounded-full"
            >
              {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "relative h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 cursor-pointer px-0")}>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name.substring(0, 2).toUpperCase()}
                  </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white dark:bg-[#111827] border-gray-200 dark:border-gray-700" align="end" forceMount>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal text-gray-900 dark:text-white pb-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-800">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/analysis-contexts')} className="cursor-pointer text-gray-700 dark:text-gray-300 focus:bg-gray-100 dark:focus:bg-gray-800">
                    <Sparkles className="mr-2 h-4 w-4" />
                    <span>Analysis Contexts</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
