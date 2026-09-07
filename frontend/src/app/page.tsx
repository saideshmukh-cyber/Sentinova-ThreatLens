export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h1 className="text-xl font-bold">
              ThreatLens
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              Threat Intelligence Platform
            </p>
          </div>

          <nav className="p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Intelligence
            </p>

            <div className="space-y-1">
              <a
                href="#"
                className="block rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white"
              >
                Dashboard
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Indicators
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Enrichments
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Investigations
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Feeds
              </a>
            </div>

            <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monitoring
            </p>

            <div className="space-y-1">
              <a
                href="#"
                className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Alerts
              </a>

              <a
                href="#"
                className="block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Incidents
              </a>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <section className="flex-1">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-8 py-5">
            <div>
              <h2 className="text-2xl font-semibold">
                Security Dashboard
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Threat intelligence overview
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300">
                System Online
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
                TL
              </div>
            </div>
          </header>

          {/* Dashboard */}
          <main className="p-8">
            <div className="mb-8">
              <h3 className="text-lg font-semibold">
                Intelligence Overview
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Monitor indicators, investigations, and threat activity.
              </p>
            </div>

            {/* Statistics */}
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Total Indicators
                </p>

                <p className="mt-3 text-3xl font-bold">
                  0
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  IPs, domains, URLs and hashes
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Investigations
                </p>

                <p className="mt-3 text-3xl font-bold">
                  0
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Active threat investigations
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  High Risk
                </p>

                <p className="mt-3 text-3xl font-bold">
                  0
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  High-risk investigations
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm text-slate-400">
                  Alerts
                </p>

                <p className="mt-3 text-3xl font-bold">
                  0
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Security alerts
                </p>
              </div>
            </div>

            {/* Activity area */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="font-semibold">
                  Recent Activity
                </h3>

                <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    No recent activity
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Activity will appear here as ThreatLens processes intelligence.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <h3 className="font-semibold">
                  Threat Distribution
                </h3>

                <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    No threat data available
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Threat statistics will appear here.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </section>
      </div>
    </main>
  );
}