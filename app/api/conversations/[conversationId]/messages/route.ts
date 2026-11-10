import { apiErrorResponse } from "@/lib/api-response";
import {
  getCurrentMessagingUser,
  isSameOriginAppRequest,
  parseMessage,
  readRequestBody,
  sendConversationMessage,
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
    const [{ conversationId }, body] = await Promise.all([
      params,
      readRequestBody(request),
    ]);
    const { body: messageBody } = parseMessage(body);
    const user = await getCurrentMessagingUser();
    await sendConversationMessage(user.uid, conversationId, messageBody);
    return Response.json({ sent: true }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
