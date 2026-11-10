import type { Metadata } from "next";
import { auth } from "@/auth";
import JobBoard from "@/components/jobs/job-board";
import {
  getDeletedJobsForAdmin,
  getJobsForClient,
  getOpenJobs,
} from "@/lib/jobs";
import {
  FirebaseIdentityConfigurationError,
  FirebaseIdentityIntegrityError,
} from "@/lib/firebase-identity";
import {
  MessagingAuthenticationError,
  getCurrentMessagingUser,
} from "@/lib/messaging";
import type { MarketplaceJob } from "@/lib/marketplace-data";

export const metadata: Metadata = {
  title: "Find Jobs",
  description: "Discover live freelance job opportunities on Skill Hustle.",
};

export const dynamic = "force-dynamic";

export default async function FindJobsPage() {
  let jobs: MarketplaceJob[] = [];
  let ownJobs: MarketplaceJob[] = [];
  let adminDeletedJobs: MarketplaceJob[] = [];
  let jobsError: string | null = null;
  let accessError: string | null = null;
  let currentUid: string | null = null;
  let canPost = false;
  let isAdmin = false;
  const session = await auth();

  try {
    jobs = await getOpenJobs();
  } catch (error) {
    console.error("Failed to load open jobs from Firestore.", error);
    jobsError =
      "Live job listings could not be loaded. Check Firebase configuration and try again.";
  }

  if (session?.user) {
    try {
      const user = await getCurrentMessagingUser();
      currentUid = user.uid;
      canPost = user.roles.includes("client");
      isAdmin = user.roles.includes("admin");

      if (user.roles.includes("client")) {
        ownJobs = await getJobsForClient(user.uid);
      }
      if (isAdmin) {
        adminDeletedJobs = await getDeletedJobsForAdmin();
      }
    } catch (error) {
      console.error("Failed to resolve job-board account access.", error);
      accessError =
        error instanceof MessagingAuthenticationError
          ? "Sign out and sign in again to activate job management."
          : error instanceof FirebaseIdentityConfigurationError
            ? "Firebase identity is not configured for job management."
            : error instanceof FirebaseIdentityIntegrityError
              ? "Your account identity could not be verified."
              : "Your account access could not be checked. Try again later.";
    }
  }

  return (
    <JobBoard
      jobs={jobs}
      ownJobs={ownJobs}
      adminDeletedJobs={adminDeletedJobs}
      currentUid={currentUid}
      isSignedIn={Boolean(session?.user)}
      canPost={canPost}
      isAdmin={isAdmin}
      accessError={accessError}
      jobsError={jobsError}
    />
  );
}
