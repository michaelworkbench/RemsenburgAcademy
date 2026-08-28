import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signOut, useAdminSession } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Events Admin — The Remsenburg Academy" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim() || !password) {
            setError("Please enter both your email and your password.");
            return;
          }
          setError(signIn(email, password).error);
        }}
        className="w-full max-w-md border border-border bg-card p-8 shadow-raised"
      >
        <p className="eyebrow">Academy Admin</p>
        <h1 className="mt-3 font-display text-3xl">Sign in</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Admin accounts are set up for board members. There is no public sign-up.
        </p>

        {error ? (
          <p role="alert" className="mt-6 border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="mt-8 w-full text-base">
          Sign in
        </Button>
        <Link to="/" className="mt-6 block text-center text-sm text-primary underline">
          Back to the website
        </Link>
      </form>
    </div>
  );
}

function AdminLayout() {
  const session = useAdminSession();

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (session === null) return <SignInScreen />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-parchment">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <p className="eyebrow">Academy Admin</p>
            <Link to="/admin" className="font-display text-2xl">
              Events
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-primary underline">
              View website
            </Link>
            <span className="hidden text-muted-foreground sm:inline">{session.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 md:px-8">
        {/* Child admin routes render here. */}
        <Outlet />
      </main>
    </div>
  );
}
