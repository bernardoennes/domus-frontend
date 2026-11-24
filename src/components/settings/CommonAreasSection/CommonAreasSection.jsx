import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarBlank, Clock, MagnifyingGlass, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { toast } from 'react-toastify'
import Select, { SORT_OPTIONS } from '../../Select/Select'
import RemoveResidentModal from '../RemoveResidentModal/RemoveResidentModal.jsx'
import EditMemberModal from '../EditMemberModal/EditMemberModal.jsx'
import styles from './CommonAreasSection.module.css'
import { AREA_TYPE_LABELS } from '../../../services/commonAreaService.js'
import { getNumberedAreas } from '../../../utils/reservationUtils.js'

const weekdayOptions = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
]
const weekdayLabels = Object.fromEntries(weekdayOptions.map(({ value, label }) => [value, label]))

const initialForm = {
  areaType: 'SWIMMING_POOL',
  availableWeekdays: weekdayOptions.map(({ value }) => value),
  startHour: '',
  endHour: '',
}

function formatHour(hour) {
  return hour ? String(hour).slice(0, 5) : ''
}

function formatAreaHours(area) {
  const start = formatHour(area.start_hour)
  const end = formatHour(area.end_hour)
  if (start && end) return `${start} às ${end}`
  if (start) return `A partir de ${start}`
  if (end) return `Até ${end}`
  return 'Não definido'
}

function isHalfHourTime(hour) {
  return !hour || /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(hour)
}

