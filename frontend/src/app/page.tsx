export default function Home() {
  return (
    <main className="flex-1">
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

      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-lg font-semibold">
            Intelligence Overview
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Monitor indicators, investigations, and threat activity.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Total Indicators"
            value="0"
            description="IPs, domains, URLs and hashes"
          />

          <DashboardCard
            title="Investigations"
            value="0"
            description="Active threat investigations"
          />

          <DashboardCard
            title="High Risk"
            value="0"
            description="High-risk investigations"
          />

          <DashboardCard
            title="Alerts"
            value="0"
            description="Security alerts"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <DashboardPanel
            title="Recent Activity"
            message="Activity will appear here as ThreatLens processes intelligence."
          />

          <DashboardPanel
            title="Threat Distribution"
            message="Threat statistics will appear here."
          />
        </div>
      </div>
    </main>
  );
}

type DashboardCardProps = {
  title: string;
  value: string;
  description: string;
};

function DashboardCard({
  title,
  value,
  description,
}: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

type DashboardPanelProps = {
  title: string;
  message: string;
};

function DashboardPanel({
  title,
  message,
}: DashboardPanelProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="font-semibold">
        {title}
      </h3>

      <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
        <p className="text-sm text-slate-400">
          No data available
        </p>

        <p className="mt-2 text-xs text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}