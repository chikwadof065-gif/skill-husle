export function apiErrorResponse(error: unknown) {
  if (error instanceof Error && error.name === "MessagingAuthenticationError") {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  if (error instanceof Error && error.name === "MessagingInputError") {
    return Response.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof Error && error.name === "MessagingAuthorizationError") {
    return Response.json({ error: error.message }, { status: 403 });
  }

  if (error instanceof Error && error.name === "FirebaseIdentityConfigurationError") {
    return Response.json(
      { error: "Messaging identity is not configured." },
      { status: 503 }
    );
  }

  if (error instanceof Error && error.name === "FirebaseIdentityIntegrityError") {
    console.error("Firebase identity integrity check failed.", error.message);
    return Response.json(
      { error: "The account identity could not be verified." },
      { status: 500 }
    );
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : "unknown";
  console.error("Marketplace API request failed.", { code });
  return Response.json(
    { error: "The request could not be completed. Try again later." },
    { status: 500 }
  );
}
