import { useState } from 'react'
import { Eye, EyeSlash, LockKey, PencilSimple, SignOut } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { updatePassword } from '../../../services/userService.js'
import { getPasswordValidation } from '../../../utils/passwordValidation.js'
import PasswordRequirements from '../../auth/PasswordRequirements/PasswordRequirements.jsx'
import EditMemberModal from '../EditMemberModal/EditMemberModal.jsx'
import styles from './AccountSection.module.css'

export default function AccountSection({ profile, hideTitleOnMobile = false }) {
  const navigate = useNavigate()
  const { signOut, changeOwnName } = useAuth()
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState('')
  const [isSavingName, setIsSavingName] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const passwordChecks = getPasswordValidation(passwordForm.newPassword)
  const passwordFields = [
    { name: 'currentPassword', label: 'Senha atual', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'Nova senha', autoComplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirmar nova senha', autoComplete: 'new-password' },
  ]
  const initials = (profile?.name ?? 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('pt-BR')

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()

    setPasswordError('')
    const invalidRule = passwordChecks.find((rule) => !rule.isValid)

    if (invalidRule) {
      toast.error(invalidRule.message)
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('A confirmação da nova senha não confere.')
      return
    }

    setIsSavingPassword(true)

    try {
      await updatePassword(passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setVisiblePasswords({})
      toast.success('Senha alterada com sucesso.')
    } catch (error) {
      setPasswordError(error.message ?? 'Não foi possível alterar a senha.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const handleNameSubmit = async (event) => {
    event.preventDefault()
    setIsSavingName(true)
    try {
      await changeOwnName(name)
      setIsEditingName(false)
      toast.success('Nome atualizado.')
    } catch (error) {
      toast.error(error?.message ?? 'Não foi possível alterar o nome.')
    } finally {
      setIsSavingName(false)
    }
  }

  return (
    <div className={styles.pageContent}>
      <header className={styles.pageHeading}>
        <h1 className={hideTitleOnMobile ? styles.hideTitleOnMobile : undefined}>Minha conta</h1>
      </header>

      <section className={styles.profileCard} aria-label="Resumo do perfil">
        <div className={styles.avatar} aria-hidden="true">{initials}</div>
        <div className={styles.profileSummary}>
          <h2>{profile?.name ?? 'Usuário'}</h2>
          <div className={styles.profileDetails}>
            <span>{profile?.access_type ?? 'Perfil não definido'}</span>
            <span><strong>CPF:</strong> {profile?.cpf ?? 'Não informado'}</span>
          </div>
        </div>
        <button
          type="button"
          className={styles.editNameButton}
          aria-label="Editar meu nome"
          title="Editar meu nome"
          onClick={() => {
            setName(profile?.name ?? '')
            setIsEditingName(true)
          }}
        >
          <PencilSimple size={19} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          aria-label="Sair da conta"
          title="Sair da conta"
        >
          <SignOut size={19} weight="regular" aria-hidden="true" />
        </button>
      </section>

      {isEditingName && (
        <EditMemberModal
          title="Editar meu nome"
          name={profile?.name}
          isSaving={isSavingName}
          onCancel={() => setIsEditingName(false)}
          onSubmit={handleNameSubmit}
        >
          <label className={styles.nameField}>
            Nome completo
            <input required value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        </EditMemberModal>
      )}

      <section className={styles.securityCard}>
        <header className={styles.securityHeading}>
          <span className={styles.securityIcon}><LockKey size={18} weight="fill" aria-hidden="true" /></span>
          <div>
            <h2>Segurança</h2>
            <p>Atualize sua senha para manter sua conta protegida.</p>
          </div>
        </header>
        <form className={styles.passwordForm} onSubmit={handlePasswordSubmit}>
          <div className={styles.inlineFields}>
            {passwordFields.map((field) => {
              const isVisible = Boolean(visiblePasswords[field.name])
              const VisibilityIcon = isVisible ? EyeSlash : Eye

              return (
                <div key={field.name} className={styles.passwordField}>
                  <label htmlFor={field.name}>{field.label}</label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      id={field.name}
                      type={isVisible ? 'text' : 'password'}
                      autoComplete={field.autoComplete}
                      aria-describedby={field.name === 'newPassword' ? 'new-password-requirements' : undefined}
                      required
                      value={passwordForm[field.name]}
                      onChange={(event) => {
                        setPasswordForm({ ...passwordForm, [field.name]: event.target.value })
                        setPasswordError('')
                      }}
                    />
                    <button
                      type="button"
                      className={styles.visibilityButton}
                      onClick={() =>
                        setVisiblePasswords((current) => ({
                          ...current,
                          [field.name]: !current[field.name],
                        }))
                      }
                      aria-label={`${isVisible ? 'Ocultar' : 'Mostrar'} ${field.label.toLowerCase()}`}
                      title={`${isVisible ? 'Ocultar' : 'Mostrar'} ${field.label.toLowerCase()}`}
                    >
                      <VisibilityIcon size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className={styles.requirements}>
            <span>Requisitos da nova senha</span>
            <PasswordRequirements id="new-password-requirements" checks={passwordChecks} />
          </div>
          {passwordError && <div className={styles.errorBox} role="alert">{passwordError}</div>}
          <button type="submit" className={styles.primaryButton} disabled={isSavingPassword}>
            {isSavingPassword ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </section>
    </div>
  )
}
