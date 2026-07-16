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

export interface MembershipOption {
  membershipId: string | null;
  groupId: string;
  groupName: string;
  role: UserRole;
  village?: string;
}

interface AuthContextValue {
  user: User | null;
  group: Group | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string; role?: string; requiresGroupSelection?: boolean }>;
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
  availableGroups: MembershipOption[] | null;
  selectMembership: (phone: string, password: string, membershipId: string) => Promise<{ success: boolean; error?: string }>;
  switchSHG: (membershipId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  myMemberships: MembershipOption[] | null;
  loadMyMemberships: () => Promise<void>;
  getPendingCredentials: () => { phone: string; password: string } | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableGroups, setAvailableGroups] = useState<MembershipOption[] | null>(null);
  const [myMemberships, setMyMemberships] = useState<MembershipOption[] | null>(null);
  // Holds phone+password in memory only during multi-SHG selection (never persisted)
  const pendingCredentials = useRef<{ phone: string; password: string } | null>(null);

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
    // Resolve language priority: user > keep current UI language
    // We do NOT fallback to g.preferredLanguage because it defaults to "mr" 
    // and will overwrite the user's explicit toggle selection during onboarding.
    if (u.preferredLanguage) {
      setLanguageRef.current(u.preferredLanguage as Language);
    }
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
      const data = await apiPost<any>(
        "/api/auth/login",
        { phone, password },
        false,
      );
      if (data.requiresGroupSelection) {
        setAvailableGroups(data.memberships);
        pendingCredentials.current = { phone, password };
        return { success: false, requiresGroupSelection: true };
      }
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
    setAvailableGroups(null);
    setMyMemberships(null);
    pendingCredentials.current = null;
    // On logout, reset to app default language
    setLanguageRef.current("en" as Language);
  }, []);

  // ── Select membership (multi-SHG second login step) ───────────────────────
  const selectMembership = useCallback(async (phone: string, password: string, membershipId: string) => {
    try {
      const data = await apiPost<{ token: string; user: User; group: Group }>(
        "/api/auth/select-membership",
        { phone, password, membershipId },
        false,
      );
      await saveToken(data.token);
      setAvailableGroups(null);
      pendingCredentials.current = null;
      applySession(data.user, data.group);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "error" };
    }
  }, [applySession]);

  // ── Switch SHG from inside the app ───────────────────────────────────
  const switchSHG = useCallback(async (membershipId: string, password: string) => {
    try {
      const data = await apiPost<{ token: string; user: User; group: Group }>(
        "/api/auth/switch-membership",
        { membershipId, password },
      );
      await saveToken(data.token);
      applySession(data.user, data.group);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "error" };
    }
  }, [applySession]);

  // ── Load all memberships for this identity ──────────────────────────────
  const loadMyMemberships = useCallback(async () => {
    try {
      const data = await apiGet<{ memberships: MembershipOption[] }>("/api/auth/my-memberships");
      setMyMemberships(data.memberships);
    } catch {}
  }, []);

  const getPendingCredentials = useCallback(() => pendingCredentials.current, []);

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
    () => ({ user, group, isLoading, login, registerPresident, registerMember, logout, verifyPassword, isPresident, isTreasurer, refreshSession, availableGroups, selectMembership, switchSHG, myMemberships, loadMyMemberships, getPendingCredentials }),
    [user, group, isLoading, login, registerPresident, registerMember, logout, verifyPassword, isPresident, isTreasurer, refreshSession, availableGroups, selectMembership, switchSHG, myMemberships, loadMyMemberships, getPendingCredentials],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
