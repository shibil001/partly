"use client"

const states = [
  { name: "Maharashtra", abbr: "MH", percentage: 58 },
  { name: "Delhi", abbr: "DL", percentage: 47 },
  { name: "Karnataka", abbr: "KA", percentage: 42 },
  { name: "Tamil Nadu", abbr: "TN", percentage: 35 },
  { name: "Gujarat", abbr: "GJ", percentage: 28 },
]

export function TopSalesByState() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Top Sales by State</h3>
        <button className="text-sm text-blue-600 hover:underline">See all</button>
      </div>
      <div className="space-y-4">
        {states.map((state) => (
          <div key={state.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-600">
                  {state.abbr}
                </span>
                <span className="text-sm font-medium text-gray-900">{state.name}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{state.percentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${state.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}