export type DemoView = 'feed' | 'digest' | 'watchlist' | 'cta'
export type DemoTab = 'for-you' | 'digest' | 'saved' | 'dismissed'
export type AwaitAction = 'expand' | 'save' | 'thumbsUp' | 'thumbsDown' | 'tabSaved' | 'generate'

export interface DemoStep {
  id: string
  title: string
  body: string
  type: 'info' | 'action'
  view: DemoView
  overlay?: 'modal'
  spotlightTarget?: string
  awaitAction?: AwaitAction
  targetIdeaId?: string
  instructionPosition?: 'above' | 'below' | 'left' | 'right'
}
