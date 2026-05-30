import { auth } from "@/auth";
import {
  deleteUserChatConversation,
  getUserChatConversation,
  renameUserChatConversation,
} from "@/models/chat";

type RouteContext = { params: Promise<{ uuid: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uuid } = await params;
  const row = await getUserChatConversation(session.user.uuid, uuid);
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    conversation: {
      uuid: row.uuid,
      title: row.title,
      model_id: row.model_id,
      messages: row.messages,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
  });
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uuid } = await params;

  let body: { title?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return Response.json(
      { error: "title is required." },
      { status: 400 }
    );
  }
  if (title.length > 255) {
    return Response.json(
      { error: "title exceeds 255 chars." },
      { status: 400 }
    );
  }

  const row = await renameUserChatConversation(session.user.uuid, uuid, title);
  if (!row) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    conversation: {
      uuid: row.uuid,
      title: row.title,
      updated_at: row.updated_at,
    },
  });
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uuid } = await params;
  const ok = await deleteUserChatConversation(session.user.uuid, uuid);
  if (!ok) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
