import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-response";
import { assignAdminRole } from "@/lib/admin-authorization";
import { MessagingInputError } from "@/lib/messaging";

export const runtime = "nodejs";

const requestSchema = z.object({
  enabled: z.boolean(),
});

type RouteContext = {
  params: Promise<{ uid: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  if (request.headers.get("x-skill-hustle-request") !== "1") {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new MessagingInputError("Choose whether to grant admin access.");
    }

    const { uid } = await params;
    const roles = await assignAdminRole(uid, parsed.data.enabled);
    return Response.json({ roles });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
