import { createHmac } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import {
  freelancerListingSchema,
  type FreelancerListingData,
} from "@/lib/freelancer-schema";
import type { Freelancer } from "@/lib/marketplace-data";

const listingsCollection = "freelancerListings";

function ownerDocumentId(email: string) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("Set AUTH_SECRET or NEXTAUTH_SECRET to identify freelancer listings.");
  }

  return createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function toFreelancer(id: string, value: unknown): Freelancer {
  const listing = freelancerListingSchema.parse(value);
  const initials = listing.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return {
    ...listing,
    id,
    initials,
    rating: "New",
    isSample: false,
  };
}

export async function saveFreelancerListing(
  email: string,
  listing: FreelancerListingData,
  ownerUid?: string
) {
  const db = getAdminFirestore();
  const ref = db.collection(listingsCollection).doc(ownerDocumentId(email));
  const existing = await ref.get();

  await ref.set(
    {
      ...listing,
      ...(ownerUid ? { ownerUid } : {}),
      createdAt: existing.exists
        ? existing.data()?.createdAt ?? FieldValue.serverTimestamp()
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getFreelancerListingForOwner(
  email: string
): Promise<FreelancerListingData | null> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(listingsCollection)
    .doc(ownerDocumentId(email))
    .get();

  if (!snapshot.exists) {
    return null;
  }

  return freelancerListingSchema.parse(snapshot.data());
}

export async function getPublishedFreelancerListings(): Promise<Freelancer[]> {
  const db = getAdminFirestore();
  const snapshot = await db
    .collection(listingsCollection)
    .orderBy("updatedAt", "desc")
    .get();

  return snapshot.docs.map((document) => toFreelancer(document.id, document.data()));
}

export async function getPublishedFreelancerListing(
  id: string
): Promise<Freelancer | null> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(listingsCollection).doc(id).get();

  if (!snapshot.exists) {
    return null;
  }

  return toFreelancer(snapshot.id, snapshot.data());
}
