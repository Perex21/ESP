import { GraduationCap, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  online: boolean
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function AppHeader({ online, theme, onToggleTheme }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden />
          </div>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight whitespace-nowrap">Exam Score Predictor</p>
            <p className="hidden text-xs text-muted-foreground sm:block">Linear Regression · 19 student factors</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-medium whitespace-nowrap">
            <span className="relative flex size-2">
              {online && (
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-positive opacity-60" />
              )}
              <span className={`relative inline-flex size-2 rounded-full ${online ? 'bg-positive' : 'bg-negative'}`} />
            </span>
            {online ? 'Model online' : 'Model offline'}
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Switch colour theme">
                  {theme === 'dark' ? <Sun /> : <Moon />}
                </Button>
              }
            />
            <TooltipContent>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
