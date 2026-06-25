import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, LogOut, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GradientText } from "@/components/reactbits/GradientText";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initials(name?: string, email?: string): string {
  const base = name || email || "?";
  return base.slice(0, 2).toUpperCase();
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/app" className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                <Send className="h-4 w-4 text-primary" />
              </span>
              <GradientText className="text-lg">Kreach</GradientText>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <NavLink
                to="/app"
                end
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <LayoutGrid className="h-4 w-4" />
                Projects
              </NavLink>
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {initials(user?.name, user?.email)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col">
                <span className="truncate">{user?.name || "Account"}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container flex-1 py-8">
        <Outlet />
      </main>
    </div>
  );
}
