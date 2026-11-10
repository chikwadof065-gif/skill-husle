import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowUpRight, FiBriefcase, FiStar } from "react-icons/fi";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import { featuredFreelancers, formatNaira } from "@/lib/marketplace-data";
import { getPublishedFreelancerListing } from "@/lib/freelancer-listings";

export const metadata: Metadata = {
  title: "Freelancer Profile | SkillHustle",
  description: "Preview a freelancer profile on SkillHustle.",
};

type ProfilePageProps = {
  searchParams: Promise<{ freelancer?: string }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { freelancer: freelancerId } = await searchParams;
  const sampleProfile = freelancerId
    ? featuredFreelancers.find((profile) => profile.id === freelancerId)
    : featuredFreelancers[0];
  const freelancer =
    sampleProfile ??
    (freelancerId ? await getPublishedFreelancerListing(freelancerId) : null);

  if (!freelancer) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        {freelancer.isSample && (
          <p className="eyebrow mb-5">
            Example profile
          </p>
        )}
        <section className="surface-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div
              aria-label={`Initials avatar for ${freelancer.name}; no profile photo is available`}
              role="img"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl font-semibold text-accent"
            >
              {freelancer.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="display-heading text-3xl sm:text-4xl">
                    {freelancer.name}
                  </h1>
                  <p className="mt-2 text-muted">
                    {freelancer.title}
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm">
                    <FiStar aria-hidden="true" className="text-[#b48c35]" />
                    <span className="font-semibold">{freelancer.rating}</span>
                    <span className="text-muted">
                      {freelancer.isSample ? "sample rating" : "no reviews yet"}
                    </span>
                  </p>
                </div>
                <div className="rounded-xl bg-accent-soft px-4 py-3">
                  <p className="text-xs text-muted">
                    Starting price
                  </p>
                  <p className="mt-1 font-bold">
                    {formatNaira(freelancer.startingPrice)}
                  </p>
                </div>
              </div>
              <p className="mt-5 leading-7 text-muted">
                {freelancer.description}
                {freelancer.isSample
                  ? " This profile uses example information from the marketplace preview."
                  : ""}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {freelancer.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-background px-3 py-1.5 text-xs font-medium text-muted"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {freelancer.ownerUid && (
                  <Link
                    href={`/messages?to=${encodeURIComponent(freelancer.ownerUid)}`}
                    className="button button-primary"
                  >
                    Message
                  </Link>
                )}
                <Link
                  href="/find-freelancers"
                  className="button button-quiet"
                >
                  Back to freelancers
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section className="surface-card p-6">
            <h2 className="text-lg font-bold">Portfolio</h2>
            <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm leading-6 text-muted">
              Portfolio items are not available in this example profile.
            </div>
          </section>
          <section className="surface-card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <FiBriefcase aria-hidden="true" className="text-accent" />
              Work experience
            </h2>
            <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm leading-6 text-muted">
              Work history is not included in the available sample data.
            </div>
          </section>
          <section className="surface-card p-6 md:col-span-2">
            <h2 className="text-lg font-bold">Reviews</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-background p-4">
              <FiStar aria-hidden="true" className="text-[#b48c35]" />
              <span className="font-semibold">{freelancer.rating}</span>
              <span className="text-sm text-muted">
                {freelancer.isSample
                  ? "Sample rating only; verified reviews are not connected."
                  : "No reviews yet."}
              </span>
            </div>
          </section>
        </div>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          Manage your own portfolio <FiArrowUpRight aria-hidden="true" />
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
