"use client";

import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AuthButtons({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex gap-4">
      {signedIn ? (
        <Button
          onClick={async () => {
            await authClient.signOut();
            if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
              posthog.reset();
            }
            window.location.href = "/";
          }}
        >
          Sign out
        </Button>
      ) : (
        <>
          <Button
            onClick={() => {
              void authClient.signIn.social({
                provider: "github",
                callbackURL: "/",
              });
            }}
          >
            Sign in with GitHub
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
              });
            }}
          >
            Sign in with Google
          </Button>
        </>
      )}
    </div>
  );
}
