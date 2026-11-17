import Link from "next/link";
import { Check, BriefcaseBusiness, Bookmark, ChartNoAxesColumnIncreasing, LockKeyhole } from "lucide-react";
import { plans } from "@/lib/plans";

export default async function PremiumPage({ searchParams }: { searchParams: Promise<{ redirect?: string; reason?: string }> }) {
  const params = await searchParams;
  const redirect = params.redirect?.startsWith("/jobs/") ? params.redirect : undefined;
  const benefits = [
    { icon: LockKeyhole, title: "Full job details", text: "View complete descriptions, qualifications, and employer information." },
    { icon: BriefcaseBusiness, title: "Apply with confidence", text: "Access Apply Now, application tracking, and withdraw controls." },
    { icon: Bookmark, title: "Save your opportunities", text: "Save jobs and manage them from your profile." },
    { icon: ChartNoAxesColumnIncreasing, title: "Track your activity", text: "Review application and saved-job activity in your dashboard." },
  ];
  const faqs = [
    ["Why do I need Premium?", "Premium unlocks individual job details and application tools while all users can still browse jobs."],
    ["Can Free users browse jobs?", "Yes. Free users can view and search every published job card."],
    ["When does Premium become active?", "Only after an administrator verifies and approves your payment."],
    ["What happens when it expires?", "Your account automatically returns to Free access and your purchase history remains available."],
    ["What happens if payment is rejected?", "You remain on Free access and can submit a new payment for verification."],
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
      {params.reason === "premium-required" && <div className="mx-auto mb-8 max-w-4xl rounded-2xl border border-teal/30 bg-teal/5 p-5 text-sm leading-6"><strong>Premium membership required.</strong> Choose a plan to unlock job details and application features.</div>}
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Applyora Premium</p>
        <h1 className="mt-4 font-newsreader text-5xl leading-tight tracking-[-0.05em] sm:text-6xl">Unlock Your Career Opportunities with Applyora Premium</h1>
        <p className="mt-5 text-lg leading-8 text-muted">Get exclusive access to job details, applications, and powerful tools designed to help you move closer to your dream job.</p>
        <a href="#plans" className="mt-8 inline-block rounded-full bg-teal px-6 py-3.5 text-sm font-semibold text-white">Explore Premium Plans</a>
      </div>

      <section className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {benefits.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border bg-surface p-6"><Icon size={22} className="text-teal" /><h2 className="mt-5 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div>)}
      </section>

      <section id="plans" className="mt-20">
        <div className="text-center"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal">Pricing</p><h2 className="mt-3 font-newsreader text-4xl">Choose your membership</h2></div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {Object.entries(plans).map(([id, plan]) => {
            const featured = id === "3-months";
            const checkout = `/premium/checkout?plan=${id}${redirect ? `&redirect=${encodeURIComponent(redirect)}` : ""}`;
            return <div key={id} className={`relative rounded-2xl border bg-surface p-6 ${featured ? "border-teal shadow-soft" : ""}`}><div className="flex items-center justify-between"><h3 className="font-semibold">{plan.name}</h3>{featured && <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-semibold text-teal">Recommended</span>}</div><p className="mt-8 text-4xl font-semibold tracking-[-0.05em]">₹{plan.amount}</p><p className="mt-1 text-sm text-muted">{plan.days} days of Premium access</p><p className="mt-3 text-xs font-semibold text-teal">Referral price available with a valid code</p><ul className="mt-8 space-y-3 text-sm text-muted">{["All job details", "Apply to available jobs", "Save and manage jobs", "Track application activity"].map((item) => <li key={item} className="flex gap-2"><Check size={17} className="shrink-0 text-teal" />{item}</li>)}</ul><Link href={checkout} className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold ${featured ? "bg-teal text-white" : "border hover:border-teal"}`}>Choose {plan.name}</Link></div>;
          })}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl rounded-2xl border bg-surface p-6 sm:p-8">
        <h2 className="font-semibold">Payment and approval</h2>
        <ol className="mt-5 grid gap-4 text-sm text-muted sm:grid-cols-4">{["Select a plan", "Complete payment", "Submit verification details", "Wait for admin approval"].map((step, index) => <li key={step} className="rounded-xl bg-secondary p-4"><span className="text-teal">0{index + 1}</span><p className="mt-2 font-medium text-ink">{step}</p></li>)}</ol>
        <p className="mt-5 rounded-xl bg-teal/5 p-4 text-sm font-semibold text-teal">Premium access is activated only after successful payment verification and administrator approval.</p>
      </section>

      <section className="mx-auto mt-16 max-w-4xl"><h2 className="font-newsreader text-4xl">Frequently asked questions</h2><div className="mt-6 divide-y rounded-2xl border bg-surface px-6">{faqs.map(([question, answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-semibold">{question}</summary><p className="mt-3 text-sm leading-6 text-muted">{answer}</p></details>)}</div></section>
    </main>
  );
}
