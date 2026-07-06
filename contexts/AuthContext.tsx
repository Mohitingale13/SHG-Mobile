// @ts-nocheck
import { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect, useRef } from "react";
import { apiPost, apiGet, getToken, saveToken, clearToken } from "@/lib/api";
import { getEffectiveLanguage, type Language } from "@/contexts/LanguageContext";

// ─────────────────────────────────────────────────────────────────────────────
// Language sync bridge
//
// Problem: AuthProvider needs to call syncLanguage() from LanguageContext,
// but LanguageProvider wraps AuthProvider in the tree, so AuthProvider CAN
// call useLanguage() safely — LanguageContext is already mounted above it.
//
// There is NO circular dependency:
//   LanguageContext.tsx  → imports: storage, api  (no AuthContext)
//   AuthContext.tsx      → imports: api, LanguageContext (one-way)
//
// Provider hierarchy (outer → inner):
//   <LanguageProvider>       ← mounted first, provides { syncLanguage }
//     <AuthProvider>         ← consumes useLanguage(); calls syncLanguage()
//       <DataProvider>
//         <App />
//
// syncLanguage() is a "fire-and-forget" setter — it only updates
// LanguageContext's internal state + local storage. It does NOT call back
// into AuthContext at any point, so there is no circular call chain.
//
// The function reference is obtained via useLanguage() inside AuthProvider
// and stored in a ref so it can be called from async callbacks without
// creating stale closure issues.
// ─────────────────────────────────────────────────────────────────────────────

// Import useLanguage separately to avoid the hook rule issue when called
// inside async functions — we store syncLanguage in a ref at render time.
import { useLanguage } from "@/contexts/LanguageContext";

export type UserRole = "president" | "treasurer" | "member";

export interface User {
  id: string;
  name: string;
  phone: string;
  village: string;
  joinDate: string;
  exitDate?: string;
  role: UserRole;
  groupId: string;
  status: "active" | "left";
  preferredLanguage?: string;
}

export interface Group {
  id: string;
  groupId: string;
  name: string;
  presidentId: string;
  treasurerId?: string;
  qrCode?: string;
  createdAt: string;
  preferredLanguage?: string;
  village?: string;
  taluka?: string;
  district?: string;
}

interface AuthContextValue {
  user: User | null;
  group: Group | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  registerPresident: (data: { name: string; phone: string; password: string; village: string; joinDate?: string; exitDate?: string; uniqueGroupCode: string }) => Promise<{ success: boolean; error?: string }>;
  registerMember: (data: {
    name: string;
    phone: string;
    password: string;
    village: string;
    joinDate?: string;
    exitDate?: string;
    uniqueGroupCode: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  isPresident: boolean;
  isTreasurer: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Language sync ──────────────────────────────────────────────────────────
  // We safely consume useLanguage() here because LanguageProvider is mounted
  // ABOVE AuthProvider in the tree (see _layout.tsx line 66-72).
  // Storing the function in a ref avoids stale closure issues inside async
  // callbacks without needing to add it to every useCallback dependency array.
  const { setLanguage } = useLanguage();
  const setLanguageRef = useRef(setLanguage);
  useEffect(() => { setLanguageRef.current = setLanguage; }, [setLanguage]);

  // Helper: apply both state updates AND language sync in one call
  const applySession = useCallback((u: User, g: Group) => {
    setUser(u);
    setGroup(g);
    // Resolve language priority: user > group > "en"
    const lang = getEffectiveLanguage(u, g);
    setLanguageRef.current(lang as Language);
  }, []);

  // ── Session restore ────────────────────────────────────────────────────────
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await apiGet<{ user: User; group: Group }>("/api/auth/session");
      applySession(data.user, data.group);
    } catch {
      await clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (phone: string, password: string) => {
    try {
      const data = await apiPost<{ token: string; user: User; group: Group }>(
        "/api/auth/login",
        { phone, password },
        false,
      );
      await saveToken(data.token);
      applySession(data.user, data.group);
      return { success: true, role: data.user.role };
    } catch (e: any) {
      return { success: false, error: e.message || "error" };
    }
  }, [applySession]);

  // ── Register ───────────────────────────────────────────────────────────────
  const registerPresident = useCallback(async (data: { name: string; phone: string; password: string; village: string; joinDate?: string; exitDate?: string; uniqueGroupCode: string }) => {
    try {
      const res = await apiPost<{ token: string; user: User; group: Group }>(
        "/api/auth/register/president",
        data,
        false,
      );
      await saveToken(res.token);
      applySession(res.user, res.group);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "error" };
    }
  }, [applySession]);

  const registerMember = useCallback(async (data: { name: string; phone: string; password: string; village: string; joinDate?: string; exitDate?: string; uniqueGroupCode: string }) => {
    try {
      const res = await apiPost<{ token: string; user: User; group: Group }>(
        "/api/auth/register/member",
        data,
        false,
      );
      await saveToken(res.token);
      applySession(res.user, res.group);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "error" };
    }
  }, [applySession]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiPost("/api/auth/logout", {});
    } catch {}
    await clearToken();
    setUser(null);
    setGroup(null);
    // On logout, reset to app default language
    syncLanguageRef.current("en" as Language);
  }, []);

  // ── Verify password ────────────────────────────────────────────────────────
  const verifyPassword = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await apiPost<{ valid: boolean }>("/api/auth/verify-password", { password });
      return res.valid;
    } catch {
      return false;
    }
  }, []);

  // ── Refresh session ────────────────────────────────────────────────────────
  const refreshSession = useCallback(async () => {
    try {
      const data = await apiGet<{ user: User; group: Group }>("/api/auth/session");
      applySession(data.user, data.group);
    } catch {}
  }, [applySession]);

  const isPresident = user?.role === "president";
  const isTreasurer = user?.role === "treasurer";

  const value = useMemo(
    () => ({ user, group, isLoading, login, registerPresident, registerMember, logout, verifyPassword, isPresident, isTreasurer, refreshSession }),
    [user, group, isLoading, login, registerPresident, registerMember, logout, verifyPassword, isPresident, isTreasurer, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
