import { useState, useEffect } from 'react'
import { MagnifyingGlass, Plus, PencilSimple, Paperclip } from '@phosphor-icons/react'
import Header from '../../components/Header/Header.jsx'
import PageSubheader from '../../components/PageSubheader/PageSubheader.jsx'
import Select from '../../components/Select/Select.jsx'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { createTicket, fetchTickets, updateTicketStatus } from '../../services/ticketService.js'
import styles from './ticketpage.module.css'

export default function Tickets() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const { user, membership } = useAuth()
  const organisationId = membership?.organisation_id

  const userName = user?.name ?? 'Morador'
  const accessType = membership?.access_type ?? 'Não definido'

  const [ticketState, setTicketState] = useState({ organisationId: null, tickets: [], loading: true })
  const currentOrganisationId = String(organisationId ?? '')
  const isCurrentOrganisation = ticketState.organisationId === currentOrganisationId
  const tickets = isCurrentOrganisation ? ticketState.tickets : []
  const loading = Boolean(organisationId) && (!isCurrentOrganisation || ticketState.loading)
  const [statusFiltro, setStatusFiltro] = useState('Todos')
  const [periodoFiltro, setPeriodoFiltro] = useState('30')
  const [termoBusca, setTermoBusca] = useState('')
  const [showSearchInput, setShowSearchInput] = useState(false)

  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false)

  const [novoAssunto, setNovoAssunto] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('Manutenção Predial')
  const [novoLocal, setNovoLocal] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')

  useEffect(() => {
    let isMounted = true

    if (!organisationId) {
      return undefined
    }

    fetchTickets(organisationId, user?.id, accessType)
      .then((data) => {
        if (isMounted) {
          setTicketState({ organisationId: String(organisationId), tickets: data, loading: false })
        }
      })
      .catch((error) => {
        console.error('Erro ao buscar chamados:', error.message)
        if (isMounted) {
          setTicketState({ organisationId: String(organisationId), tickets: [], loading: false })
          alert(`Erro ao buscar chamados: ${error.message}`)
        }
      })

    return () => {
      isMounted = false
    }
  }, [organisationId, user?.id, accessType])

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!novoAssunto.trim() || !organisationId) return

    const generatedCode = `#CH-${Math.floor(1000 + Math.random() * 9000)}`

    const newTicketData = {
      code: generatedCode,
      assunto: novoAssunto,
      solicitacao: accessType === 'morador' ? 'Morador' : 'Administração',
      categoria: novaCategoria,
      local: novoLocal,
      situacao: 'Em aberto',
      descricao: novaDescricao,
      creator_id: user?.id,
      creator_name: userName,
    }

    try {
      const ticket = await createTicket(organisationId, newTicketData)
      setTicketState((current) => ({
        organisationId: String(organisationId),
        tickets: [ticket, ...(current.organisationId === String(organisationId) ? current.tickets : [])],
        loading: false,
      }))
      setIsNewTicketModalOpen(false)
      setNovoAssunto('')
      setNovoLocal('')
      setNovaDescricao('')
    } catch (error) {
      alert(`Erro ao criar chamado: ${error.message}`)
    }
  }

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTicket || !organisationId) return

    try {
      const updatedTicket = await updateTicketStatus(organisationId, selectedTicket.id, newStatus)
      setTicketState((current) => ({
        organisationId: String(organisationId),
        tickets: (current.organisationId === String(organisationId) ? current.tickets : []).map((ticket) => (
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        )),
        loading: false,
      }))
      setSelectedTicket(null)
    } catch (error) {
      alert(`Erro ao atualizar status: ${error.message}`)
    }
  }

  const ticketsFiltrados = tickets.filter(t => {
    const combinaStatus = statusFiltro === 'Todos' || t.situacao?.toLowerCase() === statusFiltro.toLowerCase()
    const combinaBusca = (t.assunto || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
                          (t.code || '').toLowerCase().includes(termoBusca.toLowerCase())
    return combinaStatus && combinaBusca
  })

  return (
    <div className={styles.pageShell}>
      <Header
        userName={userName}
        accessType={accessType}
        navigationExpanded={isSidebarExpanded}
        onNavigationToggle={setIsSidebarExpanded}
      />

      <div className={styles.pageBody}>
        <button
          type="button"
          className={`${styles.pageOverlay}${isSidebarExpanded ? ` ${styles.overlayVisible}` : ''}`}
          aria-label="Fechar navegação"
          aria-hidden={!isSidebarExpanded}
          tabIndex={isSidebarExpanded ? 0 : -1}
          onClick={() => setIsSidebarExpanded(false)}
        />
        <Sidebar
          expanded={isSidebarExpanded}
          onExpand={() => setIsSidebarExpanded(true)}
          onCollapse={() => setIsSidebarExpanded(false)}
          activeId="tickets"
          userName={userName}
          accessType={accessType}
        />

        <main className={styles.content}>
          
          <PageSubheader
            className={styles.subheader}
            title="Chamados"
            subtitle="Consulte e gerencie chamados abertos pelo responsável ou moradores."
            backLabel="Voltar para Home"
          />

          <div className={styles.contentBody}>
            <div className={styles.heading}>
              <div className={styles.headingActions}>
                {showSearchInput ? (
                  <input
                    type="text"
                    placeholder="Buscar por ID ou assunto..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    autoFocus
                    onBlur={() => !termoBusca && setShowSearchInput(false)}
                    className={styles.searchInput}
                  />
                ) : (
                  <button
                    onClick={() => setShowSearchInput(true)}
                    className={styles.searchButton}
                  >
                    <MagnifyingGlass size={16} weight="bold" />
                    Pesquisar
                  </button>
                )}

                <button
                  onClick={() => setIsNewTicketModalOpen(true)}
                  className={styles.newTicketButton}
                >
                  <Plus size={16} weight="bold" />
                  Novo Chamado
                </button>
              </div>
              <div className={styles.filters}>
                <Select
                  className={styles.statusFilter}
                  ariaLabel="Filtrar por status"
                  value={statusFiltro}
                  onChange={setStatusFiltro}
                  options={[
                    { value: 'Todos', label: 'Status: Todos' },
                    ...['Em aberto', 'Em andamento', 'Resolvido'].map((value) => ({ value, label: value })),
                  ]}
                />
                <Select
                  className={styles.periodFilter}
                  ariaLabel="Filtrar por período"
                  value={periodoFiltro}
                  onChange={setPeriodoFiltro}
                  options={[
                    { value: '30', label: 'Período: Últimos 30 dias' },
                    { value: '60', label: 'Período: Últimos 60 dias' },
                    { value: 'all', label: 'Período: Todo o histórico' },
                  ]}
                />
              </div>
            </div>

            <div className={styles.table}>
              <table className={styles.tableElement}>
                <thead>
                  <tr className={styles.tableHeading}>
                    <th className={styles.tableCell}>ID</th>
                    <th className={styles.tableCell}>ASSUNTO</th>
                    <th className={styles.tableCell}>SOLICITAÇÃO</th>
                    <th className={styles.tableCell}>CATEGORIA</th>
                    <th className={styles.tableCell}>SITUAÇÃO</th>
                    <th className={styles.tableCell}>DATA DE ABERTURA</th>
                    <th className={styles.tableActionCell}>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className={styles.tableEmpty}>
                        Carregando chamados...
                      </td>
                    </tr>
                  ) : ticketsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="7" className={styles.tableEmpty}>
                        Nenhum chamado encontrado.
                      </td>
                    </tr>
                  ) : (
                    ticketsFiltrados.map((ticket) => (
                      <tr key={ticket.id} className={styles.tableRow}>
                        <td className={styles.ticketCode}>{ticket.code}</td>
                        <td className={styles.tableCell}>{ticket.assunto}</td>
                        <td className={styles.tableCell}>{ticket.solicitacao}</td>
                        <td className={styles.tableCell}>
                          <span className={styles.categoryBadge}>
                            {ticket.categoria}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          <span className={`${styles.statusBadge} ${ticket.situacao === 'Em aberto'
                            ? styles.statusOpen
                            : ticket.situacao === 'Em andamento' ? styles.statusInProgress : styles.statusResolved}`}>
                            {ticket.situacao}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className={styles.tableActionCell}>
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            title="Editar/Atender Chamado"
                            className={styles.editButton}
                          >
                            <PencilSimple size={18} weight="regular" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {isNewTicketModalOpen && (
        <div className={styles.overlayLayout}>
          <div className={`${styles.dialog} ${styles.newTicketDialog}`}>
            <div className={styles.newDialogHeader}>
              <div className={styles.dialogHeaderText}>
                <h2 className={styles.newDialogTitle}>
                  Novo Chamado
                </h2>
                <p className={styles.newDialogSubtitle}>
                  Preencha os dados abaixo para registrar uma manutenção ou solicitação no condomínio.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketModalOpen(false)}
                className={styles.newDialogClose}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className={styles.ticketForm}>
              <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>
                  Dados do chamado
                </h3>
                <span className={styles.formHint}>* Campos obrigatórios</span>
              </div>

              <div className={styles.formFields}>
                <div>
                  <label className={styles.fieldLabel}>
                    Assunto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Vazamento na garagem do subsolo 1"
                    value={novoAssunto}
                    onChange={(e) => setNovoAssunto(e.target.value)}
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.fieldGrid}>
                  <div>
                    <span className={styles.fieldLabel}>
                      Categoria *
                    </span>
                    <Select
                      ariaLabel="Categoria"
                      value={novaCategoria}
                      onChange={setNovaCategoria}
                      options={['Manutenção Predial', 'Solicitação', 'Limpeza', 'Barulho']
                        .map((value) => ({ value, label: value }))}
                    />
                  </div>

                  <div>
                    <label className={styles.fieldLabel}>
                      Local da ocorrência *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex.: Bloco A, 3º andar, corredor"
                      value={novoLocal}
                      onChange={(e) => setNovoLocal(e.target.value)}
                      className={styles.textInput}
                    />
                  </div>
                </div>

                <div>
                  <label className={styles.fieldLabel}>
                    Descrição *
                  </label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Descreva o problema ou a solicitação, quando começou e outros detalhes que possam ajudar no atendimento."
                    value={novaDescricao}
                    onChange={(e) => setNovaDescricao(e.target.value)}
                    className={styles.textArea}
                  />
                </div>

                <div>
                  <label className={styles.fieldLabel}>
                    Anexos (opcional)
                  </label>
                  <div className={`${styles.dialogOverlay} ${styles.attachments}`}>
                    <div className={styles.attachmentsContent}>
                      <Paperclip size={20} weight="regular" className={styles.attachmentIcon} />
                      <div>
                        <strong className={styles.attachmentTitle}>
                          Arraste arquivos para cá ou selecione no seu computador
                        </strong>
                        <span className={styles.formHint}>
                          JPG, PNG ou PDF. Até 5 arquivos de 10 MB cada.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.attachmentButton}
                    >
                      Selecionar arquivos
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.formFooter}>
                <span className={styles.formFooterHint}>
                  Após o envio, acompanhe o atendimento na lista de chamados.
                </span>

                <div className={styles.formButtons}>
                  <button
                    type="button"
                    onClick={() => setIsNewTicketModalOpen(false)}
                    className={styles.cancelButton}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className={styles.submitButton}
                  >
                    Enviar chamado
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {selectedTicket && (
        <div className={`${styles.dialogOverlay} ${styles.overlayLayout}`}>
          <div className={`${styles.dialog} ${styles.ticketDetailsDialog}`}>
            <div className={styles.detailsHeader}>
              <h2 className={styles.detailsTitle}>
                Gerenciar Chamado {selectedTicket.code}
              </h2>
              <button
                onClick={() => setSelectedTicket(null)}
                className={styles.detailsClose}
              >
                &times;
              </button>
            </div>

            <p className={styles.detailsLine}>
              <strong>Assunto:</strong> {selectedTicket.assunto}
            </p>
            <p className={styles.detailsLine}>
              <strong>Solicitação:</strong> {selectedTicket.solicitacao}
            </p>
            <p className={styles.detailsCategory}>
              <strong>Categoria:</strong> {selectedTicket.categoria}
            </p>

            <div className={styles.descriptionBox}>
              <strong className={styles.descriptionTitle}>Descrição:</strong>
              <p className={styles.descriptionText}>{selectedTicket.descricao}</p>
            </div>

            <div className={styles.statusLabel}>
              Alterar Situação:
              <Select
                className={styles.statusSelect}
                ariaLabel="Alterar situação"
                value={selectedTicket.situacao}
                onChange={handleUpdateStatus}
                options={['Em aberto', 'Em andamento', 'Resolvido']
                  .map((value) => ({ value, label: value }))}
              />
            </div>

            <div className={styles.detailsActions}>
              <button
                onClick={() => setSelectedTicket(null)}
                className={styles.detailsCloseButton}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}