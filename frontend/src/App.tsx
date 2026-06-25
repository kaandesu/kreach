import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import ProjectWizard from "@/pages/ProjectWizard";
import ProjectLogs from "@/pages/ProjectLogs";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Auth-required application shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/app" element={<Dashboard />} />
                <Route path="/app/projects/:projectId" element={<ProjectWizard />} />
                <Route
                  path="/app/projects/:projectId/logs"
                  element={<ProjectLogs />}
                />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
