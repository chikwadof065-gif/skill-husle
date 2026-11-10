import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-response";
import {
  getCurrentMessagingUser,
  isSameOriginAppRequest,
  readRequestBody,
  updateAccountRoles,
} from "@/lib/messaging";

export const runtime = "nodejs";

const rolesSchema = z.object({
  roles: z.array(z.enum(["client", "freelancer"])).min(1).max(2),
});

export async function GET() {
  try {
    const user = await getCurrentMessagingUser();
    return Response.json(
      { roles: user.roles.filter((role) => role !== "admin") },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!isSameOriginAppRequest(request)) {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const parsed = rolesSchema.safeParse(await readRequestBody(request));
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Choose a valid role." },
        { status: 400 }
      );
    }

    const user = await getCurrentMessagingUser();
    const roles = await updateAccountRoles(user.uid, parsed.data.roles);
    return Response.json({ roles });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
