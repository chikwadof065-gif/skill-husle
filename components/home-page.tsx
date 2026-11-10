import Link from "next/link";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiCode,
  FiCpu,
  FiEdit3,
  FiPenTool,
  FiTrendingUp,
  FiVideo,
} from "react-icons/fi";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import FreelancerCard from "@/components/freelancers/freelancer-card";
import {
  categories,
  exampleJobs,
  featuredFreelancers,
} from "@/lib/marketplace-data";

const categoryIcons = [FiPenTool, FiCode, FiVideo, FiEdit3, FiTrendingUp, FiCpu];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:py-28">
            <div className="max-w-2xl">
              <p className="eyebrow">A better way to work independently</p>
              <h1 className="display-heading mt-5 text-5xl leading-[1.03] sm:text-6xl lg:text-7xl">
                Independent work, done better, work an earn with Skill Hustle.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                Find independent talent for your next big idea, or find work
                that gives your skills room to grow.
              </p>

              <form
                action="/find-freelancers"
                className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl border border-border bg-surface p-2 shadow-sm sm:flex-row"
              >
                <label className="sr-only" htmlFor="homepage-search">
                  Search freelancers and skills
                </label>
                <input
                  id="homepage-search"
                  name="search"
                  type="search"
                  placeholder="Try “product design” or “React”"
                  className="field min-w-0 flex-1 border-0 bg-transparent px-4 py-3 outline-none focus-visible:outline-none"
                />
                <button type="submit" className="button button-primary px-5">
                  Find talent <FiArrowRight aria-hidden="true" />
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/find-jobs"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition hover:text-accent"
                >
                  Explore opportunities <FiArrowUpRight aria-hidden="true" />
                </Link>
                <span className="text-sm text-muted">
                  Built for clients and independent professionals
                </span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div className="absolute -left-5 -top-5 h-24 w-24 rounded-full border border-accent/30 sm:-left-8 sm:-top-8 sm:h-32 sm:w-32" />
              <div className="relative overflow-hidden rounded-[2rem] bg-[#102c34] px-6 py-7 text-white sm:px-9 sm:py-10">
                <div className="relative z-10 flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
                      The independent advantage
                    </p>
                    <h2 className="display-heading mt-5 max-w-sm text-4xl leading-tight sm:text-5xl">
                      A good fit changes everything.
                    </h2>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-1 h-3 w-3 shrink-0 rounded-full bg-[#d4b768]"
                  />
                </div>
                <div className="relative z-10 mt-10 border-t border-white/25 pt-5">
                  <p className="max-w-sm text-sm leading-6 text-white/85">
                    Clear profiles. Thoughtful projects. Better conversations
                    between the people doing the work.
                  </p>
                  <Link
                    href="/sign-up"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white"
                  >
                    Find your place here <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full border border-white/20 sm:-bottom-20 sm:-right-16 sm:h-64 sm:w-64"
                />
              </div>
              <p className="mt-3 text-right text-xs text-muted">
                A marketplace built around the quality of the work.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow">Explore by discipline</p>
              <h2 className="display-heading mt-3 text-3xl sm:text-4xl">
                Where do you want to start?
              </h2>
            </div>
            <Link
              href="/find-freelancers"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accent-strong"
            >
              Browse all talent <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category, index) => {
              const Icon = categoryIcons[index];
              return (
                <Link
                  key={category}
                  href={`/find-freelancers?category=${encodeURIComponent(category)}`}
                  className="surface-card group p-4 transition hover:-translate-y-0.5 hover:border-accent/50 sm:p-5"
                >
                  <Icon
                    aria-hidden="true"
                    className="text-xl text-accent transition group-hover:translate-x-0.5"
                  />
                  <h3 className="mt-5 text-sm font-semibold leading-5">
                    {category}
                  </h3>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow">Meet the talent</p>
                <h2 className="display-heading mt-3 text-3xl sm:text-4xl">
                  A few places to begin.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                  These sample profiles show how work and skills are presented.
                  Published member listings appear in the directory.
                </p>
              </div>
              <Link
                href="/find-freelancers"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-accent-strong"
              >
                See all talent <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredFreelancers.map((freelancer) => (
                <FreelancerCard key={freelancer.id} freelancer={freelancer} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="eyebrow">For independent professionals</p>
            <h2 className="display-heading mt-3 text-3xl sm:text-4xl">
              Make your next project count.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
              Explore sample opportunities and see how the Skill Hustle job
              board is taking shape. Live postings and applications are not
              connected yet.
            </p>
            <Link
              href="/find-jobs"
              className="button button-secondary mt-6"
            >
              Browse the job board <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {exampleJobs.slice(0, 2).map((job, index) => (
              <article
                key={job.id}
                className={`surface-card p-5 ${index === 1 ? "sm:mt-8" : ""}`}
              >
                <p className="eyebrow">Example opportunity</p>
                <h3 className="mt-5 text-lg font-semibold">{job.title}</h3>
                <p className="mt-2 text-sm text-muted">{job.category}</p>
                <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">
                  {job.skills.join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-accent-soft">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 sm:py-16 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">A more thoughtful marketplace</p>
              <h2 className="display-heading mt-3 text-3xl sm:text-4xl">
                Bring your next idea to life.
              </h2>
            </div>
            <Link href="/sign-up" className="button button-primary w-fit">
              Create an account <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
