"use client";

import { useEffect, useState } from "react";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";


type RecentAlert = {
  id: number;
  indicator_id: number;
  severity_score: number;
  rule: string;
  status: string;
  assignee: string | null;
  created_at: string;
};


type DashboardSummary = {
  total_indicators: number;
  total_investigations: number;
  high_risk_investigations: number;
  total_alerts: number;
  open_alerts: number;
  total_incidents: number;
  open_incidents: number;
  total_security_events: number;
  indicator_distribution: {
    ip: number;
    domain: number;
    url: number;
    hash: number;
  };
  recent_alerts: RecentAlert[];
};


export default function Home() {
  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardSummary | null>(
    null,
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  useEffect(() => {
    async function loadDashboard() {
      try {
        const response =
          await fetch(
            `${API_URL}/api/v1/dashboard/summary`,
          );

        if (!response.ok) {
          throw new Error(
            `Failed to load dashboard: ${response.status}`,
          );
        }

        const data =
          await response.json();

        setDashboard(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);


  if (loading) {
    return (
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold">
          Security Dashboard
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Loading dashboard...
        </p>
      </main>
    );
  }


  if (error || !dashboard) {
    return (
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-semibold">
          Security Dashboard
        </h2>

        <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
          {error ??
            "Dashboard data unavailable."}
        </div>
      </main>
    );
  }


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
            Monitor indicators, investigations,
            alerts, and threat activity.
          </p>
        </div>


        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Total Indicators"
            value={
              dashboard.total_indicators
            }
            description="IPs, domains, URLs and hashes"
          />

          <DashboardCard
            title="Investigations"
            value={
              dashboard.total_investigations
            }
            description="Tracked indicator investigations"
          />

          <DashboardCard
            title="High Risk"
            value={
              dashboard.high_risk_investigations
            }
            description="High and critical investigations"
          />

          <DashboardCard
            title="Alerts"
            value={
              dashboard.total_alerts
            }
            description={`${dashboard.open_alerts} currently open`}
          />
        </div>


        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Incidents"
            value={
              dashboard.total_incidents
            }
            description={`${dashboard.open_incidents} currently open`}
          />

          <DashboardCard
            title="Security Events"
            value={
              dashboard.total_security_events
            }
            description="Events received by ThreatLens"
          />

          <DashboardCard
            title="IP Indicators"
            value={
              dashboard
                .indicator_distribution.ip
            }
            description="Known IP addresses"
          />

          <DashboardCard
            title="Domain Indicators"
            value={
              dashboard
                .indicator_distribution.domain
            }
            description="Known domains"
          />
        </div>


        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <IndicatorDistribution
            distribution={
              dashboard.indicator_distribution
            }
          />

          <RecentAlerts
            alerts={
              dashboard.recent_alerts
            }
          />
        </div>
      </div>
    </main>
  );
}


type DashboardCardProps = {
  title: string;
  value: number;
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
        {value.toLocaleString()}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}


type DistributionProps = {
  distribution: {
    ip: number;
    domain: number;
    url: number;
    hash: number;
  };
};


function IndicatorDistribution({
  distribution,
}: DistributionProps) {
  const total =
    distribution.ip +
    distribution.domain +
    distribution.url +
    distribution.hash;


  const rows = [
    {
      label: "IP",
      value: distribution.ip,
    },
    {
      label: "Domain",
      value: distribution.domain,
    },
    {
      label: "URL",
      value: distribution.url,
    },
    {
      label: "Hash",
      value: distribution.hash,
    },
  ];


  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <h3 className="font-semibold">
        Indicator Distribution
      </h3>

      <div className="mt-6 space-y-4">
        {rows.map((row) => {
          const percentage =
            total === 0
              ? 0
              : Math.round(
                  (row.value / total) *
                    100,
                );

          return (
            <div key={row.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  {row.label}
                </span>

                <span className="text-slate-500">
                  {row.value.toLocaleString()}{" "}
                  ({percentage}%)
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-slate-500"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


type RecentAlertsProps = {
  alerts: RecentAlert[];
};


function RecentAlerts({
  alerts,
}: RecentAlertsProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          Recent Alerts
        </h3>

        <a
          href="/alerts"
          className="text-xs text-slate-400 hover:text-white"
        >
          View all
        </a>
      </div>

      {alerts.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-6 text-center">
          <p className="text-sm text-slate-400">
            No alerts available.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="rounded-lg border border-slate-800 bg-slate-950 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {alert.rule}
                </span>

                <span className="text-sm font-semibold text-slate-300">
                  {alert.severity_score}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Indicator #{alert.indicator_id}
                </span>

                <span>
                  {alert.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}