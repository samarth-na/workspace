"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AuthButtons({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="flex gap-4">
      {signedIn ? (
        <Button
          onClick={async () => {
            await authClient.signOut();
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
