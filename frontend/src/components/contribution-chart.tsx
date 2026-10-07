import { Bar, BarChart, CartesianGrid, LabelList, Rectangle, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { ResponsiveContainer } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Contribution, Feature } from '@/lib/api'
import { formatMarks } from '@/lib/api'

const TOP_COUNT = 8

interface Props {
  contributions: Contribution[]
  features: Feature[]
}

export function ContributionChart({ contributions, features }: Props) {
  const units = new Map(features.map((f) => [f.name, f.type === 'number' ? f.unit : '']))
  const describe = (c: Contribution) => `${c.value}${units.get(c.name) ? ` ${units.get(c.name)}` : ''}`

  const top = contributions.slice(0, TOP_COUNT)
  // A symmetric axis keeps zero in the middle, so bar length is comparable on both sides.
  const extent = Math.max(2, 2 * Math.ceil((Math.max(...top.map((c) => Math.abs(c.marks))) * 1.25) / 2))

  return (
    <Card>
      <Tabs defaultValue="chart">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Why this score</CardTitle>
              <CardDescription>Marks each factor adds or removes, compared with the average student.</CardDescription>
            </div>
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent>
          <TabsContent value="chart">
            <div className="h-[300px]" role="img" aria-label="Bar chart of the eight factors with the largest effect on this prediction">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={top} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }} barCategoryGap={7}>
                  <CartesianGrid horizontal={false} stroke="var(--border)" />
                  <XAxis
                    type="number"
                    domain={[-extent, extent]}
                    ticks={[-extent, -extent / 2, 0, extent / 2, extent]}
                    tickFormatter={(v: number) => (v > 0 ? `+${v}` : `${v}`)}
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={132}
                    tick={{ fill: 'var(--foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine x={0} stroke="var(--muted-foreground)" />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const c = payload[0].payload as Contribution
                      return (
                        <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold">{c.label}</p>
                          <p className="text-muted-foreground">{describe(c)}</p>
                          <p className="mt-1 font-medium tabular-nums">{formatMarks(c.marks)} marks</p>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="marks"
                    animationDuration={350}
                    shape={(props: unknown) => {
                      const p = props as { payload: Contribution }
                      return (
                        <Rectangle
                          {...(props as object)}
                          radius={[0, 4, 4, 0]}
                          fill={p.payload.marks >= 0 ? 'var(--positive)' : 'var(--negative)'}
                        />
                      )
                    }}
                  >
                    <LabelList
                      dataKey="marks"
                      position="right"
                      formatter={(v: unknown) => formatMarks(Number(v))}
                      fill="var(--foreground)"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-positive" /> Raises the score
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-negative" /> Lowers the score
              </span>
              <span className="ml-auto">Top {TOP_COUNT} of 19 factors</span>
            </div>
          </TabsContent>

          <TabsContent value="table">
            <div className="max-h-[340px] overflow-y-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Factor</th>
                    <th className="px-3 py-2 text-left font-medium">Value</th>
                    <th className="px-3 py-2 text-right font-medium">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.name} className="border-t">
                      <td className="px-3 py-2">{c.label}</td>
                      <td className="px-3 py-2 text-muted-foreground">{describe(c)}</td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums">{formatMarks(c.marks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}
