"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "DRIVER";
  phone?: string;
  createdAt: string;
}

interface AuthContextValue {
  user: DemoUser | null;
  adminUser: DemoUser | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string, name?: string) => Promise<DemoUser>;
  register: (input: { name: string; email: string; password: string; phone?: string }) => Promise<DemoUser>;
  loginAdmin: (email: string, password: string) => Promise<DemoUser>;
  logout: () => Promise<void>;
  logoutAdmin: () => Promise<void>;
  clearError: () => void;
}

const CUSTOMER_SESSION_KEY = "pixo.customer.session.v2";
const ADMIN_SESSION_KEY = "pixo.admin.session.v1";
const CUSTOMER_ACCOUNTS_KEY = "pixo.customer.accounts.v1";
const LEGACY_SESSION_KEY = "pixo.demo.session.v1";
const DEMO_ADMIN_EMAIL = "admin@pixo.local";
const AuthContext = createContext<AuthContextValue | null>(null);

function makeCustomer(email: string, name?: string, phone?: string): DemoUser {
  const normalizedEmail = email.trim().toLowerCase();
  return { id: `demo-user-${normalizedEmail}`, name: name?.trim() || normalizedEmail.split("@")[0] || "\u0639\u0645\u064a\u0644 PIXO", email: normalizedEmail, role: "CUSTOMER", phone, createdAt: new Date().toISOString() };
}

function makeAdmin(): DemoUser {
  return { id: "pixo-local-admin", name: "\u0645\u062f\u064a\u0631 \u0645\u062a\u062c\u0631 PIXO", email: DEMO_ADMIN_EMAIL, role: "ADMIN", createdAt: new Date().toISOString() };
}

function readAccounts(): DemoUser[] {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(CUSTOMER_ACCOUNTS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((account): account is DemoUser => Boolean(account && typeof account.email === "string" && account.role === "CUSTOMER")) : [];
  } catch { return []; }
}

function isUser(value: unknown, role: DemoUser["role"]): value is DemoUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Partial<DemoUser>;
  return user.role === role && typeof user.email === "string" && typeof user.id === "string";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [adminUser, setAdminUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      try {
        const customerSession: unknown = JSON.parse(window.localStorage.getItem(CUSTOMER_SESSION_KEY) ?? "null");
        const adminSession: unknown = JSON.parse(window.localStorage.getItem(ADMIN_SESSION_KEY) ?? "null");
        if (active && isUser(customerSession, "CUSTOMER")) setUser(customerSession);
        if (active && isUser(adminSession, "ADMIN") && adminSession.email.toLowerCase() === DEMO_ADMIN_EMAIL) setAdminUser(adminSession);

        // Migrate old customer sessions only. A shared legacy admin session cannot bypass admin login.
        const legacy: unknown = JSON.parse(window.localStorage.getItem(LEGACY_SESSION_KEY) ?? "null");
        if (!customerSession && isUser(legacy, "CUSTOMER")) {
          if (active) setUser(legacy);
          window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(legacy));
        }
        window.localStorage.removeItem(LEGACY_SESSION_KEY);
      } catch {
        window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
        window.localStorage.removeItem(ADMIN_SESSION_KEY);
        window.localStorage.removeItem(LEGACY_SESSION_KEY);
      } finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function syncSession(event: StorageEvent) {
      if (event.key === CUSTOMER_SESSION_KEY) {
        try { const next: unknown = JSON.parse(event.newValue ?? "null"); setUser(isUser(next, "CUSTOMER") ? next : null); } catch { setUser(null); }
      }
      if (event.key === ADMIN_SESSION_KEY) {
        try { const next: unknown = JSON.parse(event.newValue ?? "null"); setAdminUser(isUser(next, "ADMIN") && next.email.toLowerCase() === DEMO_ADMIN_EMAIL ? next : null); } catch { setAdminUser(null); }
      }
    }
    window.addEventListener("storage", syncSession);
    return () => window.removeEventListener("storage", syncSession);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    adminUser,
    loading,
    error,
    clearError: () => setError(""),
    login: async (email, password, name) => {
      setError("");
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail.includes("@") || !password) {
        const message = "\u0623\u062f\u062e\u0644 \u0628\u0631\u064a\u062f\u064b\u0627 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u064b\u0627 \u0648\u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631.";
        setError(message); throw new Error(message);
      }
      const account = readAccounts().find((item) => item.email.toLowerCase() === normalizedEmail);
      const sessionUser = makeCustomer(normalizedEmail, name || account?.name, account?.phone);
      setUser(sessionUser);
      window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    },
    register: async (input) => {
      setError("");
      const normalizedEmail = input.email.trim().toLowerCase();
      if (!input.name.trim() || !normalizedEmail.includes("@") || input.password.length < 8) {
        const message = "\u0623\u0643\u0645\u0644 \u0627\u0633\u0645\u0643 \u0648\u0628\u0631\u064a\u062f\u0643 \u0648\u0627\u0633\u062a\u062e\u062f\u0645 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u0645\u0646 8 \u0623\u062d\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.";
        setError(message); throw new Error(message);
      }
      const sessionUser = makeCustomer(normalizedEmail, input.name, input.phone);
      const accounts = readAccounts().filter((item) => item.email.toLowerCase() !== normalizedEmail);
      window.localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify([...accounts, sessionUser]));
      setUser(sessionUser);
      window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(sessionUser));
      return sessionUser;
    },
    loginAdmin: async (email, password) => {
      setError("");
      if (email.trim().toLowerCase() !== DEMO_ADMIN_EMAIL || !password) {
        const message = "\u0628\u064a\u0627\u0646\u0627\u062a \u062f\u062e\u0648\u0644 \u0627\u0644\u0623\u062f\u0645\u0646 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d\u0629. \u0627\u0633\u062a\u062e\u062f\u0645 admin@pixo.local \u0641\u064a \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u062a\u062c\u0631\u064a\u0628\u064a.";
        setError(message); throw new Error(message);
      }
      const sessionAdmin = makeAdmin();
      setAdminUser(sessionAdmin);
      window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionAdmin));
      return sessionAdmin;
    },
    logout: async () => {
      window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
      setUser(null); setError("");
    },
    logoutAdmin: async () => {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      setAdminUser(null); setError("");
    },
  }), [adminUser, error, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
