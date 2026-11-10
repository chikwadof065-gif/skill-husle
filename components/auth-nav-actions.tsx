"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Button from "@/components/ui/button";

type AuthNavActionsProps = {
  signUpLabel?: string;
};

export default function AuthNavActions({
  signUpLabel = "Sign Up",
}: AuthNavActionsProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span aria-hidden="true" className="block h-10 w-24" />;
  }

  if (session?.user) {
    return (
      <>
        <Link
          href="/dashboard"
          className="button button-quiet"
        >
          Dashboard
        </Link>
        <span className="hidden max-w-40 truncate text-sm font-semibold sm:block">
          {session.user.name ?? session.user.email ?? "Account"}
        </span>
        <Button
          type="button"
          variant="secondary"
          onClick={() => signOut({ redirectTo: "/" })}
        >
          Sign Out
        </Button>
      </>
    );
  }

  return (
    <>
      <Link
        href="/sign-in"
        className="button button-quiet"
      >
        Log In
      </Link>
      <Link
        href="/sign-up"
        className="button button-primary"
      >
        {signUpLabel}
      </Link>
    </>
  );
}
