import Link from "next/link";
import { FiStar } from "react-icons/fi";
import type { Freelancer } from "@/lib/marketplace-data";
import { formatNaira } from "@/lib/marketplace-data";

type FreelancerCardProps = {
  freelancer: Freelancer;
};

export default function FreelancerCard({
  freelancer,
}: FreelancerCardProps) {
  return (
    <article className="surface-card flex h-full flex-col p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div
          aria-label={`Initials avatar for ${freelancer.name}; no profile photo is available`}
          role="img"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-semibold text-accent"
        >
          {freelancer.initials}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-bold">{freelancer.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {freelancer.title}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-sm">
        <FiStar aria-hidden="true" className="text-[#b48c35]" />
        <span className="font-semibold">{freelancer.rating}</span>
        <span className="text-xs text-muted">
          {freelancer.isSample ? "sample rating" : "no reviews yet"}
        </span>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-muted">
        {freelancer.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {freelancer.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-background px-2.5 py-1 text-xs text-muted"
          >
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-xs text-muted">
            Starting price
          </p>
          <p className="mt-1 font-bold">{formatNaira(freelancer.startingPrice)}</p>
        </div>
        <div className="flex items-center gap-2">
          {freelancer.ownerUid && (
            <Link
              href={`/messages?to=${encodeURIComponent(freelancer.ownerUid)}`}
              className="button button-secondary min-h-10 px-3 py-2 text-xs"
            >
              Message
            </Link>
          )}
          <Link
            href={`/profile?freelancer=${encodeURIComponent(freelancer.id)}`}
            className="button button-primary min-h-10 px-3 py-2 text-xs"
          >
            View profile
          </Link>
        </div>
      </div>
    </article>
  );
}
