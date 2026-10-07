import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModelComparison, ModelInfo } from '@/lib/api'

export function ModelPanel({ info }: { info: ModelInfo }) {
  const { test_metrics: m } = info
  const stats = [
    { value: m.R2.toFixed(3), label: 'R² on unseen students', hint: 'Share of score variation explained' },
    { value: m.MAE.toFixed(2), label: 'Mean absolute error', hint: 'Average error, in marks' },
    { value: m.RMSE.toFixed(2), label: 'Root mean squared error', hint: 'Penalises large errors, in marks' },
  ]
  const ranked = [...info.comparison].sort((a, b) => b.r2 - a.r2)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">About the model</CardTitle>
        <CardDescription>
          {info.model}, trained on {info.train_rows.toLocaleString()} students and tested on{' '}
          {info.test_rows.toLocaleString()} it had never seen.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/60 p-4">
              <dd className="text-3xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
              <dt className="mt-1 text-sm font-medium">{s.label}</dt>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </dl>

        <div>
          <p className="text-sm font-medium">Test R² of the five models compared</p>
          <p className="mb-3 text-xs text-muted-foreground">Higher is better. All were trained and tested on the same split.</p>
          <div className="h-[220px]" role="img" aria-label="Bar chart comparing the test R squared of five regression models">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ranked} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }} barCategoryGap={8}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number"
                  domain={[0, 1]}
                  ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="model"
                  width={140}
                  tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload as ModelComparison
                    return (
                      <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold">{row.model}</p>
                        <p className="tabular-nums">R² {row.r2.toFixed(3)}</p>
                        <p className="text-muted-foreground tabular-nums">
                          MAE {row.mae.toFixed(2)} · RMSE {row.rmse.toFixed(2)}
                        </p>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="r2"
                  animationDuration={500}
                  shape={(props: unknown) => {
                    const p = props as { payload: ModelComparison }
                    const isFinal = p.payload.model === info.model
                    return (
                      <Rectangle
                        {...(props as object)}
                        radius={[0, 4, 4, 0]}
                        fill={isFinal ? 'var(--primary)' : 'var(--muted-foreground)'}
                        fillOpacity={isFinal ? 1 : 0.45}
                      />
                    )
                  }}
                >
                  <LabelList
                    dataKey="r2"
                    position="right"
                    formatter={(v: unknown) => Number(v).toFixed(3)}
                    fill="var(--foreground)"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
