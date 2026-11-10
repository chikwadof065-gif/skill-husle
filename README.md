This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Freelancer listings

Signed-in users can create or update a freelancer listing from the dashboard.
Listings are validated with Zod and stored in the Firestore
`freelancerListings` collection using the Firebase Admin SDK. The freelancer
directory and profile pages read these listings from Firestore.

Configure these server-only environment variables for Firebase Admin:

- `AUTH_FIREBASE_PROJECT_ID`
- `AUTH_FIREBASE_CLIENT_EMAIL`
- `AUTH_FIREBASE_PRIVATE_KEY` (preserve newline escapes as `\n`)

Create the `(default)` Cloud Firestore database in the Firebase Console before
using freelancer listings. Choose its location when creating it; the location
cannot be changed later. The service account needs Firestore access to read and
write listings. Creating the database requires a project owner/admin or a
service account with permission to create Firestore databases.

Keep the service-account credentials private; do not expose them through
`NEXT_PUBLIC_` variables. Firebase Admin writes bypass Firestore security rules,
so listing writes are performed only by authenticated server actions.

## Messaging and Firebase identity

NextAuth remains the sign-in system. After a successful Google or GitHub sign-in,
the server maps the provider identity to a stable Firebase UID and issues a
Firebase custom token. The Firestore identity mapping is persisted, so existing
accounts retain their UID if `NEXTAUTH_SECRET` or the identity-mapping secret is
rotated. Provider accounts are not automatically linked by email.

The app's existing `.env.local` did not contain these Firebase Web App settings
when the messaging integration was added:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Obtain them in Firebase Console under **Project settings → General → Your apps**.
Create or select a Web App and copy its Firebase configuration into your local
environment and deployment secret manager. The project ID must match
`AUTH_FIREBASE_PROJECT_ID`. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` and
`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` are optional for the current Auth and
Firestore features. These values are Firebase client configuration, not
authorization secrets; Firestore rules enforce access.

Add `AUTH_FIREBASE_IDENTITY_SECRET` as a server-only secret: generate at least 32
random bytes with a trusted password/secret manager or a local cryptographic
random generator, and persist the same value in every deployment. Do not put it
in a `NEXT_PUBLIC_` variable. The identity collection provides continuity if
this secret is deliberately rotated later.

Set up Firebase Authentication in the Firebase Console before enabling
messaging. The server requires the existing Firebase Admin service-account
settings (`AUTH_FIREBASE_PROJECT_ID`, `AUTH_FIREBASE_CLIENT_EMAIL`, and
`AUTH_FIREBASE_PRIVATE_KEY`) to mint Firebase custom tokens and perform trusted
conversation writes.

Firestore conversation and message writes are server-only. Browser clients may
read a conversation and its messages only when the Firebase-authenticated UID
belongs to that conversation. User and identity records cannot be written by
browser clients. Roles `client` and `freelancer` are self-selectable through a
validated server endpoint; `admin` is not. To bootstrap a trusted administrator,
run the following command as an operator with access to the existing Firebase
Admin credentials, using the Firebase UID from the user's account record:

```powershell
node --env-file=.env.local scripts/grant-admin.mjs sh_<64-hex-uid> --confirm-admin
```

Only an existing server-verified administrator can grant or revoke additional
admin roles through the protected server route. Never run the bootstrap command
with an unverified UID.

The Firestore rules and index definitions live in `firestore.rules` and
`firestore.indexes.json`. Run the access-control tests against the local
Firestore Emulator with `npm run test:rules`. The emulator tests use isolated
test data and do not read or modify the production database.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Job listings

Client job posts are stored as new documents in the `jobs` collection through
the server-only Firebase Admin SDK. Each document includes `clientId` (the
authenticated Firebase UID), `clientName`, `title`, `description`, `category`,
`budget` (`min`, `max`, and ISO currency), `skills`, `deadline`, `status`,
`createdAt`, and `updatedAt`. New listings use `status: "open"` and are visible
on the job board. Job-form values are validated on the server; only an active
user with the stored `client` role may create, edit, close, reopen, or remove
their own listing.

Proposal submission is not implemented yet; no live job displays an enabled
application control. When proposals are added, their server-side create
operation must verify the job is still open and its deadline has not passed.

Removing a job is a soft delete. The document remains in Firestore with
`status: "deleted"`, `deletedAt`, and `deletedBy`; it is excluded from public
search and ordinary job routes. Authorized administrators can review deleted
documents through the protected job-review API and restore them.
Restoration retains the deletion audit fields and adds `restoredAt` and
`restoredBy`; it returns to the pre-deletion status, except an expired job is
restored as closed. No existing records are migrated or removed.

The app's current Firestore rules deny browser access to unlisted collections.
Job operations use authenticated, role-checked server endpoints and Firebase
Admin; no Firestore rules were deployed as part of this change. Query indexes
for public job listings, owner listings, and administrative review are defined
in `firestore.indexes.json`. Before production queries using those indexes,
deploy the index definitions separately after reviewing them with your Firebase
operator. To verify a post, publish one while signed in with the `client` role,
open Firebase Console → Firestore Database → `jobs`, and confirm the new
document has your Firebase `clientId`, the entered job details, an open status,
and server-generated creation timestamps. A client cannot submit another
user's `clientId`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
