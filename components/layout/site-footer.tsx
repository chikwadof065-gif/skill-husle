import Image from "next/image";
import Link from "next/link";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { href: "/find-freelancers", label: "Find freelancers" },
      { href: "/find-jobs", label: "Browse jobs" },
      {
        href: "/find-freelancers?category=Graphics%20%26%20Design",
        label: "Graphics & Design",
      },
      {
        href: "/find-freelancers?category=Web%20Development",
        label: "Web Development",
      },
      {
        href: "/find-freelancers?category=Digital%20Marketing",
        label: "Digital Marketing",
      },
    ],
  },
  {
    title: "For professionals",
    links: [
      { href: "/sign-up", label: "Create your account" },
      { href: "/dashboard", label: "Professional dashboard" },
      { href: "/find-jobs", label: "Discover opportunities" },
      { href: "/messages", label: "Messages" },
    ],
  },
  {
    title: "For clients",
    links: [
      { href: "/find-freelancers", label: "Discover talent" },
      { href: "/find-jobs", label: "Post a job" },
      { href: "/dashboard", label: "Manage your workspace" },
      { href: "/messages", label: "Talk to professionals" },
    ],
  },
  {
    title: "Your account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Join Skill Hustle" },
      { href: "/profile", label: "Profile" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-[#122824] px-5 text-white sm:px-8">
      <div className="mx-auto max-w-7xl py-14 sm:py-16">
        <div className="grid gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.1fr_2fr] lg:gap-16">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-xl font-bold tracking-tight"
            >
              <span className="relative h-12 w-12 overflow-hidden rounded-xl bg-white">
                <Image
                  src="/logo.png"
                  alt=""
                  fill
                  sizes="48px"
                  className="scale-[1.45] object-cover"
                />
              </span>
              <span>Skill Hustle</span>
            </Link>
            <p className="mt-5 text-sm leading-7 text-white/70">
              A better place to find the people, projects, and possibilities
              that move good work forward.
            </p>
            <Link
              href="/sign-up"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#122824] transition hover:bg-white/90"
            >
              Get started
            </Link>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4"
          >
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-semibold">{group.title}</h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm leading-6 text-white/65 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Skill Hustle. Built for better work.</p>
          <p>Connecting independent talent with ambitious businesses.</p>
        </div>
      </div>
    </footer>
  );
}
