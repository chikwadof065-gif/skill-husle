import type { Metadata } from "next";
import MessagesPreview from "@/components/messages/messages-preview";

export const metadata: Metadata = {
  title: "Messages | SkillHustle",
  description: "Preview the SkillHustle messaging workspace.",
};

type MessagesPageProps = {
  searchParams: Promise<{ to?: string }>;
};

export default async function MessagesPage({
  searchParams,
}: MessagesPageProps) {
  const { to } = await searchParams;
  return <MessagesPreview initialRecipientUid={to} />;
}
