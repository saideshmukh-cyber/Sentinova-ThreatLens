import Link from "next/link";

type IndicatorDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IndicatorDetailsPage({
  params,
}: IndicatorDetailsPageProps) {
  const { id } = await params;

  return (
    <main className="flex-1">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <div className="flex items-center gap-4">
          <Link
            href="/indicators"
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Indicators
          </Link>

          <h2 className="text-2xl font-semibold">
            Indicator Details
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-400">
          Investigate indicator {id}.
        </p>
      </header>

      <div className="p-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">
            Indicator #{id}
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Detailed indicator information will be displayed here.
          </p>
        </div>
      </div>
    </main>
  );
}