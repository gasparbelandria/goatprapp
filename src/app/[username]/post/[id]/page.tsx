"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

// AuraRank post detail URLs (/@username/post/[id]) are no longer valid.
// Redirect to the user's profile instead.
export default function PostRedirectPage({
  params,
}: {
  params: Promise<{ username: string; id: string }>;
}) {
  const { username } = use(params);
  const cleanUsername = username.startsWith("%40") ? username.slice(3) : username.replace(/^@/, "");
  const router = useRouter();

  useEffect(() => {
    router.replace(`/@${cleanUsername}`);
  }, [router, cleanUsername]);

  return null;
}
