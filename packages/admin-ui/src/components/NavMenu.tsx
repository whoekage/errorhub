import { NavLink } from "react-router-dom";
import { Home, ListTree, /* Languages, */ LayoutGrid, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { to: "/", label: "Dashboard", Icon: Home },
  { to: "/errors", label: "Errors", Icon: ListTree },
  // { to: "/translations", label: "Translations", Icon: Languages },
  { to: "/categories", label: "Categories", Icon: LayoutGrid },
  { to: "/settings/languages", label: "Language Settings", Icon: Globe },
];

export function NavMenu() {
  return (
    <nav className="flex flex-col space-y-1 p-2">
      {menuItems.map(({ to, label, Icon }) => (
        <NavLink
          key={label}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
} 