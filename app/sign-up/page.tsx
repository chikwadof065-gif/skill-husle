import type { Metadata } from "next";
import SignUp from "@/components/sign-up";

export const metadata: Metadata = {
  title: "Create an account | SkillHustle",
  description: "Join SkillHustle and turn your skills into opportunities.",
};

type SignUpPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { status } = await searchParams;

  return <SignUp status={status} />;
}
