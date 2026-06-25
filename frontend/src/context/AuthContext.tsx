import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { pb } from "@/lib/pocketbase";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthed: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function currentUser(): User | null {
  // PB 0.21 exposes the auth record via `authStore.model`.
  return (pb.authStore.model as unknown as User | null) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(currentUser);
  const [initializing, setInitializing] = useState(true);

  // Keep React state in sync with the PB auth store across tabs / token refresh.
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange(() => {
      setUser(currentUser());
    });
    return () => unsubscribe();
  }, []);

  // On mount, refresh the session if a token is present but possibly stale.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (pb.authStore.isValid) {
        try {
          await pb.collection("users").authRefresh();
        } catch {
          pb.authStore.clear();
        }
      }
      if (!cancelled) {
        setUser(currentUser());
        setInitializing(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await pb.collection("users").authWithPassword(email, password);
    setUser(currentUser());
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm: password,
        name: name || email.split("@")[0],
      });
      await pb.collection("users").authWithPassword(email, password);
      setUser(currentUser());
    },
    [],
  );

  const logout = useCallback(() => {
    pb.authStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthed: Boolean(user),
      initializing,
      login,
      register,
      logout,
    }),
    [user, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
