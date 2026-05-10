import * as React from "react";
import { Link, Outlet, useRouter } from "@tanstack/react-router";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Database,
  Calendar as CalendarIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getSupabaseConfig } from "@/lib/supabase";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');

  React.useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const navItems = [
    { label: "Home", href: "/", icon: LayoutDashboard },
    { label: "Lista de Clientes", href: "/leads", icon: Users },
    { label: "Agenda", href: "/agenda", icon: CalendarIcon },
    { label: "Configurações", href: "/settings", icon: Settings },
  ];

  const config = getSupabaseConfig();

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">M</div>
          <span className="font-semibold">Meu Dentista</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="fixed inset-y-0 left-0 w-64 bg-background border-r p-4 shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">M</div>
                <span className="font-semibold">Meu Dentista</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm font-medium transition-colors"
                  activeProps={{ className: "bg-primary text-primary-foreground" }}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col border-r bg-card transition-all duration-300 fixed inset-y-0 left-0 z-40",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-4 flex items-center justify-between border-b">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden animate-in fade-in duration-500">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">M</div>
              <span className="font-bold whitespace-nowrap">Meu Dentista</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">M</div>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="hidden lg:flex" 
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <TooltipProvider delayDuration={0}>
            {navItems.map((item) => (
              <Tooltip key={item.href} open={collapsed ? undefined : false}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-sm font-medium transition-colors group",
                      collapsed && "justify-center"
                    )}
                    activeProps={{ className: "bg-primary text-primary-foreground" }}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>

        <div className="p-4 border-t space-y-4">
          {!config && (
            <div className={cn("bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md flex items-center gap-2 text-orange-800 dark:text-orange-200 text-xs", collapsed && "justify-center")}>
              <Database className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Banco não configurado</span>}
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-full justify-start gap-3 px-3" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {!collapsed && <span>{theme === 'light' ? 'Escuro' : 'Claro'}</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
