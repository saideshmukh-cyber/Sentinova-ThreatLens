export default function IndicatorsPage() {
  return (
    <main className="flex-1">
      <header className="border-b border-slate-800 bg-slate-900 px-8 py-5">
        <h2 className="text-2xl font-semibold">
          Indicators
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Manage and investigate threat indicators.
        </p>
      </header>

      <div className="p-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold">
            Indicator Management
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Indicator data will be connected to the ThreatLens API here.
          </p>
        </div>
      </div>
    </main>
  );
}