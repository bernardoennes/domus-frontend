import { useSyncExternalStore } from 'react'
import { Moon, Sun } from '@phosphor-icons/react'
import AuthForm from '../../components/auth/AuthForm/AuthForm.jsx'
import Aurora from '../../components/Aurora/Aurora.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import styles from './AuthPage.module.css'

const motionQuery = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onChange) {
  const preference = window.matchMedia(motionQuery)
  preference.addEventListener('change', onChange)
  return () => preference.removeEventListener('change', onChange)
}

function getReducedMotion() {
  return window.matchMedia(motionQuery).matches
}

export default function AuthPage({ mode = 'login' }) {
  const { theme, toggleTheme } = useTheme()
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getReducedMotion, () => true)

  return (
    <main className={`${styles.authShell} ${mode !== 'login' ? styles.longForm : ''}`}>
      <div className={styles.background} aria-hidden="true">
        {!reducedMotion && (
          <Aurora
            colorStops={['#366b56', '#88bd95', '#315f4c']}
            amplitude={0.8}
            blend={0.7}
            speed={0.45}
            height={0.55}
            opacity={0.65}
            lightMode={theme === 'light'}
            mouseInteraction={false}
          />
        )}
      </div>
      <AuthForm mode={mode} />
      <button
        type="button"
        className={styles.themeTrigger}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        {theme === 'dark'
          ? <Sun size={20} weight="regular" aria-hidden="true" />
          : <Moon size={20} weight="regular" aria-hidden="true" />}
      </button>
    </main>
  )
}
