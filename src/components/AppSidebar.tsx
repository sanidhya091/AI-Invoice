import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus, Users, FileText, Zap } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/invoices/new", label: "New Invoice", icon: FilePlus },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/invoices", label: "Invoices", icon: FileText },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col z-50">
      <div className="p-6 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Zap className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-accent-foreground tracking-tight">
          InvoiceAI
        </span>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mx-3 mb-4 rounded-lg bg-sidebar-accent">
        <p className="text-xs font-medium text-sidebar-accent-foreground">AI-Powered</p>
        <p className="text-xs text-sidebar-muted mt-1">
          Generate professional invoices in seconds with AI assistance.
        </p>
      </div>
    </aside>
  );
};

export default AppSidebar;
