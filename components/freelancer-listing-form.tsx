"use client";

import { useActionState } from "react";
import {
  saveFreelancerListingAction,
  type FreelancerListingActionState,
} from "@/app/dashboard/actions";
import { categories } from "@/lib/marketplace-data";
import {
  DEFAULT_DASHBOARD_COLOR,
  type FreelancerListingData,
} from "@/lib/freelancer-schema";
import Button from "@/components/ui/button";

type FreelancerListingFormProps = {
  initialName: string;
  listing: FreelancerListingData | null;
  loadError?: string | null;
};

const initialState: FreelancerListingActionState = {
  status: "idle",
  message: "",
};

export default function FreelancerListingForm({
  initialName,
  listing,
  loadError,
}: FreelancerListingFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveFreelancerListingAction,
    initialState
  );

  return (
    <section
      id="freelancer-listing"
      className="surface-card p-6 sm:p-8"
    >
      <p className="eyebrow">Public profile</p>
      <h2 className="display-heading mt-2 text-3xl">
        {listing ? "Update your freelancer listing" : "Post as a freelancer"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Share your services with clients. Your listing is saved to Firebase and
        shown in the public freelancer directory.
      </p>

      {loadError && (
        <p role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {loadError}
        </p>
      )}
      {state.message && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-5 rounded-xl p-4 text-sm ${
            state.status === "error"
              ? "border border-red-300 bg-red-50 text-red-900"
              : "border border-emerald-300 bg-emerald-50 text-emerald-950"
          }`}
        >
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="listing-name" className="mb-1.5 block text-sm font-semibold">
            Display name
          </label>
          <input
            id="listing-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            defaultValue={listing?.name ?? initialName}
            className="field px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="listing-title" className="mb-1.5 block text-sm font-semibold">
            Service title
          </label>
          <input
            id="listing-title"
            name="title"
            required
            minLength={2}
            maxLength={80}
            defaultValue={listing?.title ?? ""}
            placeholder="e.g. Frontend web developer"
            className="field px-4 py-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="listing-category" className="mb-1.5 block text-sm font-semibold">
            Category
          </label>
          <select
            id="listing-category"
            name="category"
            required
            defaultValue={listing?.category ?? ""}
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
          <label htmlFor="listing-price" className="mb-1.5 block text-sm font-semibold">
            Starting price (NGN)
          </label>
          <input
            id="listing-price"
            name="startingPrice"
            type="number"
            min={1000}
            max={100_000_000}
            step={1}
            required
            defaultValue={listing?.startingPrice ?? ""}
            className="field px-4 py-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="dashboard-color" className="mb-1.5 block text-sm font-semibold">
            Dashboard color
          </label>
          <div className="flex items-center gap-3">
            <input
              id="dashboard-color"
              name="dashboardColor"
              type="color"
              defaultValue={listing?.dashboardColor ?? DEFAULT_DASHBOARD_COLOR}
              aria-label="Choose dashboard color"
              className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-surface p-1"
            />
            <p className="text-sm text-muted">
              Choose a color for your dashboard welcome banner. Your saved color
              will also appear in the banner preview.
            </p>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="listing-description" className="mb-1.5 block text-sm font-semibold">
            About your service
          </label>
          <textarea
            id="listing-description"
            name="description"
            required
            minLength={20}
            maxLength={1000}
            rows={4}
            defaultValue={listing?.description ?? ""}
            placeholder="Describe what you do and what clients can expect."
            className="field resize-y px-4 py-3 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="listing-skills" className="mb-1.5 block text-sm font-semibold">
            Skills <span className="font-normal text-muted">(comma-separated, up to 10)</span>
          </label>
          <input
            id="listing-skills"
            name="skills"
            required
            defaultValue={listing?.skills.join(", ") ?? ""}
            placeholder="React, UI design, Accessibility"
            className="field px-4 py-3 text-sm"
          />
        </div>
        <Button
          type="submit"
          disabled={isPending || Boolean(loadError)}
          className="sm:col-span-2"
        >
          {isPending ? "Saving…" : listing ? "Save listing" : "Publish listing"}
        </Button>
      </form>
    </section>
  );
}
