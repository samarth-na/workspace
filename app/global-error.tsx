"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#fafbfc]">
        <main className="flex min-h-dvh items-center justify-center px-6">
          <div className="w-full max-w-md rounded-2xl border border-[#e3e5ea] bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-[#232b42]">
              The application could not load
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#677085]">
              Refresh the page to try again.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 rounded-lg bg-[#5b64d6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4e57c5]"
            >
              Refresh
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