function AreaScheduleFields({ form, setForm }) {
  const toggleWeekday = (weekday) => {
    setForm((current) => ({
      ...current,
      availableWeekdays: current.availableWeekdays.includes(weekday)
        ? current.availableWeekdays.filter((day) => day !== weekday)
        : [...current.availableWeekdays, weekday].sort((first, second) => first - second),
    }))
  }

  return (
    <>
      <fieldset className={styles.weekdayField}>
        <legend>Dias disponíveis</legend>
        <div className={styles.weekdayOptions}>
          {weekdayOptions.map(({ value, label }) => (
            <label key={value} className={styles.weekdayOption}>
              <input
                type="checkbox"
                checked={form.availableWeekdays.includes(value)}
                onChange={() => toggleWeekday(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className={styles.field}>
        <span>Horário inicial <small>(opcional)</small></span>
        <input type="time" step="1800" value={form.startHour}
          onChange={(event) => setForm((current) => ({ ...current, startHour: event.target.value }))} />
      </label>
      <label className={styles.field}>
        <span>Horário final <small>(opcional)</small></span>
        <input type="time" step="1800" value={form.endHour}
          onChange={(event) => setForm((current) => ({ ...current, endHour: event.target.value }))} />
      </label>
    </>
  )
}

function AvailableWeekdays({ days }) {
  const containerRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(days.length)
  const labels = days.map((day) => weekdayLabels[day] ?? day)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    const updateVisibleCount = () => {
      const availableWidth = container.clientWidth
      const chipWidth = 34
      const chipGap = 4
      const overflowWidth = 30
      const allDaysWidth = labels.length * chipWidth + Math.max(0, labels.length - 1) * chipGap

      if (allDaysWidth <= availableWidth) {
        setVisibleCount(labels.length)
        return
      }

      const visibleDays = Math.max(
        0,
        Math.floor((availableWidth - overflowWidth - chipGap) / (chipWidth + chipGap)),
      )
      setVisibleCount(Math.min(visibleDays, labels.length - 1))
    }

    updateVisibleCount()

    const resizeObserver = new ResizeObserver(updateVisibleCount)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [labels.length])

  return (
    <span
      ref={containerRef}
      className={styles.weekdayList}
      aria-label={`Dias disponíveis: ${labels.join(', ')}`}
    >
      {labels.slice(0, visibleCount).map((label, index) => (
        <span key={`${days[index]}-${index}`} className={styles.weekdayChip} aria-hidden="true">
          {label}
        </span>
      ))}
      {visibleCount < labels.length && (
        <span className={styles.weekdayOverflow} aria-hidden="true">
          +{labels.length - visibleCount}
        </span>
      )}
    </span>
  )
}

export default function CommonAreasSection({
  items = [],
  error = '',
  canManage = false,
  hideTitleOnMobile = false,
  onCreate,
  isCreating = false,
  onRemove,
  isRemoving = false,
  onUpdate,
  isUpdating = false,
}) {
  const [form, setForm] = useState(initialForm)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [areaToRemove, setAreaToRemove] = useState(null)
  const [areaToEdit, setAreaToEdit] = useState(null)
  const [editForm, setEditForm] = useState(initialForm)
  const numberedAreas = useMemo(() => getNumberedAreas(items), [items])
  const visibleAreas = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase('pt-BR')

    return numberedAreas
      .filter((area) => (
        `${area.displayName} ${area.area_type}`.toLocaleLowerCase('pt-BR').includes(query)
      ))
      .sort((firstArea, secondArea) => {
        const comparison = firstArea.displayName.localeCompare(secondArea.displayName, 'pt-BR', {
          sensitivity: 'base',
          numeric: true,
        })

        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [numberedAreas, searchTerm, sortOrder])

  const handleRemove = async () => {
    if (!areaToRemove) return

    try {
      await onRemove(areaToRemove.id)
      toast.success('Área comum excluída.')
      setAreaToRemove(null)
    } catch (removeError) {
      toast.error(removeError.message)
    }
  }

  const validateSchedule = (schedule) => {
    if (schedule.availableWeekdays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana.')
      return false
    }

    if (!isHalfHourTime(schedule.startHour) || !isHalfHourTime(schedule.endHour)) {
      toast.error('Selecione horários em intervalos de 30 minutos.')
      return false
    }

    if (schedule.startHour && schedule.endHour && schedule.startHour >= schedule.endHour) {
      toast.error('O horário final precisa ser posterior ao horário inicial.')
      return false
    }
    return true
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateSchedule(form)) return

    try {
      const area = await onCreate(form)
      setForm(initialForm)
      toast.success(area.reactivated ? 'Área comum reativada com as novas configurações.' : 'Área comum cadastrada.')
    } catch (createError) {
      toast.error(createError.message ?? 'Não foi possível cadastrar a área comum.')
    }
  }

  const handleEdit = async (event) => {
    event.preventDefault()
    if (!areaToEdit || !validateSchedule(editForm)) return

    try {
      await onUpdate({ areaId: areaToEdit.id, ...editForm })
      setAreaToEdit(null)
      toast.success('Área comum atualizada.')
    } catch (updateError) {
      toast.error(updateError?.message ?? 'Não foi possível atualizar a área comum.')
    }
  }

  return (
    <div className={styles.pageContent}>
      <header className={styles.pageHeading}>
        <div>
          <h1 className={hideTitleOnMobile ? styles.hideTitleOnMobile : undefined}>Áreas comuns</h1>
        </div>
      </header>

      {canManage && (
        <form className={styles.createForm} onSubmit={handleSubmit}>
          <h2>Cadastrar área comum</h2>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Tipo de área</span>
              <Select
                value={form.areaType}
                onChange={(areaType) => setForm({ ...form, areaType })}
                options={Object.entries(AREA_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </label>

            <AreaScheduleFields form={form} setForm={setForm} />
          </div>

          <button type="submit" className={styles.primaryButton} disabled={isCreating}>
            <Plus size={16} weight="bold" aria-hidden="true" />
            {isCreating ? 'Cadastrando...' : 'Cadastrar área'}
          </button>
        </form>
      )}

      {error ? (
        <div className={styles.errorState} role="alert">{error}</div>
      ) : numberedAreas.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhuma área comum cadastrada.
        </div>
      ) : (
        <section className={styles.listCard} aria-label="Áreas comuns cadastradas">
          <div className={styles.listControls}>
            <label className={styles.searchField}>
              <span className={styles.visuallyHidden}>Buscar áreas comuns</span>
              <span className={styles.searchIcon} aria-hidden="true">
                <MagnifyingGlass size={17} weight="bold" />
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome ou tipo..."
              />
            </label>
            <Select
              value={sortOrder}
              onChange={setSortOrder}
              ariaLabel="Ordenar áreas por nome"
              options={SORT_OPTIONS}
            />
          </div>
          <div className={styles.listGrid} tabIndex={0} aria-label="Lista de áreas comuns">
            {visibleAreas.map((area) => (
              <div key={area.id} className={styles.listItem}>
                <div className={styles.areaHeading}>
                  <strong className={styles.areaName}>{area.displayName}</strong>
                  {canManage && (
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.editButton}
                        disabled={isUpdating}
                        title="Editar área comum"
                        aria-label={`Editar ${area.displayName}`}
                        onClick={() => {
                          setEditForm({
                            availableWeekdays: area.available_weekdays ?? [],
                            startHour: formatHour(area.start_hour),
                            endHour: formatHour(area.end_hour),
                          })
                          setAreaToEdit(area)
                        }}
                      >
                        <PencilSimple size={18} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={styles.removeButton}
                        disabled={isRemoving}
                        title="Excluir área comum"
                        aria-label={`Excluir ${area.displayName}`}
                        onClick={() => setAreaToRemove(area)}
                      >
                        <Trash size={18} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.areaDetails}>
                  <span className={styles.areaDetail}>
                    <span className={styles.detailLabel}>
                      <Clock size={16} weight="regular" aria-hidden="true" />
                      Horário
                    </span>
                    <span>{formatAreaHours(area)}</span>
                  </span>
                  <span className={`${styles.areaDetail} ${styles.weekdays}`}>
                    <span className={styles.detailLabel}>
                      <CalendarBlank size={16} weight="regular" aria-hidden="true" />
                      Dias disponíveis
                    </span>
                    {area.available_weekdays?.length
                      ? <AvailableWeekdays days={area.available_weekdays} />
                      : <span>Não definidos</span>}
                  </span>
                </div>
              </div>
            ))}
            {visibleAreas.length === 0 && (
              <p className={styles.noResults}>Nenhuma área corresponde à pesquisa.</p>
            )}
          </div>
        </section>
      )}

      {areaToEdit && (
        <EditMemberModal
          title="Editar área comum"
          name={areaToEdit.displayName}
          isSaving={isUpdating}
          onCancel={() => setAreaToEdit(null)}
          onSubmit={handleEdit}
        >
          <AreaScheduleFields form={editForm} setForm={setEditForm} />
          <p className={styles.editNote}>As reservas existentes serão mantidas.</p>
        </EditMemberModal>
      )}

      <RemoveResidentModal
        resident={areaToRemove}
        title="Excluir área comum?"
        isRemoving={isRemoving}
        onCancel={() => setAreaToRemove(null)}
        onConfirm={handleRemove}
        confirmLabel="Excluir área"
        description={areaToRemove ? (
          <>
            A área <strong>{areaToRemove.displayName}</strong> deixará de aparecer nas listas e não aceitará novas reservas. As reservas já feitas serão mantidas.
          </>
        ) : undefined}
      />
    </div>
  )
}
