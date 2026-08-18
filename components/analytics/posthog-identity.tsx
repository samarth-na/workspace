"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

export function PostHogIdentity({
  userId,
  name,
  email,
}: {
  userId: string;
  name: string;
  email: string;
}) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;

    posthog.identify(userId, { name, email });
  }, [email, name, userId]);

  return null;
}
