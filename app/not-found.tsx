import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fafbfc] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[#e3e5ea] bg-white p-8 text-center shadow-sm">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8b93a6] uppercase">
          404
        </p>
        <h1 className="mt-3 text-xl font-semibold text-[#232b42]">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#677085]">
          The page does not exist or is no longer available.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-[#5b64d6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4e57c5]"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
