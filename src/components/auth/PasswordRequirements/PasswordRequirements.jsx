import { CheckCircle, XCircle } from '@phosphor-icons/react'
import styles from './PasswordRequirements.module.css'

export default function PasswordRequirements({ checks, id }) {
  return (
    <div id={id} className={styles.passwordList} role="list" aria-label="Requisitos da senha">
      {checks.map((rule) => {
        const Icon = rule.isValid ? CheckCircle : XCircle

        return (
          <div
            key={rule.key}
            role="listitem"
            aria-label={`${rule.label}: ${rule.isValid ? 'atendido' : 'não atendido'}`}
            className={`${styles.passwordRule} ${
              rule.isValid ? styles.passwordRuleValid : styles.passwordRuleInvalid
            }`}
          >
            <Icon size={16} weight="fill" aria-hidden="true" />
            <span>{rule.label}</span>
          </div>
        )
      })}
    </div>
  )
}
