import "server-only";
import {
  FieldValue,
  Timestamp,
  type DocumentData,
} from "firebase-admin/firestore";
import { z } from "zod";
import { requireAdminUser } from "@/lib/admin-authorization";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  getCurrentMessagingUser,
  MessagingAuthorizationError,
  MessagingInputError,
} from "@/lib/messaging";
import type { JobFormData } from "@/lib/job-schema";
import type { MarketplaceJob } from "@/lib/marketplace-data";

const jobsCollection = "jobs";
const uidSchema = z.string().regex(/^sh_[a-f0-9]{64}$/);

function isValidDeadline(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function isDeadlineOpen(value: unknown) {
  if (typeof value !== "string" || !isValidDeadline(value)) {
    return false;
  }
  return new Date(`${value}T23:59:59.999Z`).getTime() > Date.now();
}

export class JobNotFoundError extends Error {
  constructor() {
    super("This job is no longer available.");
    this.name = "JobNotFoundError";
  }
}

function asTimestamp(value: unknown, fieldName: string) {
  if (!(value instanceof Timestamp)) {
    throw new Error(`Stored job ${fieldName} is invalid.`);
  }
  return value;
}

function toMarketplaceJob(
  id: string,
  value: DocumentData
): MarketplaceJob {
  const record = value as Record<string, unknown>;
  if (
    typeof record.title !== "string" ||
    typeof record.description !== "string" ||
    typeof record.category !== "string" ||
    !Array.isArray(record.skills) ||
    !record.skills.every((skill) => typeof skill === "string") ||
    typeof record.clientId !== "string" ||
    !uidSchema.safeParse(record.clientId).success ||
    typeof record.clientName !== "string" ||
    typeof record.deadline !== "string" ||
    !isValidDeadline(record.deadline) ||
    (record.status !== "open" &&
      record.status !== "closed" &&
      record.status !== "deleted") ||
    typeof record.budget !== "object" ||
    record.budget === null
  ) {
    throw new Error("Stored job record is invalid.");
  }

  const budget = record.budget as Record<string, unknown>;
  if (
    typeof budget.min !== "number" ||
    !Number.isFinite(budget.min) ||
    typeof budget.max !== "number" ||
    !Number.isFinite(budget.max) ||
    !["NGN", "USD", "GBP", "EUR"].includes(String(budget.currency))
  ) {
    throw new Error("Stored job budget is invalid.");
  }

  const createdAt = asTimestamp(record.createdAt, "createdAt");
  const updatedAt = asTimestamp(record.updatedAt, "updatedAt");
  const job: MarketplaceJob = {
    id,
    title: record.title,
    description: record.description,
    category: record.category,
    skills: record.skills,
    clientId: record.clientId,
    clientName: record.clientName,
    budget: {
      min: budget.min,
      max: budget.max,
      currency: budget.currency as MarketplaceJob["budget"]["currency"],
    },
    deadline: record.deadline,
    status: record.status,
    createdAt: createdAt.toDate().toISOString(),
    updatedAt: updatedAt.toDate().toISOString(),
  };

  if (record.status === "deleted") {
    const deletedAt = asTimestamp(record.deletedAt, "deletedAt");
    if (typeof record.deletedBy !== "string" || !uidSchema.safeParse(record.deletedBy).success) {
      throw new Error("Stored job deletion audit fields are invalid.");
    }
    if (
      record.statusBeforeDeletion !== "open" &&
      record.statusBeforeDeletion !== "closed"
    ) {
      throw new Error("Stored job deletion status is invalid.");
    }
    job.deletedAt = deletedAt.toDate().toISOString();
    job.deletedBy = record.deletedBy;
    job.statusBeforeDeletion = record.statusBeforeDeletion;
  }

  if (record.restoredAt !== undefined) {
    job.restoredAt = asTimestamp(record.restoredAt, "restoredAt")
      .toDate()
      .toISOString();
    if (
      typeof record.restoredBy !== "string" ||
      !uidSchema.safeParse(record.restoredBy).success
    ) {
      throw new Error("Stored job restoration audit fields are invalid.");
    }
    job.restoredBy = record.restoredBy;
  }

  return job;
}

async function requireClientUser() {
  const user = await getCurrentMessagingUser();
  if (!user.roles.includes("client")) {
    throw new MessagingAuthorizationError(
      "A client account is required to manage job listings."
    );
  }
  return user;
}

async function requireJobManager() {
  const user = await getCurrentMessagingUser();
  const isAdmin = user.roles.includes("admin");
  if (!isAdmin && !user.roles.includes("client")) {
    throw new MessagingAuthorizationError(
      "A client or administrator account is required to manage jobs."
    );
  }
  return { user, isAdmin };
}

function jobFields(job: JobFormData) {
  return {
    title: job.title,
    description: job.description,
    category: job.category,
    skills: job.skills,
    budget: {
      min: job.budgetMin,
      max: job.budgetMax,
      currency: job.currency,
    },
    deadline: job.deadline,
  };
}

export async function createJob(job: JobFormData) {
  const user = await requireClientUser();
  const db = getAdminFirestore();
  const reference = db.collection(jobsCollection).doc();

  await reference.create({
    ...jobFields(job),
    clientId: user.uid,
    clientName: user.displayName ?? user.email ?? "Skill Hustle client",
    status: "open",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return reference.id;
}

export async function getOpenJobs(): Promise<MarketplaceJob[]> {
  const today = new Date().toISOString().slice(0, 10);
  const snapshot = await getAdminFirestore()
    .collection(jobsCollection)
    .where("status", "==", "open")
    .where("deadline", ">=", today)
    .orderBy("deadline", "asc")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return snapshot.docs.map((document) =>
    toMarketplaceJob(document.id, document.data())
  );
}

export async function getJobsForClient(
  clientId: string
): Promise<MarketplaceJob[]> {
  if (!uidSchema.safeParse(clientId).success) {
    throw new MessagingInputError("Client identity is invalid.");
  }

  const snapshot = await getAdminFirestore()
    .collection(jobsCollection)
    .where("clientId", "==", clientId)
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();

  return snapshot.docs.map((document) =>
    toMarketplaceJob(document.id, document.data())
  );
}

export async function getDeletedJobsForAdmin(): Promise<MarketplaceJob[]> {
  await requireAdminUser();
  const snapshot = await getAdminFirestore()
    .collection(jobsCollection)
    .where("status", "==", "deleted")
    .orderBy("deletedAt", "desc")
    .limit(100)
    .get();

  return snapshot.docs.map((document) =>
    toMarketplaceJob(document.id, document.data())
  );
}

export async function updateOwnedJob(
  jobId: string,
  job: JobFormData
) {
  const user = await requireClientUser();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(jobId)) {
    throw new MessagingInputError("Job ID is invalid.");
  }

  const db = getAdminFirestore();
  const reference = db.collection(jobsCollection).doc(jobId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new JobNotFoundError();
    }
    const data = snapshot.data();
    if (data?.clientId !== user.uid || data.status === "deleted") {
      throw new MessagingAuthorizationError(
        "You can only edit your own active job listings."
      );
    }
    transaction.update(reference, {
      ...jobFields(job),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function setOwnedJobStatus(
  jobId: string,
  status: "open" | "closed"
) {
  const user = await requireClientUser();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(jobId)) {
    throw new MessagingInputError("Job ID is invalid.");
  }

  const db = getAdminFirestore();
  const reference = db.collection(jobsCollection).doc(jobId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new JobNotFoundError();
    }
    const data = snapshot.data();
    if (data?.clientId !== user.uid || data.status === "deleted") {
      throw new MessagingAuthorizationError(
        "You can only change the status of your own active job listings."
      );
    }
    if (status === "open" && !isDeadlineOpen(data.deadline)) {
      throw new MessagingInputError(
        "A job with a past deadline cannot be reopened."
      );
    }
    transaction.update(reference, {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function softDeleteJob(jobId: string) {
  const { user, isAdmin } = await requireJobManager();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(jobId)) {
    throw new MessagingInputError("Job ID is invalid.");
  }

  const db = getAdminFirestore();
  const reference = db.collection(jobsCollection).doc(jobId);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new JobNotFoundError();
    }
    const data = snapshot.data();
    if (!isAdmin && data?.clientId !== user.uid) {
      throw new MessagingAuthorizationError(
        "You can only delete your own job listings."
      );
    }
    if (data?.status === "deleted") {
      return;
    }
    transaction.update(reference, {
      status: "deleted",
      statusBeforeDeletion:
        data?.status === "closed" ? "closed" : "open",
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function restoreDeletedJob(jobId: string) {
  const admin = await requireAdminUser();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(jobId)) {
    throw new MessagingInputError("Job ID is invalid.");
  }

  const db = getAdminFirestore();
  const reference = db.collection(jobsCollection).doc(jobId);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      throw new JobNotFoundError();
    }
    const data = snapshot.data();
    if (data?.status !== "deleted") {
      throw new MessagingInputError("Only deleted jobs can be restored.");
    }
    const originalStatus = data.statusBeforeDeletion === "closed" ? "closed" : "open";
    const status =
      originalStatus === "open" && !isDeadlineOpen(data.deadline)
        ? "closed"
        : originalStatus;
    transaction.update(reference, {
      status,
      restoredAt: FieldValue.serverTimestamp(),
      restoredBy: admin.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return status;
  });
}
