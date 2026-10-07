import type { LucideIcon } from 'lucide-react'
import { BookOpen, HeartPulse, RotateCcw, School, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ChoiceFeature, NumberFeature, Schema, StudentValues } from '@/lib/api'

const GROUP_ICONS: Record<string, LucideIcon> = {
  Academic: BookOpen,
  Lifestyle: HeartPulse,
  School: School,
  Family: Users,
}

interface Props {
  schema: Schema
  values: StudentValues
  onChange: (name: string, value: number | string) => void
  onReplace: (values: StudentValues) => void
  onReset: () => void
}

export function StudentForm({ schema, values, onChange, onReplace, onReset }: Props) {
  const activePreset = schema.presets.find((p) =>
    Object.entries(p.values).every(([name, value]) => values[name] === value),
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">Try a profile</span>
        {schema.presets.map((preset) => (
          <Button
            key={preset.name}
            variant={activePreset?.name === preset.name ? 'default' : 'outline'}
            size="sm"
            className="rounded-full"
            onClick={() => onReplace(preset.values)}
          >
            {preset.name}
          </Button>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
      </div>

      {schema.groups.map((group) => {
        const Icon = GROUP_ICONS[group] ?? BookOpen
        const features = schema.features.filter((f) => f.group === group)
        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2.5 text-base">
                <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                {group}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {features.map((feature) =>
                feature.type === 'number' ? (
                  <NumberField
                    key={feature.name}
                    feature={feature}
                    value={values[feature.name] as number}
                    onChange={(v) => onChange(feature.name, v)}
                  />
                ) : (
                  <ChoiceField
                    key={feature.name}
                    feature={feature}
                    value={values[feature.name] as string}
                    onChange={(v) => onChange(feature.name, v)}
                  />
                ),
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function NumberField({
  feature,
  value,
  onChange,
}: {
  feature: NumberFeature
  value: number
  onChange: (value: number) => void
}) {
  const id = `field-${feature.name}`
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <label id={id} className="text-sm font-medium">
          {feature.label}
        </label>
        <span className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{value}</span> {feature.unit}
        </span>
      </div>
      <Slider
        aria-labelledby={id}
        min={feature.min}
        max={feature.max}
        step={1}
        value={[value]}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : (next as number))}
      />
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{feature.min}</span>
        <span>{feature.max}</span>
      </div>
    </div>
  )
}

function ChoiceField({
  feature,
  value,
  onChange,
}: {
  feature: ChoiceFeature
  value: string
  onChange: (value: string) => void
}) {
  const id = `field-${feature.name}`
  return (
    <div className="space-y-3">
      <p id={id} className="text-sm font-medium">
        {feature.label}
      </p>
      <ToggleGroup
        aria-labelledby={id}
        value={[value]}
        // A choice must always have one option selected, so ignore attempts to deselect.
        onValueChange={(next) => next.length > 0 && onChange(next[next.length - 1] as string)}
        spacing={0}
        className="w-full rounded-lg bg-muted p-1"
      >
        {feature.options.map((option) => (
          <ToggleGroupItem
            key={option}
            value={option}
            size="sm"
            className="flex-1 rounded-md! text-muted-foreground hover:bg-transparent aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
          >
            {option}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
