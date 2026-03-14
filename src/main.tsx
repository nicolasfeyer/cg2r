import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import * as Sentry from '@sentry/react'

import './i18n'
import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { Toaster } from '@/components/ui/sonner'

import './main.css'
import './styles/theme.css'
import './index.css'

Sentry.init({
  dsn: 'https://6f2fae878beec5571d45f86e291807b5@o4511164223324160.ingest.de.sentry.io/4511164225355856',
  sendDefaultPii: true,
})

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
    <Toaster />
  </ErrorBoundary>
)
