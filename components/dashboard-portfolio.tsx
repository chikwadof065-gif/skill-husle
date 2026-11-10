"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FiArrowUpRight, FiBriefcase, FiPlus, FiTrash2 } from "react-icons/fi";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import Button from "@/components/ui/button";
import AccountRoles from "@/components/dashboard/account-roles";
import FreelancerListingForm from "@/components/freelancer-listing-form";
import {
  DEFAULT_DASHBOARD_COLOR,
  type FreelancerListingData,
} from "@/lib/freelancer-schema";

type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  link: string;
};

type DashboardPortfolioProps = {
  name: string;
  email: string;
  listing: FreelancerListingData | null;
  listingError: string | null;
};

function isPortfolioProject(value: unknown): value is PortfolioProject {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const project = value as Record<string, unknown>;

  return (
    typeof project.id === "string" &&
    typeof project.title === "string" &&
    typeof project.description === "string" &&
    typeof project.link === "string"
  );
}

function isSafeProjectLink(link: string) {
  try {
    const url = new URL(link);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getDashboardTextColor(hexColor: string) {
  const channels = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hexColor.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / (0.017 + 0.05);

  return whiteContrast >= darkContrast ? "#FFFFFF" : "#151326";
}

export default function DashboardPortfolio({
  name,
  email,
  listing,
  listingError,
}: DashboardPortfolioProps) {
  const storageKey = `skill-hustle-portfolio:${email || name}`;
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem(storageKey);

      if (savedProjects) {
        const parsedProjects: unknown = JSON.parse(savedProjects);

        if (Array.isArray(parsedProjects)) {
          setProjects(parsedProjects.filter(isPortfolioProject));
        } else {
          setStorageError("Saved portfolio data could not be read.");
        }
      }
    } catch {
      setStorageError("Portfolio data could not be loaded from this browser.");
    } finally {
      setIsReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      localStorage.setItem(storageKey, JSON.stringify(projects));
    } catch {
      setStorageError("Changes could not be saved in this browser.");
    }
  }, [isReady, projects, storageKey]);

  function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get("title");
    const description = formData.get("description");
    const link = formData.get("link");

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof link !== "string"
    ) {
      setStorageError("The project form is missing a required field.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedLink = link.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setStorageError("Add a project title and description before saving.");
      return;
    }

    if (trimmedLink && !isSafeProjectLink(trimmedLink)) {
      setStorageError("Project links must use http:// or https://.");
      return;
    }

    setProjects((currentProjects) => [
      {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        description: trimmedDescription,
        link: trimmedLink,
      },
      ...currentProjects,
    ]);
    setStorageError("");
    event.currentTarget.reset();
  }

  function removeProject(projectId: string) {
    setProjects((currentProjects) =>
      currentProjects.filter((project) => project.id !== projectId)
    );
    setStorageError("");
  }

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  const dashboardColor = listing?.dashboardColor ?? DEFAULT_DASHBOARD_COLOR;
  const dashboardTextColor = getDashboardTextColor(dashboardColor);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <section
            className="rounded-3xl p-7 sm:p-10"
            style={{ backgroundColor: dashboardColor, color: dashboardTextColor }}
          >
            <div className="flex flex-wrap items-center gap-5">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
              >
                {initials || "SH"}
              </div>
              <div>
                <p className="text-sm font-semibold tracking-[0.16em] opacity-80">
                  YOUR DASHBOARD
                </p>
                <h1 className="mt-1 text-3xl font-extrabold">
                  Welcome, {name}
                </h1>
                {email && (
                  <p className="mt-1 text-sm">{email}</p>
                )}
              </div>
            </div>
            <p className="mt-6 max-w-2xl leading-7">
              Build your portfolio by sharing projects that show what you can
              do. A complete portfolio helps clients understand your skills
              and work.
            </p>
            <div
              className="mt-5 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
              style={{ borderColor: dashboardTextColor }}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border border-white/70"
                style={{ backgroundColor: dashboardColor }}
              />
              <span>Dashboard color: {dashboardColor}</span>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <h2 className="font-semibold text-amber-950">
              Contracts and earnings are not connected yet
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-950">
              Account roles, contracts, proposals, job posts, and earnings are
              not connected. You can publish a freelancer listing below. The
              portfolio here is saved only in this browser.
            </p>
          </section>

          <AccountRoles />

          <div className="mt-8">
            <FreelancerListingForm
              initialName={name}
              listing={listing}
              loadError={listingError}
            />
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="surface-card p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Your work</p>
                <h2 className="display-heading mt-2 text-3xl">Portfolio</h2>
              </div>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
                {projects.length}{" "}
                {projects.length === 1 ? "project" : "projects"}
              </span>
            </div>

            {storageError && (
              <p
                role="alert"
                className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
              >
                {storageError}
              </p>
            )}

            {!isReady ? (
              <p className="mt-8 text-sm text-muted">Loading portfolio…</p>
            ) : projects.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                <FiBriefcase
                  aria-hidden="true"
                  className="mx-auto text-3xl text-muted"
                />
                <h3 className="mt-4 text-lg font-bold">
                  Your portfolio is ready for its first project
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                  Add work you have completed, personal projects, or examples
                  that highlight your skills.
                </p>
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {projects.map((project) => (
                  <li
                    key={project.id}
                    className="rounded-2xl border border-border p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="break-words font-bold">
                          {project.title}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted">
                          {project.description}
                        </p>
                        {project.link && isSafeProjectLink(project.link) && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
                          >
                            View project <FiArrowUpRight aria-hidden="true" />
                          </a>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProject(project.id)}
                        aria-label={`Remove ${project.title}`}
                        className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-700"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="surface-card h-fit p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <FiPlus aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow">Showcase your skills</p>
                <h2 className="display-heading text-2xl">Add a project</h2>
              </div>
            </div>

            <form onSubmit={addProject} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="project-title"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Project title
                </label>
                <input
                  id="project-title"
                  name="title"
                  required
                  maxLength={80}
                  placeholder="e.g. Business landing page"
                  className="field px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  name="description"
                  required
                  maxLength={500}
                  rows={4}
                  placeholder="What did you create and what skills did you use?"
                  className="field resize-y px-4 py-3 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="project-link"
                  className="mb-1.5 block text-sm font-semibold"
                >
                  Project link{" "}
                  <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id="project-link"
                  name="link"
                  type="url"
                  maxLength={2048}
                  placeholder="https://example.com"
                  className="field px-4 py-3 text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
              >
                <FiPlus aria-hidden="true" />
                Add to portfolio
              </Button>
            </form>

            <p className="mt-4 text-xs leading-5 text-muted">
              Projects are currently saved in this browser and are only visible
              to you on this device.
            </p>
          </aside>
        </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
