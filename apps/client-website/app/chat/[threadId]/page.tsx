'use client';

import * as React from "react";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const resolvedParams = React.use(params);
  return (
    <main className="bg-gray-100 flex-1">
      <ChatWindow threadId={resolvedParams.threadId} />
    </main>
  );
}
