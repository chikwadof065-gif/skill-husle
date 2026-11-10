"use client";

import { useMemo, useState } from "react";
import SiteFooter from "@/components/layout/site-footer";
import SiteHeader from "@/components/layout/site-header";
import FreelancerCard from "@/components/freelancers/freelancer-card";
import {
  categories,
  featuredFreelancers,
  type Freelancer,
} from "@/lib/marketplace-data";

type FreelancerDirectoryProps = {
  initialSearch: string;
  initialCategory: string;
  listings: Freelancer[];
  listingsError: string | null;
};

const priceOptions = [
  { value: "all", label: "Any starting price" },
  { value: "15000", label: "Up to ₦15,000" },
  { value: "20000", label: "Up to ₦20,000" },
  { value: "25000", label: "Up to ₦25,000" },
];

export default function FreelancerDirectory({
  initialSearch,
  initialCategory,
  listings,
  listingsError,
}: FreelancerDirectoryProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(
    categories.includes(initialCategory) ? initialCategory : ""
  );
  const [maxPrice, setMaxPrice] = useState("all");

  const filteredFreelancers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...listings, ...featuredFreelancers].filter((freelancer) => {
      const matchesSearch =
        !query ||
        [
          freelancer.name,
          freelancer.title,
          freelancer.description,
          ...freelancer.skills,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesCategory = !category || freelancer.category === category;
      const matchesPrice =
        maxPrice === "all" || freelancer.startingPrice <= Number(maxPrice);
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [category, listings, maxPrice, search]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-3xl">
          <p className="eyebrow">Find talent</p>
          <h1 className="display-heading mt-3 text-4xl sm:text-5xl">
            Find the right freelancer
          </h1>
          <p className="mt-4 leading-7 text-muted">
            Search freelancer profiles by name, skill, or service. Published
            listings appear alongside example profiles.
          </p>
        </div>

        {listingsError && (
          <p role="alert" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            {listingsError}
          </p>
        )}

        <section
          aria-label="Freelancer search and filters"
          className="surface-card mt-8 p-4 sm:p-5"
        >
          <label htmlFor="freelancer-search" className="text-sm font-semibold">
            Search freelancers
          </label>
          <input
            id="freelancer-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search a name, skill, or service"
            className="field mt-2 px-4 py-3 text-sm"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="freelancer-category" className="text-sm font-semibold">
                Category
              </label>
              <select
                id="freelancer-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="field mt-2 px-4 py-3 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="freelancer-price" className="text-sm font-semibold">
                Maximum starting price
              </label>
              <select
                id="freelancer-price"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="field mt-2 px-4 py-3 text-sm"
              >
                {priceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="experience-level" className="text-sm font-semibold">
                Experience level
              </label>
              <select
                id="experience-level"
                disabled
                className="field mt-2 cursor-not-allowed bg-background px-4 py-3 text-sm text-muted opacity-70"
              >
                <option>Not available in sample profiles</option>
              </select>
            </div>
          </div>
        </section>

        <div className="mt-7 flex items-center justify-between gap-3">
          <h2 className="font-bold">
            {filteredFreelancers.length}{" "}
            {filteredFreelancers.length === 1 ? "profile" : "profiles"}
          </h2>
          <p className="text-right text-xs text-muted">
            Sample prices are not hourly rates.
          </p>
        </div>
        {filteredFreelancers.length ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredFreelancers.map((freelancer) => (
              <FreelancerCard key={freelancer.id} freelancer={freelancer} />
            ))}
          </div>
        ) : (
          <p className="surface-card mt-4 border-dashed p-8 text-center text-sm text-muted">
            No profiles match those filters. Try a different search or category.
          </p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
