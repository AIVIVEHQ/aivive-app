import { auth } from "@/auth";
import { listUserChatConversations } from "@/models/chat";

export async function GET() {
  const session = await auth();
  if (!session?.user?.uuid) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listUserChatConversations(session.user.uuid);

  return Response.json({
    conversations: rows.map((r) => ({
      uuid: r.uuid,
      title: r.title,
      model_id: r.model_id,
      persona_id: r.persona_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })),
  });
}
