"use client";

import { useEffect, useState } from "react";

type Application = { _id: string; appliedAt: string; entitlementType: string; userId?: { name?: string; normalizedEmail?: string }; jobId?: { role?: string; companyName?: string; location?: string } };

export function ApplicationsTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  useEffect(() => { fetch("/api/admin/applications").then((response) => response.json()).then((result) => setApplications(result.applications ?? [])); }, []);
  return <div className="mt-10 overflow-x-auto rounded-2xl border bg-surface"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b text-muted"><tr><th className="p-4">Applicant</th><th className="p-4">Job</th><th className="p-4">Entitlement</th><th className="p-4">Applied</th></tr></thead><tbody>{applications.map((application) => <tr key={application._id} className="border-b last:border-0"><td className="p-4"><p className="font-medium">{application.userId?.name}</p><p className="text-xs text-muted">{application.userId?.normalizedEmail}</p></td><td className="p-4">{application.jobId?.role}<p className="text-xs text-muted">{application.jobId?.companyName}</p></td><td className="p-4">{application.entitlementType}</td><td className="p-4">{new Date(application.appliedAt).toLocaleString()}</td></tr>)}</tbody></table>{applications.length === 0 && <p className="p-8 text-center text-muted">No applications recorded yet.</p>}</div>;
}
