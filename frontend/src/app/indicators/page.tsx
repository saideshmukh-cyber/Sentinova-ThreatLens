import { getIndicators } from "@/lib/api";
import type { Indicator } from "@/types/indicator";

export default async function IndicatorsPage() {
  const data = await getIndicators();

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
        <div className="mb-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Indicators
            </p>

            <p className="mt-2 text-3xl font-bold">
              {data.total}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-4">
            <h3 className="font-semibold">
              Indicator Records
            </h3>
          </div>

          {data.items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400">
                No indicators found.
              </p>
            </div>
          ) : (
            <IndicatorTable indicators={data.items} />
          )}
        </div>
      </div>
    </main>
  );
}

type IndicatorTableProps = {
  indicators: Indicator[];
};

function IndicatorTable({
  indicators,
}: IndicatorTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-800 bg-slate-950">
          <tr>
            <th className="px-6 py-4 font-medium text-slate-400">
              ID
            </th>

            <th className="px-6 py-4 font-medium text-slate-400">
              Type
            </th>

            <th className="px-6 py-4 font-medium text-slate-400">
              Value
            </th>

            <th className="px-6 py-4 font-medium text-slate-400">
              Created
            </th>
          </tr>
        </thead>

        <tbody>
          {indicators.map((indicator) => (
            <tr
              key={indicator.id}
              className="border-b border-slate-800 last:border-b-0"
            >
              <td className="px-6 py-4 text-slate-300">
                {indicator.id}
              </td>

              <td className="px-6 py-4">
                <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium uppercase text-slate-300">
                  {indicator.indicator_type}
                </span>
              </td>

              <td className="px-6 py-4 font-mono text-slate-200">
                {indicator.value}
              </td>

              <td className="px-6 py-4 text-slate-400">
                {new Date(
                  indicator.created_at,
                ).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}