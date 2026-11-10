"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/button";
import { categories, type MarketplaceJob } from "@/lib/marketplace-data";

type JobPostFormProps = {
  job?: MarketplaceJob;
};

type ApiResponse = {
  error?: string;
  message?: string;
};

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

async function readResponse(response: Response): Promise<ApiResponse> {
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

export default function JobPostForm({ job }: JobPostFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submitJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setIsSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());
    const url = job ? `/api/jobs/${encodeURIComponent(job.id)}` : "/api/jobs";
    const method = job ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-skill-hustle-request": "1",
        },
        body: JSON.stringify(job ? { action: "edit", job: body } : body),
        cache: "no-store",
      });
      const result = await readResponse(response);
      if (!response.ok) {
        throw new Error(result.error ?? "The job listing could not be saved.");
      }

      setMessage(result.message ?? "The job listing has been saved.");
      if (!job) {
        formElement.reset();
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The job listing could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={submitJob} className="mt-5 grid gap-4 sm:grid-cols-2">
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 sm:col-span-2"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950 sm:col-span-2"
        >
          {message}
        </p>
      )}

      <div className="sm:col-span-2">
        <label htmlFor={`job-title-${job?.id ?? "new"}`} className="mb-1.5 block text-sm font-semibold">
          Job title
        </label>
        <input
          id={`job-title-${job?.id ?? "new"}`}
          name="title"
          required
          minLength={5}
          maxLength={100}
          defaultValue={job?.title ?? ""}
          placeholder="e.g. Build a mobile-first business website"
          className="field px-4 py-3 text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`job-description-${job?.id ?? "new"}`} className="mb-1.5 block text-sm font-semibold">
          Project description
        </label>
        <textarea
          id={`job-description-${job?.id ?? "new"}`}
          name="description"
          required
          minLength={30}
          maxLength={5000}
          rows={5}
          defaultValue={job?.description ?? ""}
          placeholder="Describe the outcome, scope, and experience you are looking for."
          className="field resize-y px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label htmlFor={`job-category-${job?.id ?? "new"}`} className="mb-1.5 block text-sm font-semibold">
          Category
        </label>
        <select
          id={`job-category-${job?.id ?? "new"}`}
          name="category"
          required
          defaultValue={job?.category ?? ""}
          className="field px-4 py-3 text-sm"
        >
          <option value="" disabled>
            Choose a category
          </option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`job-skills-${job?.id ?? "new"}`} className="mb-1.5 block text-sm font-semibold">
          Required skills
        </label>
        <input
          id={`job-skills-${job?.id ?? "new"}`}
          name="skills"
          required
          defaultValue={job?.skills.join(", ") ?? ""}
          placeholder="React, UI design, accessibility"
          className="field px-4 py-3 text-sm"
        />
      </div>

      <fieldset className="grid gap-3 sm:col-span-2 sm:grid-cols-[1fr_1fr_150px]">
        <legend className="mb-2 text-sm font-semibold">Budget</legend>
        <div>
          <label htmlFor={`job-budget-min-${job?.id ?? "new"}`} className="mb-1.5 block text-xs text-muted">
            Minimum
          </label>
          <input
            id={`job-budget-min-${job?.id ?? "new"}`}
            name="budgetMin"
            type="number"
            min="1"
            max="1000000000"
            step="any"
            required
            defaultValue={job?.budget.min ?? ""}
            className="field px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`job-budget-max-${job?.id ?? "new"}`} className="mb-1.5 block text-xs text-muted">
            Maximum
          </label>
          <input
            id={`job-budget-max-${job?.id ?? "new"}`}
            name="budgetMax"
            type="number"
            min="1"
            max="1000000000"
            step="any"
            required
            defaultValue={job?.budget.max ?? ""}
            className="field px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`job-currency-${job?.id ?? "new"}`} className="mb-1.5 block text-xs text-muted">
            Currency
          </label>
          <select
            id={`job-currency-${job?.id ?? "new"}`}
            name="currency"
            required
            defaultValue={job?.budget.currency ?? "NGN"}
            className="field px-4 py-3 text-sm"
          >
            <option value="NGN">NGN</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <label htmlFor={`job-deadline-${job?.id ?? "new"}`} className="mb-1.5 block text-sm font-semibold">
          Application deadline
        </label>
        <input
          id={`job-deadline-${job?.id ?? "new"}`}
          name="deadline"
          type="date"
          min={getToday()}
          required
          defaultValue={job?.deadline ?? ""}
          className="field px-4 py-3 text-sm sm:max-w-xs"
        />
      </div>

      <Button type="submit" disabled={isSaving} className="sm:col-span-2 sm:w-fit">
        {isSaving
          ? "Saving…"
          : job
            ? "Save job changes"
            : "Publish job"}
      </Button>
    </form>
  );
}
