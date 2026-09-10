import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getLoggedUser, getUserInfo, login as apiLogin, logout as apiLogout } from "./api";

type AuthState = {
  loading: boolean;
  user: string | null;
  fullName: string | null;
  login: (usr: string, pwd: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const logged = await getLoggedUser();
    if (!logged) {
      setUser(null);
      setFullName(null);
      setLoading(false);
      return;
    }
    setUser(logged.user || logged.message);
    const info = await getUserInfo();
    setFullName(info?.full_name || logged.user || logged.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const onAuthError = () => void refresh();
    window.addEventListener("dj:auth-error", onAuthError);
    return () => window.removeEventListener("dj:auth-error", onAuthError);
  }, [refresh]);

  const login = async (usr: string, pwd: string) => {
    await apiLogin(usr, pwd);
    await refresh();
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setFullName(null);
  };

  return createElement(
    AuthContext.Provider,
    {
      value: { loading, user, fullName, login, logout, refresh },
    },
    children,
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
