import { apiErrorResponse } from "@/lib/api-response";
import {
  JobNotFoundError,
  restoreDeletedJob,
  setOwnedJobStatus,
  softDeleteJob,
  updateOwnedJob,
} from "@/lib/jobs";
import { jobFormSchema, jobUpdateSchema } from "@/lib/job-schema";
import { MessagingInputError } from "@/lib/messaging";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ jobId: string }>;
};

function routeError(error: unknown) {
  if (error instanceof JobNotFoundError) {
    return Response.json({ error: error.message }, { status: 404 });
  }
  return apiErrorResponse(error);
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (request.headers.get("x-skill-hustle-request") !== "1") {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const [{ jobId }, rawBody] = await Promise.all([
      params,
      request.json().catch(() => null),
    ]);
    const parsedBody = jobUpdateSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return Response.json(
        {
          error:
            parsedBody.error.issues[0]?.message ??
            "Choose a valid job action.",
        },
        { status: 400 }
      );
    }
    const body = parsedBody.data;

    if (body.action === "restore") {
      const status = await restoreDeletedJob(jobId);
      return Response.json({
        message:
          status === "open"
            ? "The job listing has been restored."
            : "The job was restored as closed because it was closed before deletion or its deadline has passed.",
      });
    }
    if (body.action === "status") {
      await setOwnedJobStatus(jobId, body.status);
      return Response.json({ message: "The job status has been updated." });
    }

    await updateOwnedJob(jobId, body.job);
    return Response.json({ message: "Your job listing has been updated." });
  } catch (error) {
    return routeError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  if (request.headers.get("x-skill-hustle-request") !== "1") {
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const { jobId } = await params;
    await softDeleteJob(jobId);
    return Response.json({
      message: "The job has been removed from public listings.",
    });
  } catch (error) {
    return routeError(error);
  }
}
