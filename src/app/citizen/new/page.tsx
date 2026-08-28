import Link from "next/link";
import { FileGrievanceForm } from "@/components/FileGrievanceForm";

export default function NewGrievancePage() {
  return (
    <div>
      <Link href="/citizen" className="text-sm text-brand-700">
        &larr; My grievances
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">File a new grievance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your submission becomes the first sealed event in a verifiable case timeline.
      </p>
      <div className="mt-6">
        <FileGrievanceForm />
      </div>
    </div>
  );
}
