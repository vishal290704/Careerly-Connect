export type Job = {
  id: string;
  company: string;
  role: string;
  location: string;
  mode: "Remote" | "Hybrid" | "On-site";
  type: "Internship" | "Full-time";
  pay: string;
  batch: string;
  category: string;
  posted: string;
  verified?: boolean;
};

export const jobs: Job[] = [
  { id: "northstar-product", company: "Northstar Labs", role: "Product Design Intern", location: "Bengaluru, India", mode: "Hybrid", type: "Internship", pay: "₹25k / month", batch: "2025–27", category: "Design", posted: "2h ago", verified: true },
  { id: "loom-frontend", company: "Loomline", role: "Frontend Engineer", location: "Remote · India", mode: "Remote", type: "Full-time", pay: "₹8–12 LPA", batch: "2023–25", category: "Engineering", posted: "5h ago", verified: true },
  { id: "verve-growth", company: "Verve Commerce", role: "Growth & Strategy Intern", location: "Mumbai, India", mode: "On-site", type: "Internship", pay: "₹18k / month", batch: "2025–27", category: "Marketing", posted: "1d ago" },
  { id: "cinder-data", company: "Cinder Analytics", role: "Data Analyst", location: "Pune, India", mode: "Hybrid", type: "Full-time", pay: "₹6–9 LPA", batch: "2022–25", category: "Analytics", posted: "1d ago" },
  { id: "goodfolk-content", company: "Goodfolk Studio", role: "Content & Community Associate", location: "Delhi, India", mode: "Hybrid", type: "Full-time", pay: "₹5–7 LPA", batch: "2023–25", category: "Marketing", posted: "2d ago" },
  { id: "orbit-qa", company: "Orbit Systems", role: "QA Automation Intern", location: "Hyderabad, India", mode: "On-site", type: "Internship", pay: "₹20k / month", batch: "2025–27", category: "Engineering", posted: "3d ago" },
];

export function companyInitials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function companyColor(name: string) {
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return `hsl(${hue} 34% 38%)`;
}
