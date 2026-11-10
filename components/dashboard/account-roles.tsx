"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";

type AccountRole = "client" | "freelancer";

type RolesResponse = {
  roles?: AccountRole[];
  error?: string;
};

async function readRolesResponse(response: Response): Promise<RolesResponse> {
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null) {
    throw new Error("The server returned an invalid response.");
  }
  return body as RolesResponse;
}

export default function AccountRoles() {
  const [roles, setRoles] = useState<AccountRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<AccountRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/account/roles", { cache: "no-store" })
      .then(readRolesResponse)
      .then((response) => {
        if (!response.roles) {
          throw new Error(response.error ?? "Account roles could not be loaded.");
        }
        if (!cancelled) {
          setRoles(response.roles);
          setSelectedRoles(response.roles);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Account roles could not be loaded."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function toggleRole(role: AccountRole) {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    );
  }

  async function saveRoles() {
    if (selectedRoles.length === 0 || isSaving) {
      setMessage("Choose at least one way to use Skill Hustle.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/account/roles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-skill-hustle-request": "1",
        },
        body: JSON.stringify({ roles: selectedRoles }),
        cache: "no-store",
      });
      const result = await readRolesResponse(response);
      if (!response.ok || !result.roles) {
        throw new Error(result.error ?? "Account roles could not be saved.");
      }
      setRoles(result.roles);
      setSelectedRoles(result.roles);
      setMessage("Your marketplace roles have been saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Account roles could not be saved."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const hasChanges =
    selectedRoles.length !== roles.length ||
    selectedRoles.some((role) => !roles.includes(role));

  return (
    <section className="surface-card mt-6 p-6 sm:p-8">
      <p className="eyebrow">Your account</p>
      <h2 className="display-heading mt-2 text-3xl">
        How will you use Skill Hustle?
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Choose one or both. These roles help tailor your marketplace experience.
        Administrator access is managed separately and cannot be selected here.
      </p>

      <fieldset className="mt-5 grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">Marketplace roles</legend>
        {(
          [
            ["client", "Hire independent talent"],
            ["freelancer", "Find independent work"],
          ] as const
        ).map(([role, label]) => (
          <label
            key={role}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition hover:border-accent"
          >
            <input
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={() => toggleRole(role)}
              disabled={isLoading || isSaving}
              className="mt-1 accent-accent"
            />
            <span>
              <span className="block text-sm font-semibold">{label}</span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                {role === "client"
                  ? "Discover people and build a team."
                  : "Showcase your skills and find projects."}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {message && (
        <p
          role={message.includes("saved") ? "status" : "alert"}
          className="mt-4 text-sm text-muted"
        >
          {message}
        </p>
      )}

      <Button
        type="button"
        onClick={saveRoles}
        disabled={isLoading || isSaving || !hasChanges || selectedRoles.length === 0}
        className="mt-5"
      >
        {isSaving ? "Saving…" : "Save account roles"}
      </Button>
    </section>
  );
}
