import { useEffect, useRef, useState } from 'react'
import { Info, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'

import { Card, CardContent } from '@/components/ui/card'
import type { Prediction } from '@/lib/api'

/** Counts smoothly from the previous value to the new one. */
export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [initial] = useState(() => value.toFixed(1))
  const motionValue = useMotionValue(value)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: reduceMotion ? 0 : 0.45, ease: 'easeOut' })
    return () => controls.stop()
  }, [value, motionValue, reduceMotion])

  useMotionValueEvent(motionValue, 'change', (latest) => {
    if (ref.current) ref.current.textContent = latest.toFixed(1)
  })

  return <span ref={ref}>{initial}</span>
}

export function ScoreCard({ prediction }: { prediction: Prediction }) {
  const { score, baseline, clipped, raw_score } = prediction
  const difference = score - baseline
  const near = Math.abs(difference) < 0.05
  const DeltaIcon = near ? Minus : difference > 0 ? TrendingUp : TrendingDown

  return (
    <Card className="relative overflow-hidden">
      {/* A soft pulse each time the score changes. */}
      <motion.div
        key={score.toFixed(1)}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-primary/50 ring-inset"
        initial={{ opacity: 0.9 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <CardContent className="space-y-5">
        <p className="text-sm font-medium text-muted-foreground">Predicted exam score</p>

        <div className="flex items-baseline gap-2" aria-live="polite">
          <span className="text-7xl leading-none font-semibold tracking-tighter tabular-nums">
            <AnimatedNumber value={score} />
          </span>
          <span className="text-xl font-medium text-muted-foreground">/ 100</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={`flex size-6 items-center justify-center rounded-full text-white ${
              near ? 'bg-muted-foreground' : difference > 0 ? 'bg-positive' : 'bg-negative'
            }`}
          >
            <DeltaIcon className="size-3.5" aria-hidden />
          </span>
          {near ? (
            <span>Same as the average student</span>
          ) : (
            <span>
              <span className="font-semibold tabular-nums">{Math.abs(difference).toFixed(1)} marks</span>{' '}
              {difference > 0 ? 'above' : 'below'} the average student
            </span>
          )}
        </div>

        <ScoreScale score={score} baseline={baseline} />

        {clipped && (
          <p className="flex gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            The model’s raw output was {raw_score.toFixed(1)}. It is shown limited to the valid 0–100 range.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ScoreScale({ score, baseline }: { score: number; baseline: number }) {
  return (
    <div className="pt-1">
      <div className="relative h-2.5 rounded-full bg-muted">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          initial={false}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        />
        <div
          className="absolute -top-1 h-4.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: `${baseline}%` }}
        />
      </div>
      <div className="relative mt-2 h-4 text-xs text-muted-foreground tabular-nums">
        <span className="absolute left-0">0</span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${baseline}%` }}>
          Average {baseline.toFixed(1)}
        </span>
        <span className="absolute right-0">100</span>
      </div>
    </div>
  )
}
