import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ServerCrash } from 'lucide-react'
import { motion } from 'motion/react'

import { AppHeader } from '@/components/app-header'
import { ContributionChart } from '@/components/contribution-chart'
import { ModelPanel } from '@/components/model-panel'
import { AnimatedNumber, ScoreCard } from '@/components/score-card'
import { StudentForm } from '@/components/student-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useTheme } from '@/hooks/use-theme'
import type { ModelInfo, Prediction, Schema, StudentValues } from '@/lib/api'
import { defaultValues, getModelInfo, getSchema, predict } from '@/lib/api'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [schema, setSchema] = useState<Schema | null>(null)
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [values, setValues] = useState<StudentValues | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [predictError, setPredictError] = useState(false)

  const load = useCallback(() => {
    setLoadError(false)
    getSchema()
      .then((s) => {
        setSchema(s)
        setValues((current) => current ?? defaultValues(s))
      })
      .catch(() => setLoadError(true))
    getModelInfo()
      .then(setModelInfo)
      .catch(() => setModelInfo(null))
  }, [])

  useEffect(load, [load])

  // Ask the API for a new prediction shortly after the inputs stop changing.
  useEffect(() => {
    if (!values) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      predict(values, controller.signal)
        .then((result) => {
          setPrediction(result)
          setPredictError(false)
        })
        .catch((error: unknown) => {
          if ((error as Error).name !== 'AbortError') setPredictError(true)
        })
    }, 120)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [values])

  const ready = schema && values

  return (
    <TooltipProvider>
      <div className="min-h-svh pb-24 lg:pb-0">
        <AppHeader online={!!schema && !predictError} theme={theme} onToggleTheme={toggle} />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <motion.div {...fadeUp} className="mb-8 max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              What will this student score in the final exam?
            </h1>
            <p className="mt-3 text-muted-foreground text-pretty">
              Describe the student below. The model estimates the final score and shows which factors move it up or
              down.
            </p>
          </motion.div>

          {loadError ? (
            <ConnectionError onRetry={load} />
          ) : !ready ? (
            <LoadingState />
          ) : (
            <>
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
                <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
                  <StudentForm
                    schema={schema}
                    values={values}
                    onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
                    onReplace={setValues}
                    onReset={() => setValues(defaultValues(schema))}
                  />
                </motion.div>

                <motion.aside
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: 0.1 }}
                  className="order-first space-y-6 lg:sticky lg:top-22 lg:order-none"
                >
                  {predictError && (
                    <p className="rounded-lg border border-negative/40 bg-negative/10 px-3 py-2 text-sm">
                      The prediction service did not respond. Showing the last result.
                    </p>
                  )}
                  {prediction ? (
                    <>
                      <ScoreCard prediction={prediction} />
                      <ContributionChart contributions={prediction.contributions} features={schema.features} />
                    </>
                  ) : (
                    <>
                      <Skeleton className="h-56 rounded-xl" />
                      <Skeleton className="h-96 rounded-xl" />
                    </>
                  )}
                </motion.aside>
              </div>

              {modelInfo && (
                <motion.section {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.15 }} className="mt-6">
                  <ModelPanel info={modelInfo} />
                </motion.section>
              )}

              <p className="mt-8 max-w-3xl text-xs text-muted-foreground">
                This prediction is an estimate from a Linear Regression model trained on a synthetic dataset. It
                describes patterns in that data and should not be treated as a guaranteed academic result.
              </p>
            </>
          )}
        </main>

        {/* On small screens the score stays visible while the form is scrolled. */}
        {prediction && ready && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 px-4 py-3 backdrop-blur-md lg:hidden">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <span className="text-sm text-muted-foreground">Predicted exam score</span>
              <span className="text-2xl font-semibold tabular-nums">
                <AnimatedNumber value={prediction.score} />
                <span className="ml-1 text-sm font-medium text-muted-foreground">/ 100</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

function LoadingState() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]" aria-busy="true">
      <div className="space-y-5">
        <Skeleton className="h-8 w-80 max-w-full rounded-full" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}

function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-negative/15 text-negative">
          <ServerCrash className="size-6" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Can’t reach the prediction service</h2>
          <p className="text-sm text-muted-foreground">Start the API from the project folder, then try again.</p>
        </div>
        <code className="rounded-lg bg-muted px-3 py-2 text-xs">uvicorn backend.main:app</code>
        <Button onClick={onRetry}>
          <RefreshCw data-icon="inline-start" />
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}
