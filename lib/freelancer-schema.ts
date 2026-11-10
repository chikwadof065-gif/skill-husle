import { z } from "zod";
import { categories } from "@/lib/marketplace-data";

export const DEFAULT_DASHBOARD_COLOR = "#17635D";

const skillsSchema = z.array(z.string().trim().min(1).max(40)).min(1).max(10);

export const freelancerListingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(20).max(1000),
  skills: skillsSchema,
  category: z.string().refine((value) => categories.includes(value), {
    error: "Choose a valid category.",
  }),
  startingPrice: z.number().int().min(1000).max(100_000_000),
  dashboardColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { error: "Choose a valid dashboard color." })
    .default(DEFAULT_DASHBOARD_COLOR),
  ownerUid: z.string().regex(/^sh_[a-f0-9]{64}$/).optional(),
});

export type FreelancerListingData = z.infer<typeof freelancerListingSchema>;

export const freelancerListingFormSchema = freelancerListingSchema.extend({
  skills: z
    .string()
    .transform((value) => value.split(",").map((skill) => skill.trim()).filter(Boolean))
    .pipe(skillsSchema),
  startingPrice: z.coerce.number().int().min(1000).max(100_000_000),
});
