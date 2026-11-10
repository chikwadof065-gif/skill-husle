import { z } from "zod";
import { categories } from "@/lib/marketplace-data";

const currencySchema = z.enum(["NGN", "USD", "GBP", "EUR"]);

function isValidFutureDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value &&
    parsedDate.getTime() > Date.now()
  );
}

export const jobFormSchema = z
  .object({
    title: z.string().trim().min(5).max(100),
    description: z.string().trim().min(30).max(5000),
    category: z.string().refine((value) => categories.includes(value), {
      error: "Choose a valid job category.",
    }),
    skills: z
      .string()
      .transform((value) =>
        value
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      )
      .pipe(z.array(z.string().min(1).max(40)).min(1).max(20)),
    budgetMin: z.coerce.number().finite().min(1).max(1_000_000_000),
    budgetMax: z.coerce.number().finite().min(1).max(1_000_000_000),
    currency: currencySchema,
    deadline: z.string().refine(isValidFutureDate, {
      error: "Choose a valid future deadline.",
    }),
  })
  .refine((job) => job.budgetMax >= job.budgetMin, {
    path: ["budgetMax"],
    error: "Maximum budget must be at least the minimum budget.",
  });

export const jobUpdateSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("edit"),
    job: jobFormSchema,
  }),
  z.object({
    action: z.literal("status"),
    status: z.enum(["open", "closed"]),
  }),
  z.object({
    action: z.literal("restore"),
  }),
]);

export type JobFormData = z.infer<typeof jobFormSchema>;
