"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FiBriefcase, FiCalendar } from "react-icons/fi";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import JobPostForm from "@/components/jobs/job-post-form";
import Button from "@/components/ui/button";
import {
  categories,
  exampleJobs,
  formatNaira,
  type MarketplaceJob,
} from "@/lib/marketplace-data";

type JobBoardProps = {
  jobs: MarketplaceJob[];
  ownJobs: MarketplaceJob[];
  adminDeletedJobs: MarketplaceJob[];
  currentUid: string | null;
  isSignedIn: boolean;
  canPost: boolean;
  isAdmin: boolean;
  accessError: string | null;
  jobsError: string | null;
};

type ApiResponse = {
  error?: string;
  message?: string;
};

function formatBudget(job: MarketplaceJob) {
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: job.budget.currency,
    maximumFractionDigits: 0,
  });
  return `${formatter.format(job.budget.min)}–${formatter.format(job.budget.max)}`;
}

function formatDeadline(deadline: string) {
  const date = new Date(`${deadline}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

async function readApiResponse(response: Response): Promise<ApiResponse> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      return body as ApiResponse;
    }
  } catch {
    throw new Error("The server returned an invalid response.");
  }
  throw new Error("The server returned an invalid response.");
}

function JobActions({
  job,
  isAdmin,
  canManageStatus,
}: {
  job: MarketplaceJob;
  isAdmin: boolean;
  canManageStatus: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const isDeleted = job.status === "deleted";

  async function performAction(
    method: "PATCH" | "DELETE",
    body?: { action: "status"; status: "open" | "closed" } | { action: "restore" }
  ) {
    setIsPending(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(job.id)}`, {
        method,
        headers: {
          "x-skill-hustle-request": "1",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
      });
      const result = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(result.error ?? "The job action could not be completed.");
      }
      setMessage(result.message ?? "The job has been updated.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The job action could not be completed."
      );
    } finally {
      setIsPending(false);
    }
  }

  function deleteJob() {
    if (
      window.confirm(
        "Hide this job from public listings? The record will remain available for authorized administrative review."
      )
    ) {
      void performAction("DELETE");
    }
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mb-3 text-sm text-muted">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {isDeleted ? (
          isAdmin && (
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() =>
                void performAction("PATCH", { action: "restore" })
              }
            >
              {isPending ? "Restoring…" : "Restore job"}
            </Button>
          )
        ) : (
          <>
            {canManageStatus && (
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={() =>
                  void performAction("PATCH", {
                    action: "status",
                    status: job.status === "open" ? "closed" : "open",
                  })
                }
              >
                {job.status === "open" ? "Close listing" : "Reopen listing"}
              </Button>
            )}
            <Button
              type="button"
              variant="quiet"
              disabled={isPending}
              onClick={deleteJob}
              className="text-red-800"
            >
              Delete listing
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function MarketplaceJobCard({
  job,
  isOwner,
  isAdmin,
}: {
  job: MarketplaceJob;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const statusLabel =
    job.status === "deleted"
      ? "Deleted"
      : job.status === "closed"
        ? "Closed"
        : "Open";

  return (
    <article className="surface-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{job.category}</p>
          <h3 className="mt-2 text-lg font-semibold">{job.title}</h3>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {statusLabel}
        </span>
      </div>
      <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted">
        {job.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <FiBriefcase aria-hidden="true" /> {job.clientName}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FiCalendar aria-hidden="true" /> Due {formatDeadline(job.deadline)}
        </span>
        <span className="font-semibold text-foreground">
          {formatBudget(job)}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {job.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-background px-3 py-1 text-xs text-muted"
          >
            {skill}
          </span>
        ))}
      </div>

      {isOwner && job.status !== "deleted" && (
        <details className="mt-5 border-t border-border pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-accent">
            Edit job details
          </summary>
          <JobPostForm job={job} />
        </details>
      )}

      {(isOwner || isAdmin) && (
        <JobActions
          job={job}
          isAdmin={isAdmin}
          canManageStatus={isOwner}
        />
      )}

      {job.status === "open" && !isOwner && !isAdmin && (
        <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">
          Proposals are not enabled yet. Job details and budgets are live.
        </p>
      )}
      {job.status === "deleted" && isAdmin && (
        <p className="mt-4 text-xs text-muted">
          Retained for administrative review. Deleted by {job.deletedBy}.
        </p>
      )}
    </article>
  );
}

export default function JobBoard({
  jobs,
  ownJobs,
  adminDeletedJobs,
  currentUid,
  isSignedIn,
  canPost,
  isAdmin,
  accessError,
  jobsError,
}: JobBoardProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [currency, setCurrency] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();

  const filteredJobs = useMemo(() => {
    const budgetLimit = maxBudget ? Number(maxBudget) : null;
    return jobs.filter((job) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          job.title,
          job.description,
          job.clientName,
          ...job.skills,
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedSearch);
      const matchesCategory = !category || job.category === category;
      const matchesCurrency = !currency || job.budget.currency === currency;
      const matchesBudget =
        budgetLimit === null ||
        (Boolean(currency) && matchesCurrency && job.budget.max <= budgetLimit);
      return (
        matchesSearch &&
        matchesCategory &&
        matchesCurrency &&
        matchesBudget
      );
    });
  }, [category, currency, jobs, maxBudget, normalizedSearch]);

  const publicJobs = filteredJobs.filter(
    (job) => job.clientId !== currentUid
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <p className="eyebrow">Opportunities</p>
            <h1 className="display-heading mt-3 text-4xl sm:text-5xl">
              Find freelance jobs
            </h1>
            <p className="mt-4 leading-7 text-muted">
              Search live client postings by skill, category, budget, or
              deadline.
            </p>
          </div>
          {isSignedIn && !accessError && canPost && (
            <details className="surface-card w-full p-4 sm:max-w-2xl sm:p-6">
              <summary className="cursor-pointer text-sm font-semibold text-accent">
                Post a job
              </summary>
              <JobPostForm />
            </details>
          )}
          {isSignedIn && !currentUid && (
            <p role="status" className="text-sm text-muted">
              Sign out and sign in again to activate job management.
            </p>
          )}
          {!isSignedIn && (
            <Link href="/sign-in" className="button button-primary">
              Sign in to post a job
            </Link>
          )}
          {currentUid && !isAdmin && (
            <Link href="/dashboard" className="button button-secondary">
              Account roles
            </Link>
          )}
        </div>

        {accessError && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
          >
            {accessError}
          </p>
        )}
        {jobsError && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
          >
            {jobsError}
          </p>
        )}

        <section
          aria-label="Job search and filters"
          className="surface-card mt-8 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5"
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="job-search" className="text-sm font-semibold">
              Search jobs
            </label>
            <input
              id="job-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, description, or skill"
              className="field mt-2 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label htmlFor="job-category" className="text-sm font-semibold">
              Category
            </label>
            <select
              id="job-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="field mt-2 px-4 py-3 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="job-currency-filter" className="text-sm font-semibold">
              Currency
            </label>
            <select
              id="job-currency-filter"
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="field mt-2 px-4 py-3 text-sm"
            >
              <option value="">Any currency</option>
              <option value="NGN">NGN</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div>
            <label htmlFor="job-budget-filter" className="text-sm font-semibold">
              Maximum budget
            </label>
            <input
              id="job-budget-filter"
              type="number"
              min="1"
              value={maxBudget}
              onChange={(event) => setMaxBudget(event.target.value)}
              placeholder="No maximum"
              className="field mt-2 px-4 py-3 text-sm"
            />
            {maxBudget && !currency && (
              <p className="mt-1 text-xs text-muted">
                Choose a currency to filter by budget.
              </p>
            )}
          </div>
        </section>

        {ownJobs.length > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <p className="eyebrow">Client workspace</p>
              <h2 className="display-heading mt-2 text-3xl">Your job listings</h2>
            </div>
            <div className="space-y-4">
              {ownJobs.map((job) => (
                <MarketplaceJobCard
                  key={job.id}
                  job={job}
                  isOwner
                  isAdmin={false}
                />
              ))}
            </div>
          </section>
        )}

        {isAdmin && adminDeletedJobs.length > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <p className="eyebrow">Restricted administration</p>
              <h2 className="display-heading mt-2 text-3xl">
                Deleted jobs for review
              </h2>
            </div>
            <div className="space-y-4">
              {adminDeletedJobs
                .filter((job) => job.clientId !== currentUid)
                .map((job) => (
                <MarketplaceJobCard
                  key={job.id}
                  job={job}
                  isOwner={false}
                  isAdmin
                />
                ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Live postings</p>
              <h2 className="display-heading mt-2 text-3xl">
                {publicJobs.length}{" "}
                {publicJobs.length === 1 ? "opportunity" : "opportunities"}
              </h2>
            </div>
          </div>
          {publicJobs.length > 0 ? (
            <div className="mt-4 space-y-4">
              {publicJobs.map((job) => (
                <MarketplaceJobCard
                  key={job.id}
                  job={job}
                  isOwner={false}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          ) : (
            <p className="surface-card mt-4 border-dashed p-8 text-center text-sm text-muted">
              {jobsError
                ? "Live jobs are unavailable right now."
                : "No live jobs match these filters. Try another search or check back soon."}
            </p>
          )}
        </section>

        {exampleJobs.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <p className="eyebrow">Examples</p>
            <h2 className="display-heading mt-2 text-3xl">
              Example listings
            </h2>
            <p className="mt-2 text-sm text-muted">
              These demonstrations are not live postings and do not accept
              proposals.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exampleJobs.map((job) => (
                <article key={job.id} className="surface-card p-5">
                  <p className="eyebrow">{job.category}</p>
                  <h3 className="mt-3 font-semibold">{job.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {job.description}
                  </p>
                  <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                    {job.skills.join(" · ")}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
