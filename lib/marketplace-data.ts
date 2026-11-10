export type Freelancer = {
  id: string;
  name: string;
  title: string;
  description: string;
  skills: string[];
  category: string;
  startingPrice: number;
  rating: string;
  initials: string;
  isSample?: boolean;
  ownerUid?: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  client: string;
};

export type MarketplaceJob = {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  clientId: string;
  clientName: string;
  budget: {
    min: number;
    max: number;
    currency: "NGN" | "USD" | "GBP" | "EUR";
  };
  deadline: string;
  status: "open" | "closed" | "deleted";
  statusBeforeDeletion?: "open" | "closed";
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
  restoredAt?: string;
  restoredBy?: string;
};

export const categories = [
  "Graphics & Design",
  "Web Development",
  "Video Editing",
  "Writing",
  "Digital Marketing",
  "AI & Automation",
];

export const featuredFreelancers: Freelancer[] = [
  {
    id: "david-anderson",
    name: "David Anderson",
    title: "Web Developer",
    description: "I build modern websites for businesses.",
    skills: ["Web development", "React", "Website design"],
    category: "Web Development",
    startingPrice: 25000,
    rating: "4.9",
    initials: "DA",
    isSample: true,
  },
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    title: "Graphic Designer",
    description: "Creative logos and brand identities.",
    skills: ["Graphic design", "Brand identity", "Logo design"],
    category: "Graphics & Design",
    startingPrice: 15000,
    rating: "4.8",
    initials: "SJ",
    isSample: true,
  },
  {
    id: "michael-james",
    name: "Michael James",
    title: "Video Editor",
    description: "Professional video editing and motion graphics.",
    skills: ["Video editing", "Motion graphics"],
    category: "Video Editing",
    startingPrice: 20000,
    rating: "5.0",
    initials: "MJ",
    isSample: true,
  },
];

export const exampleJobs: Job[] = [
  {
    id: "website-refresh",
    title: "Website refresh",
    description:
      "Example project for updating a small business website and making its pages easier to use on mobile.",
    category: "Web Development",
    skills: ["React", "Responsive design", "Accessibility"],
    client: "Example client",
  },
  {
    id: "short-form-video",
    title: "Short-form video edit",
    description:
      "Example project for editing a small set of social media videos with captions and simple motion graphics.",
    category: "Video Editing",
    skills: ["Video editing", "Captions", "Motion graphics"],
    client: "Example client",
  },
  {
    id: "brand-identity",
    title: "Brand identity concepts",
    description:
      "Example project for creating a visual direction and a set of starter brand assets.",
    category: "Graphics & Design",
    skills: ["Brand identity", "Logo design", "Graphic design"],
    client: "Example client",
  },
];

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}
