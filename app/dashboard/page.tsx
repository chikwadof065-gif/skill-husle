import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardPortfolio from "@/components/dashboard-portfolio";
import {
  FIRESTORE_DATABASE_MISSING_MESSAGE,
  isFirestoreDatabaseMissingError,
} from "@/lib/firebase-admin";
import { getFreelancerListingForOwner } from "@/lib/freelancer-listings";
import type { FreelancerListingData } from "@/lib/freelancer-schema";

export const metadata: Metadata = {
  title: "Dashboard | SkillHustle",
  description: "Manage your SkillHustle profile and portfolio.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  let listing: FreelancerListingData | null = null;
  let listingError: string | null = null;
  if (session.user.email) {
    try {
      listing = await getFreelancerListingForOwner(session.user.email);
    } catch (error) {
      console.error("Failed to load freelancer listing from Firestore.", error);
      listingError = isFirestoreDatabaseMissingError(error)
        ? FIRESTORE_DATABASE_MISSING_MESSAGE
        : "Your freelancer listing could not be loaded. Check Firebase configuration and refresh the page.";
    }
  }

  return (
    <DashboardPortfolio
      name={session.user.name ?? "SkillHustle member"}
      email={session.user.email ?? ""}
      listing={listing}
      listingError={listingError}
    />
  );
}
