"use server";

import { redirect } from "next/navigation";

export async function createAccount(formData: FormData) {
  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const password = formData.get("password");
  const accountType = formData.get("accountType");

  const isValid =
    typeof fullName === "string" &&
    fullName.trim().length > 0 &&
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    typeof password === "string" &&
    password.length >= 8 &&
    (accountType === "freelancer" || accountType === "client");

  if (!isValid) {
    redirect("/sign-up?status=invalid");
  }

  redirect("/sign-up?status=unavailable");
}
