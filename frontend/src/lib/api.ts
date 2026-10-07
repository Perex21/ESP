// Types and calls for the FastAPI backend (see backend/main.py).

interface FeatureBase {
  name: string
  group: string
  label: string
}
export interface NumberFeature extends FeatureBase {
  type: 'number'
  unit: string
  min: number
  max: number
  default: number
}
export interface ChoiceFeature extends FeatureBase {
  type: 'choice'
  options: string[]
  default: string
}
export type Feature = NumberFeature | ChoiceFeature

export type StudentValues = Record<string, number | string>

export interface Preset {
  name: string
  values: StudentValues
}
export interface Schema {
  groups: string[]
  features: Feature[]
  presets: Preset[]
}

export interface Contribution {
  name: string
  label: string
  value: number | string
  marks: number
}
export interface Prediction {
  score: number
  raw_score: number
  clipped: boolean
  baseline: number
  contributions: Contribution[]
}

export interface ModelComparison {
  model: string
  mae: number
  rmse: number
  r2: number
}
export interface ModelInfo {
  model: string
  train_rows: number
  test_rows: number
  test_metrics: { MAE: number; MSE: number; RMSE: number; R2: number }
  comparison: ModelComparison[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, init)
  if (!response.ok) {
    throw new Error(`The server answered with status ${response.status}.`)
  }
  return response.json() as Promise<T>
}

export const getSchema = () => request<Schema>('/schema')
export const getModelInfo = () => request<ModelInfo>('/model-info')
export const predict = (student: StudentValues, signal?: AbortSignal) =>
  request<Prediction>('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
    signal,
  })

export function defaultValues(schema: Schema): StudentValues {
  return Object.fromEntries(schema.features.map((f) => [f.name, f.default]))
}

export const formatMarks = (marks: number) => `${marks >= 0 ? '+' : '−'}${Math.abs(marks).toFixed(1)}`
