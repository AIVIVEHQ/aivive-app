import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import { auth } from "@/auth";
import { ark } from "@/aisdk/provider/ark";
import { resolveServerDefaultModel } from "@/aisdk/models/chat-models";
import { getCryptoPrice } from "@/aisdk/tools/crypto";
import { getWeather } from "@/aisdk/tools/weather";
import { upsertUserChatConversation } from "@/models/chat";
import { composeSystemPrompt, getPersona } from "@/lib/personas";

export const maxDuration = 60;

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

  let body: {
    messages?: UIMessage[];
    conversationId?: string;
    personaId?: string;
  };
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
  // Resolve the companion persona; unknown/missing ids fall back to default.
  const persona = getPersona(body.personaId);

  try {
    const result = streamText({
      model: ark(modelId),
      system: composeSystemPrompt(persona),
      messages: await convertToModelMessages(messages),
      tools: { getWeather, getCryptoPrice },
      stopWhen: stepCountIs(3),
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
            personaId: persona.id,
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
