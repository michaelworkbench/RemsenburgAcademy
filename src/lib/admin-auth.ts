/**
 * Admin session (client side).
 *
 * Sessions live in an HttpOnly cookie set by the server; the client can only
 * ask "who am I?" via getSessionFn. Accounts are created manually — there is
 * no public sign-up.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getSessionFn, signInFn, signOutFn } from "@/lib/api";

export const SESSION_QUERY_KEY = ["admin-session"] as const;

export interface AdminSession {
  email: string;
}

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  try {
    const result = await signInFn({ data: { email, password } });
    return result.ok ? { error: null } : { error: result.error };
  } catch {
    return { error: "Sign-in didn't go through. Please check your connection and try again." };
  }
}

export async function signOut(): Promise<void> {
  await signOutFn({});
}

/** null = signed out, undefined = still checking (first client render). */
export function useAdminSession(): AdminSession | null | undefined {
  const { data, isPending } = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => (await getSessionFn()) ?? null,
    staleTime: 60_000,
    retry: false,
  });
  return isPending ? undefined : (data ?? null);
}

/** Invalidate the cached session after sign-in/out. */
export function useSessionRefresh(): () => void {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
}

/** True when a failed server call was caused by a missing/expired session. */
export function isAuthError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("Not signed in");
}
