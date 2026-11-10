import { apiErrorResponse } from "@/lib/api-response";
import {
  getCurrentMessagingUser,
  isSameOriginAppRequest,
  markConversationRead,
} from "@/lib/messaging";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  if (!isSameOriginAppRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const [{ conversationId }, user] = await Promise.all([
      params,
      getCurrentMessagingUser(),
    ]);
    await markConversationRead(user.uid, conversationId);
    return Response.json({ read: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
