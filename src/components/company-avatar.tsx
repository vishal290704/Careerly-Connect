import { companyColor, companyInitials } from "@/lib/jobs";

export function CompanyAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  return <div style={{ backgroundColor: companyColor(name) }} className={`grid shrink-0 place-items-center rounded-xl font-semibold text-white ${size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm"}`}>{companyInitials(name)}</div>;
}
