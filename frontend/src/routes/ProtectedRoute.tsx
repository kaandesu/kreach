import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

/** Gate for auth-required pages. Redirects unauthenticated users to /login,
 *  preserving the attempted location so they can be returned after sign-in. */
export function ProtectedRoute() {
  const { isAuthed, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
