import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FiArrowUpRight, FiGithub } from "react-icons/fi";
import { signInWithGitHub, signInWithGoogle } from "@/app/auth-actions";
import Button from "@/components/ui/button";

type SignUpProps = {
  status?: string;
};

export default function SignUp({ status }: SignUpProps) {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground sm:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center gap-2 font-bold">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs text-accent-foreground"
          >
            SH
          </span>
          Skill Hustle
        </Link>
        <Link
          href="/sign-in"
          className="text-sm font-semibold text-muted transition hover:text-accent"
        >
          Already a member? Sign in
        </Link>
      </header>

      <div className="mx-auto mt-8 grid max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-surface lg:mt-14 lg:min-h-[590px] lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="flex flex-col justify-between bg-accent p-8 text-accent-foreground sm:p-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-75">
              A considered marketplace
            </p>
            <h1 className="display-heading mt-10 max-w-md text-4xl leading-tight sm:text-5xl">
              Your next chapter starts with good work.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/85 sm:text-base">
              Meet people who value craft, build a reputation around what you
              do well, and find projects worth your time.
            </p>
          </div>
          <div className="mt-12 border-t border-white/25 pt-5">
            <p className="text-sm leading-6 text-white/85">
              Designed for the people behind the work—and the people looking
              for them.
            </p>
          </div>
        </aside>

        <section className="flex items-center px-6 py-10 sm:px-12 sm:py-14">
          <div className="mx-auto w-full max-w-md">
            <p className="eyebrow">Get started</p>
            <h2 className="display-heading mt-3 text-4xl">
              Create your account.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Use one of the connected identity providers to join Skill Hustle.
            </p>

            {status === "unavailable" && (
              <p
                role="status"
                className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
              >
                Email account creation is not connected. Your details were not
                saved; sign in with Google or GitHub instead.
              </p>
            )}
            {status === "invalid" && (
              <p
                role="alert"
                className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-900"
              >
                The submitted account details were not accepted. Use Google or
                GitHub sign-in to continue.
              </p>
            )}

            <form action={signInWithGoogle} className="mt-8">
              <Button type="submit" variant="secondary" className="w-full">
                <FcGoogle aria-hidden="true" size={20} />
                Continue with Google
              </Button>
            </form>

            <form action={signInWithGitHub} className="mt-3">
              <Button type="submit" variant="secondary" className="w-full">
                <FiGithub aria-hidden="true" size={20} />
                Continue with GitHub
              </Button>
            </form>

            <p className="mt-6 text-xs leading-5 text-muted">
              Email and password sign-up is not available yet. Choosing a
              provider will continue through its secure sign-in flow.
            </p>

            <Link
              href="/find-freelancers"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              Explore the marketplace first <FiArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
