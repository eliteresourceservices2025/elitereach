import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-gray-400">404</p>
      <h1 className="text-2xl font-semibold text-elite-navy-dark">Page not found</h1>
      <p className="max-w-sm text-sm text-gray-500">
        This might be a link to something that was deleted, like an old campaign or sequence.
      </p>
      <Link href="/" className="mt-2 rounded-lg bg-elite-violet px-4 py-2 text-sm font-medium text-white hover:bg-elite-navy-dark">
        Back to Dashboard
      </Link>
    </div>
  );
}
