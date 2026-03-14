import { useTranslation } from 'react-i18next'
import { WarningCircleIcon } from '@phosphor-icons/react'

export function BetaBanner() {
  const { t } = useTranslation()

  return (
    <div className="bg-yellow-500/15 border-b border-yellow-500/20 text-yellow-700 dark:text-yellow-700 px-4 py-3 text-sm flex items-center justify-center gap-2 text-center">
      <WarningCircleIcon size={20} weight="fill" className="shrink-0" />
      <p>
        {t('app.betaBanner')}{' '}
        <a
          href="mailto:nicolas.feyer@hotmail.com"
          className="underline font-medium hover:text-yellow-800 dark:hover:text-yellow-900"
        >
          {t('app.reportBugLink')}
        </a>
        !
      </p>
    </div>
  )
}
