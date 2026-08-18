"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader } from "pixelarticons/react";
import posthog from "posthog-js";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const DEMO_ACCOUNTS = [
  { email: "samarth@cloudworkspace.co", label: "Samarth (owner)" },
  { email: "maya@cloudworkspace.co", label: "Maya Chen" },
  { email: "jordan@cloudworkspace.co", label: "Jordan Lee" },
  { email: "priya@cloudworkspace.co", label: "Priya Shah" },
  { email: "alex@cloudworkspace.co", label: "Alex Morgan" },
];

const DEMO_PASSWORD = "password123";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignIn = mode === "sign-in";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const result = isSignIn
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ name, email, password });
    setLoading(false);
    if (result.error) {
      if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
        posthog.capture("auth_failed", {
          method: "email",
          mode,
        });
      }
      setError(result.error.message ?? "Something went wrong. Try again.");
      return;
    }
    if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
      posthog.capture(isSignIn ? "signed_in" : "signed_up", {
        method: "email",
      });
    }
    router.push("/home");
    router.refresh();
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="flex size-11 items-center justify-center rounded-xl bg-[#9cb8f7] text-[15px] font-bold text-[#31518e]">
          C
        </span>
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#232b42]">
          {isSignIn ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-[13px] text-[#8991a3]">
          {isSignIn
            ? "Sign in to Cloud Workspace to continue."
            : "Start working with your team in Cloud Workspace."}
        </p>
      </div>

      <div className="rounded-xl border border-[#e3e5ea] bg-white p-6 shadow-[0_1px_2px_rgba(35,43,66,0.04)]">
        <form onSubmit={submit} className="space-y-4">
          {!isSignIn ? (
            <div className="space-y-1.5">
              <label
                htmlFor="auth-name"
                className="text-[12px] font-medium text-[#596275]"
              >
                Name
              </label>
              <Input
                id="auth-name"
                name="name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <label
              htmlFor="auth-email"
              className="text-[12px] font-medium text-[#596275]"
            >
              Email
            </label>
            <Input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@cloudworkspace.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="auth-password"
              className="text-[12px] font-medium text-[#596275]"
            >
              Password
            </label>
            <Input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              placeholder="••••••••"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-[#fdf0f0] px-3 py-2 text-[12px] text-[#b42318]"
            >
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <Loader className="size-4 animate-spin" />
            ) : isSignIn ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#e9ebef]" />
          <span className="text-[11px] text-[#a0a7b5]">or</span>
          <span className="h-px flex-1 bg-[#e9ebef]" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
                posthog.capture("auth_started", {
                  method: "google",
                  mode,
                });
              }
              void authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
              });
            }}
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.87c2.27-2.1 3.57-5.17 3.57-8.81Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.28A7.2 7.2 0 0 1 4.86 12c0-.79.15-1.56.41-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l3.99-3.1Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.76c1.76 0 3.34.6 4.58 1.8l3.44-3.44A12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
              />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
                posthog.capture("auth_started", {
                  method: "github",
                  mode,
                });
              }
              void authClient.signIn.social({
                provider: "github",
                callbackURL: "/",
              });
            }}
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                fill="currentColor"
                d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.26 5.68.41.35.77 1.05.77 2.12v3.15c0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
              />
            </svg>
            GitHub
          </Button>
        </div>

        <p className="mt-5 text-center text-[12px] text-[#8991a3]">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="font-medium text-[#31518e] hover:underline"
          >
            {isSignIn ? "Create one" : "Sign in"}
          </Link>
        </p>
      </div>

      {isSignIn ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#d5d9e2] bg-[#fafbfc] p-4">
          <p className="text-[12px] font-medium text-[#414a5d]">
            Demo accounts
          </p>
          <p className="mt-0.5 text-[11px] text-[#8991a3]">
            All use the password{" "}
            <code className="rounded bg-[#eef0f4] px-1 py-0.5 font-mono text-[10px] text-[#596275]">
              password123
            </code>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {DEMO_ACCOUNTS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => fillDemo(demo.email)}
                className="rounded-md border border-[#e3e5ea] bg-white px-2 py-1 text-[11px] text-[#596275] transition-colors hover:border-[#9cb8f7] hover:text-[#31518e]"
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
