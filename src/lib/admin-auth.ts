/**
 * Admin session for the events panel.
 *
 * Accounts are created manually — there is no public sign-up. When the cloud
 * backend is enabled this module becomes a thin wrapper over email/password
 * auth (signInWithPassword / signOut / getUser) with no changes needed in the
 * admin routes, which only use the hook and helpers below.
 */
import { useEffect, useState } from "react";

const SESSION_KEY = "remsenburg-academy:admin-session";
const CHANGE_EVENT = "remsenburg-academy:admin-session-changed";

/** Accounts provisioned for the board. Managed manually, never self-service. */
const ADMIN_ACCOUNTS: { email: string; password: string }[] = [];

export interface AdminSession {
  email: string;
}

export function getSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

export function signIn(email: string, password: string): { error: string | null } {
  const match = ADMIN_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
  );
  if (!match) {
    return { error: "That email and password don't match an Academy admin account." };
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ email: match.email }));
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return { error: null };
}

export function signOut(): void {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** null = signed out, undefined = still checking (first client render). */
export function useAdminSession(): AdminSession | null | undefined {
  const [session, setSession] = useState<AdminSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(getSession());
    const sync = () => setSession(getSession());
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return session;
}
