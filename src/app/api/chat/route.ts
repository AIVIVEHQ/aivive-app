import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

import { auth } from "@/auth";
import { ark } from "@/aisdk/provider/ark";
import { resolveServerDefaultModel } from "@/aisdk/models/chat-models";
import { upsertUserChatConversation } from "@/models/chat";

export const maxDuration = 60;

const SYSTEM_PROMPT = [
  "You are a helpful, concise assistant.",
  "Reply in the same language the user writes in.",
  "Use Markdown when it improves clarity (code blocks for code, lists for enumerations).",
].join(" ");

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userUuid = session.user.uuid;

  if (!process.env.ARK_API_KEY) {
    return Response.json(
      { error: "ARK_API_KEY is missing on the server." },
      { status: 500 }
    );
  }

  let body: { messages?: UIMessage[]; conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "messages must be a non-empty array." },
      { status: 400 }
    );
  }

  const conversationId = body.conversationId;
  if (!conversationId || typeof conversationId !== "string") {
    return Response.json(
      { error: "conversationId is required." },
      { status: 400 }
    );
  }

  const modelId = resolveServerDefaultModel();

  try {
    const result = streamText({
      model: ark(modelId),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      originalMessages: messages,
      onFinish: async ({ messages: finalMessages, isAborted }) => {
        if (isAborted) return;
        try {
          await upsertUserChatConversation({
            uuid: conversationId,
            userUuid,
            messages: finalMessages,
            modelId,
          });
        } catch (err) {
          console.error("chat persist failed:", err);
        }
      },
    });
  } catch (err) {
    console.error("chat stream failed:", err);
    return Response.json(
      { error: "Failed to start chat stream." },
      { status: 500 }
    );
  }
}
