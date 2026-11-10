import { apiErrorResponse } from "@/lib/api-response";
import { createJob, getDeletedJobsForAdmin } from "@/lib/jobs";
import { jobFormSchema } from "@/lib/job-schema";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get("view");
  if (view !== "deleted") {
    return Response.json(
      { error: "This endpoint only exposes administrator job review." },
      { status: 404 }
    );
  }

  try {
    const jobs = await getDeletedJobsForAdmin();
    return Response.json(
      { jobs },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (request.headers.get("x-skill-hustle-request") !== "1") {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = jobFormSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? "Check the job details." },
        { status: 400 }
      );
    }

    const jobId = await createJob(parsed.data);
    return Response.json(
      { jobId, message: "Your job listing has been published." },
      { status: 201 }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
