import type { Metadata } from "next";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FiGithub } from "react-icons/fi";
import { signInWithGitHub, signInWithGoogle } from "@/app/auth-actions";
import Button from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Skill Hustle account.",
};

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground">
      <section className="surface-card w-full max-w-md p-8 sm:p-12">
        <Link href="/" className="inline-flex items-center gap-2 font-bold">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs text-accent-foreground"
          >
            SH
          </span>
          Skill Hustle
        </Link>
        <p className="eyebrow mt-10">Welcome back</p>
        <h1 className="display-heading mt-3 text-4xl">Sign in to continue.</h1>
        <p className="mt-3 text-muted">
          Pick up where you left off on Skill Hustle.
        </p>

        <form action={signInWithGoogle} className="mt-8">
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
          >
            <FcGoogle aria-hidden="true" size={20} />
            Continue with Google
          </Button>
        </form>

        <form action={signInWithGitHub} className="mt-3">
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
          >
            <FiGithub aria-hidden="true" size={20} />
            Continue with GitHub
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted">
          New to Skill Hustle?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-accent hover:underline"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
