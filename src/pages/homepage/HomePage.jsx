import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Ticket } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import Header from '../../components/Header/Header.jsx'
import MonthlyCalendar from '../../components/MonthlyCalendar/MonthlyCalendar.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import useCommonAreas from '../../hooks/useCommonAreas.js'
import useAnnouncements from '../../hooks/useAnnouncements.js'
import { fetchCalendarReservations, getNationalHolidays } from '../../services/calendarService.js'
import { fetchTickets } from '../../services/ticketService.js'
import { getNumberedAreas } from '../../utils/reservationUtils.js'
import styles from './HomePage.module.css'

const dashboardPanels = ['Avisos', 'Calendário', 'Tickets']

export default function HomePage() {
  const { user, membership } = useAuth()
  const organisationId = membership?.organisation_id
  const announcementState = useAnnouncements(organisationId)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [activePanel, setActivePanel] = useState(0)
  const dashboardRef = useRef(null)
  const [reservationState, setReservationState] = useState({ requestKey: '', reservations: [], error: '' })
  const [ticketState, setTicketState] = useState({ organisationId: '', tickets: [], isLoading: false, error: '' })
  const [reservationRequestId, setReservationRequestId] = useState(0)
  const commonAreas = useCommonAreas(organisationId)
  const areas = useMemo(() => getNumberedAreas(commonAreas.areas), [commonAreas.areas])
  const requestKey = `${organisationId ?? ''}:${areas.map((area) => area.id).join(',')}:${reservationRequestId}`

  const overlayClass = isSidebarExpanded ? ` ${styles.overlayVisible}` : ''
  const userName = user?.name ?? 'Morador'
  const greetingName = userName.trim().split(/\s+/)[0] || 'Morador'
  const reservations = useMemo(() => (
    reservationState.requestKey === requestKey ? reservationState.reservations : []
  ), [requestKey, reservationState])
  const reservationsLoading = !commonAreas.error
    && (commonAreas.isLoading || reservationState.requestKey !== requestKey)
  const reservationsError = commonAreas.error
    || (reservationState.requestKey === requestKey ? reservationState.error : '')
  const ticketLoading = ticketState.organisationId !== String(organisationId ?? '') || ticketState.isLoading
  const visibleTickets = ticketState.organisationId === String(organisationId ?? '')
    ? ticketState.tickets
    : []

  const holidays = useMemo(() => [
    ...getNationalHolidays(new Date().getFullYear()),
    ...getNationalHolidays(new Date().getFullYear() + 1),
  ], [])

  const calendarEvents = useMemo(() => [
    ...holidays,
    ...reservations.map((reservation) => ({
      ...reservation,
      id: `reservation-${reservation.id}`,
      title: reservation.areaName,
      type: 'reservation',
      detail: `${reservation.startTime} · Reserva de área comum`,
    })),
  ].sort((first, second) => (
    first.date.localeCompare(second.date)
    || String(first.startTime ?? '').localeCompare(String(second.startTime ?? ''))
  )), [holidays, reservations])

  useEffect(() => {
    if (!organisationId) {
      setTicketState({ organisationId: '', tickets: [], isLoading: false, error: '' })
      return undefined
    }

    let isCurrent = true

    fetchTickets(organisationId, user?.id, membership?.access_type)
      .then((tickets) => {
        if (isCurrent) {
          setTicketState({ organisationId: String(organisationId), tickets, isLoading: false, error: '' })
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setTicketState({
            organisationId: String(organisationId),
            tickets: [],
            isLoading: false,
            error: error?.message ?? 'Não foi possível carregar os tickets.',
          })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [organisationId, user?.id, membership?.access_type])

  useEffect(() => {
    if (commonAreas.isLoading || commonAreas.error) {
      return undefined
    }

    let isCurrent = true
    async function loadReservations() {
      try {
        const nextReservations = await fetchCalendarReservations(organisationId, areas)
        if (isCurrent) {
          setReservationState({ requestKey, reservations: nextReservations, error: '' })
        }
      } catch (error) {
        if (isCurrent) {
          setReservationState({
            requestKey,
            reservations: [],
            error: error?.message ?? 'Não foi possível carregar as reservas.',
          })
        }
      }
    }

    loadReservations()
    return () => {
      isCurrent = false
    }
  }, [organisationId, areas, commonAreas.error, commonAreas.isLoading, requestKey])

  const retryReservations = () => {
    if (commonAreas.error) {
      commonAreas.retry()
      return
    }

    setReservationRequestId((id) => id + 1)
  }

  const updateActivePanel = (event) => {
    const dashboard = event.currentTarget
    const left = dashboard.getBoundingClientRect().left
    const nearest = Array.from(dashboard.children).reduce((closest, panel, index) => {
      const distance = Math.abs(panel.getBoundingClientRect().left - left)
      return distance < closest.distance ? { index, distance } : closest
    }, { index: 0, distance: Infinity })
    setActivePanel(nearest.index)
  }

  const showPanel = (index) => {
    const dashboard = dashboardRef.current
    const panel = dashboard?.children[index]
    if (!dashboard || !panel) return

    dashboard.scrollTo({
      left: dashboard.scrollLeft + panel.getBoundingClientRect().left - dashboard.getBoundingClientRect().left,
      behavior: 'auto',
    })
  }

  return (
    <div className={styles.pageShell}>
      <Header
        userName={userName}
        accessType={membership?.access_type ?? 'Não definido'}
        navigationExpanded={isSidebarExpanded}
        onNavigationToggle={setIsSidebarExpanded}
      />

      <div className={styles.pageBody}>
        <button
          type="button"
          className={`${styles.pageOverlay}${overlayClass}`}
          aria-label="Fechar navegação"
          aria-hidden={!isSidebarExpanded}
          tabIndex={isSidebarExpanded ? 0 : -1}
          onClick={() => setIsSidebarExpanded(false)}
        />

        <Sidebar
          expanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
          activeId="home"
          userName={userName}
          accessType={membership?.access_type ?? 'Não definido'}
        />

        <main className={styles.homeContent}>
          <div className={styles.welcomeBlock}>
            <h1>Olá, {greetingName}!</h1>
          </div>

          <div className={styles.carouselNavigation} role="group" aria-label="Navegar pelo resumo do condomínio">
            {dashboardPanels.map((panel, index) => (
              <button
                key={panel}
                type="button"
                aria-controls="dashboard-panels"
                aria-pressed={activePanel === index}
                onClick={() => showPanel(index)}
              >
                {panel}
              </button>
            ))}
          </div>

          <section
            id="dashboard-panels"
            className={styles.dashboardGrid}
            aria-label="Resumo do condomínio"
            ref={dashboardRef}
            onScroll={updateActivePanel}
          >
            <section className={`${styles.dashboardPanel} ${styles.noticesPanel}`}>
              <header className={styles.panelHeading}>
                <span className={styles.iconBadge}><Bell size={17} weight="bold" /></span>
                <h2><Link className={styles.panelTitleLink} to="/avisos">Avisos</Link></h2>
              </header>
              {announcementState.error && (
                <p className={styles.announcementStatus} role="alert">{announcementState.error}</p>
              )}
              {announcementState.isLoading && (
                <p className={styles.announcementStatus}>Carregando avisos…</p>
              )}
              {!announcementState.isLoading && !announcementState.error && (
                <>
                  {announcementState.announcements.slice(0, 3).map((announcement) => (
                    <Link
                      key={announcement.id}
                      to={`/avisos/${announcement.id}`}
                      className={styles.noticePreview}
                    >
                      <strong>{announcement.title}</strong>
                      <span>{announcement.body}</span>
                      <small>
                        {announcement.author?.name ?? 'Morador'}
                        {' · '}
                        {announcement.comments.length} comentários
                      </small>
                    </Link>
                  ))}
                  {announcementState.announcements.length === 0 && (
                    <p className={styles.announcementStatus}>
                      Ainda não há avisos publicados.
                    </p>
                  )}
                  <Link to="/avisos" className={styles.viewAllNotices}>Ver todos os avisos</Link>
                </>
              )}
            </section>

            <div className={styles.calendarGridItem}>
              {reservationsError && !reservationsLoading && (
                <div className={styles.calendarError} role="alert">
                  <span>{reservationsError}</span>
                  <button type="button" onClick={retryReservations}>Tentar novamente</button>
                </div>
              )}
              <MonthlyCalendar events={calendarEvents} isLoading={reservationsLoading} />
            </div>

            <section className={`${styles.dashboardPanel} ${styles.occurrencesPanel}`}>
              <header className={styles.panelHeading}>
                <span className={styles.iconBadge}><Ticket size={17} weight="bold" /></span>
                <h2><Link className={styles.panelTitleLink} to="/tickets">Tickets</Link></h2>
              </header>
              {ticketState.error && (
                <p className={styles.announcementStatus} role="alert">{ticketState.error}</p>
              )}
              {ticketLoading && (
                <p className={styles.announcementStatus}>Carregando tickets…</p>
              )}
              {!ticketLoading && !ticketState.error && (
                <>
                  {visibleTickets.slice(0, 3).map((ticket) => (
                    <Link key={ticket.id} to="/tickets" className={styles.noticePreview}>
                      <strong>{ticket.assunto}</strong>
                      <span>{ticket.code} · {ticket.categoria}</span>
                      <small>{ticket.situacao} · {ticket.creator_name ?? ticket.solicitacao}</small>
                    </Link>
                  ))}
                  {visibleTickets.length === 0 && (
                    <p className={styles.announcementStatus}>
                      Ainda não há tickets abertos.
                    </p>
                  )}
                  <Link to="/tickets" className={styles.viewAllNotices}>Ver todos os chamados</Link>
                </>
              )}
            </section>
          </section>
        </main>
      </div>
    </div>
  )
}
