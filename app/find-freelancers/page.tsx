import type { Metadata } from "next";
import FreelancerDirectory from "@/components/freelancers/freelancer-directory";
import {
  FIRESTORE_DATABASE_MISSING_MESSAGE,
  isFirestoreDatabaseMissingError,
} from "@/lib/firebase-admin";
import { getPublishedFreelancerListings } from "@/lib/freelancer-listings";
import type { Freelancer } from "@/lib/marketplace-data";

export const metadata: Metadata = {
  title: "Find Freelancers | SkillHustle",
  description: "Explore freelancer profiles and skills on SkillHustle.",
};

type FindFreelancersPageProps = {
  searchParams: Promise<{ search?: string; category?: string }>;
};

export default async function FindFreelancersPage({
  searchParams,
}: FindFreelancersPageProps) {
  const { search = "", category = "" } = await searchParams;
  let listings: Freelancer[] = [];
  let listingsError: string | null = null;

  try {
    listings = await getPublishedFreelancerListings();
  } catch (error) {
    console.error("Failed to load freelancer listings from Firestore.", error);
    listingsError = isFirestoreDatabaseMissingError(error)
      ? FIRESTORE_DATABASE_MISSING_MESSAGE
      : "Live freelancer listings could not be loaded. Check the Firebase server configuration.";
  }

  return (
    <FreelancerDirectory
      initialSearch={search}
      initialCategory={category}
      listings={listings}
      listingsError={listingsError}
    />
  );
}
