import { apiErrorResponse } from "@/lib/api-response";
import {
  createOrGetConversation,
  getCurrentMessagingUser,
  isSameOriginAppRequest,
  parseRecipient,
  readRequestBody,
} from "@/lib/messaging";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginAppRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const body = parseRecipient(await readRequestBody(request));
    const user = await getCurrentMessagingUser();
    const conversationId = await createOrGetConversation(
      user.uid,
      body.recipientUid
    );
    return Response.json({ conversationId });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
