'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLeadSessionStore } from "@/store/leadSessionStore";

export default function ChatPage() {
  const router = useRouter();
  const session = useLeadSessionStore((state) => state.session);

  useEffect(() => {
    if (session?.chatThreadId) {
      router.replace(`/chat/${session.chatThreadId}`);
      return;
    }
    router.replace("/");
  }, [router, session?.chatThreadId]);

  return null;
}
