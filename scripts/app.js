import {
  initSupabase,
  getSupabase,
  resetSupabase,
  testConnection,
} from './supabaseClient.js';
import {
  formatCurrency,
  formatDuration,
  formatDate,
  formatDateTime,
  getWeekStart,
  getWeekEnd,
  formatWeekRange,
  getISODate,
  getISODateTimeLocal,
  groupBy,
  sumBy,
  toCSV,
  downloadFile,
  buildICS,
  parseICS,
  createToast,
  priorityLabel,
  statusLabel,
} from './utils.js';

const STORAGE_KEYS = {
  url: 'meestercrm_supabase_url',
  key: 'meestercrm_supabase_key',
};

const state = {
  supabase: null,
  clients: [],
  timeEntries: [],
  planningEntries: [],
  invoices: [],
  invoiceItems: new Map(),
  tasks: [],
  importedEvents: [],
  activeWeekStart: getWeekStart(new Date()),
  timer: {
    running: false,
    start: null,
    clientId: null,
    description: '',
  },
  timerInterval: null,
  chart: null,
  chartMode: 'revenue',
  invoiceDraftItems: [],
  drawerEntries: [],
};

const elements = {
  navButtons: document.querySelectorAll('.nav-button'),
  views: document.querySelectorAll('.view'),
  connectionIndicator: document.getElementById('connection-indicator'),
  supabaseModal: document.getElementById('supabase-modal'),
  supabaseForm: document.getElementById('supabase-form'),
  supabaseUrl: document.getElementById('supabase-url'),
  supabaseKey: document.getElementById('supabase-key'),
  modalBackdrop: document.getElementById('modal-backdrop'),
  dashboardPeriod: document.getElementById('dashboard-period'),
  revenueTrend: document.getElementById('revenue-trend'),
  hoursTrend: document.getElementById('hours-trend'),
  totalRevenue: document.getElementById('total-revenue'),
  totalHours: document.getElementById('total-hours'),
  revenuePeriodLabel: document.getElementById('revenue-period-label'),
  hoursPeriodLabel: document.getElementById('hours-period-label'),
  openInvoices: document.getElementById('open-invoices'),
  openInvoicesCount: document.getElementById('open-invoices-count'),
  priorityTasks: document.getElementById('priority-tasks'),
  performanceChart: document.getElementById('performance-chart'),
  upcomingEvents: document.getElementById('upcoming-events'),
  criticalTasks: document.getElementById('critical-tasks'),
  toggleChartView: document.getElementById('toggle-chart-view'),
  clientTable: document.getElementById('clients-table'),
  clientsEmpty: document.getElementById('clients-empty'),
  clientSearch: document.getElementById('client-search'),
  timerDisplay: document.getElementById('timer-display'),
  timerClient: document.getElementById('timer-client'),
  timerDescription: document.getElementById('timer-description'),
  startTimer: document.getElementById('start-timer'),
  stopTimer: document.getElementById('stop-timer'),
  resetTimer: document.getElementById('reset-timer'),
  timerSummary: document.getElementById('timer-summary'),
  manualClient: document.getElementById('manual-client'),
  manualForm: document.getElementById('manual-time-form'),
  manualStart: document.getElementById('manual-start'),
  manualEnd: document.getElementById('manual-end'),
  manualDescription: document.getElementById('manual-description'),
  manualBillable: document.getElementById('manual-billable'),
  manualRate: document.getElementById('manual-rate'),
  timeWeek: document.getElementById('time-week'),
  timeEntries: document.getElementById('time-entries'),
  timeEmpty: document.getElementById('time-empty'),
  exportWeekCsv: document.getElementById('export-week-csv'),
  planningForm: document.getElementById('planning-form'),
  planningTitle: document.getElementById('planning-title-input'),
  planningStart: document.getElementById('planning-start'),
  planningEnd: document.getElementById('planning-end'),
  planningLocation: document.getElementById('planning-location'),
  planningLink: document.getElementById('planning-link'),
  planningNotes: document.getElementById('planning-notes'),
  planningWeekLabel: document.getElementById('current-week-label'),
  previousWeek: document.getElementById('previous-week'),
  nextWeek: document.getElementById('next-week'),
  weekGrid: document.getElementById('week-grid'),
  exportIcs: document.getElementById('export-week-ics'),
  importIcs: document.getElementById('import-ics'),
  invoiceTable: document.getElementById('invoice-table'),
  invoiceEmpty: document.getElementById('invoice-empty'),
  invoiceFilter: document.getElementById('invoice-status-filter'),
  invoiceModal: document.getElementById('invoice-modal'),
  invoiceForm: document.getElementById('invoice-form'),
  invoiceId: document.getElementById('invoice-id'),
  invoiceClient: document.getElementById('invoice-client'),
  invoiceNumber: document.getElementById('invoice-number'),
  invoiceIssueDate: document.getElementById('invoice-issue-date'),
  invoiceDueDate: document.getElementById('invoice-due-date'),
  invoiceStatus: document.getElementById('invoice-status'),
  invoiceNotes: document.getElementById('invoice-notes'),
  invoiceTotal: document.getElementById('invoice-total'),
  lineItemsContainer: document.getElementById('line-items-container'),
  lineItemTemplate: document.getElementById('line-item-template'),
  addLineItem: document.getElementById('add-line-item'),
  loadTimeEntries: document.getElementById('load-time-entries'),
  invoiceEmailModal: document.getElementById('invoice-email-modal'),
  invoiceEmailForm: document.getElementById('invoice-email-form'),
  emailInvoiceId: document.getElementById('email-invoice-id'),
  emailRecipient: document.getElementById('email-recipient'),
  emailSubject: document.getElementById('email-subject'),
  emailMessage: document.getElementById('email-message'),
  drawer: document.getElementById('drawer'),
  drawerFilter: document.getElementById('drawer-filter'),
  drawerStart: document.getElementById('drawer-start'),
  drawerEnd: document.getElementById('drawer-end'),
  drawerTable: document.getElementById('drawer-time-entries'),
  taskBoard: document.getElementById('task-board'),
  tasksEmpty: document.getElementById('tasks-empty'),
  taskModal: document.getElementById('task-modal'),
  taskForm: document.getElementById('task-form'),
  taskId: document.getElementById('task-id'),
  taskTitle: document.getElementById('task-title'),
  taskDescription: document.getElementById('task-description'),
  taskDeadline: document.getElementById('task-deadline'),
  taskPriority: document.getElementById('task-priority'),
  taskStatus: document.getElementById('task-status'),
  taskStatusFilter: document.getElementById('task-status-filter'),
  taskPriorityFilter: document.getElementById('task-priority-filter'),
  taskTemplate: document.getElementById('task-card-template'),
  clientModal: document.getElementById('client-modal'),
  clientForm: document.getElementById('client-form'),
  clientId: document.getElementById('client-id'),
  clientModalTitle: document.getElementById('client-modal-title'),
  clientName: document.getElementById('client-name'),
  clientContact: document.getElementById('client-contact'),
  clientEmail: document.getElementById('client-email'),
  clientPhone: document.getElementById('client-phone'),
  clientAddress: document.getElementById('client-address'),
  clientRate: document.getElementById('client-rate'),
  clientNotes: document.getElementById('client-notes'),
  timerSummaryBox: document.getElementById('timer-summary'),
};

const openModalButtons = {
  supabase: document.getElementById('open-supabase-settings'),
  addClient: document.getElementById('add-client'),
  addClientEmpty: document.getElementById('empty-add-client'),
  addTask: document.getElementById('add-task'),
  addTaskEmpty: document.getElementById('empty-add-task'),
  newInvoice: document.getElementById('new-invoice'),
  emptyInvoice: document.getElementById('empty-new-invoice'),
};

const closeButtons = {
  cancelSupabase: document.getElementById('cancel-supabase'),
  cancelClient: document.getElementById('cancel-client'),
  cancelInvoice: document.getElementById('cancel-invoice'),
  cancelTask: document.getElementById('cancel-task'),
  cancelEmail: document.getElementById('cancel-email'),
  closeDrawer: document.getElementById('close-drawer'),
};

const addSelectedTime = document.getElementById('add-selected-time');
const refreshDataButton = document.getElementById('refresh-data');
const startTimerButton = document.getElementById('start-timer');
const stopTimerButton = document.getElementById('stop-timer');
const resetTimerButton = document.getElementById('reset-timer');

init();

function init() {
  attachEventListeners();
  initializeDefaults();
  tryRestoreSupabaseConfig();
}

function attachEventListeners() {
  elements.navButtons.forEach((button) =>
    button.addEventListener('click', () => switchView(button.dataset.target))
  );

  elements.dashboardPeriod?.addEventListener('change', renderDashboard);

  if (elements.toggleChartView) {
    elements.toggleChartView.addEventListener('click', () => {
      state.chartMode = state.chartMode === 'revenue' ? 'hours' : 'revenue';
      renderChart();
      elements.toggleChartView.textContent =
        state.chartMode === 'revenue' ? 'Toon uren' : 'Toon omzet';
    });
  }

  refreshDataButton?.addEventListener('click', () => {
    if (!state.supabase) {
      createToast('Verbind eerst met Supabase.', 'error');
      return;
    }
    loadAllData();
  });

  openModalButtons.supabase?.addEventListener('click', () => openModal(elements.supabaseModal));
  openModalButtons.addClient?.addEventListener('click', () => openClientModal());
  openModalButtons.addClientEmpty?.addEventListener('click', () => openClientModal());
  openModalButtons.addTask?.addEventListener('click', () => openTaskModal());
  openModalButtons.addTaskEmpty?.addEventListener('click', () => openTaskModal());
  openModalButtons.newInvoice?.addEventListener('click', () => openInvoiceModal());
  openModalButtons.emptyInvoice?.addEventListener('click', () => openInvoiceModal());

  closeButtons.cancelSupabase?.addEventListener('click', () => closeModal(elements.supabaseModal));
  closeButtons.cancelClient?.addEventListener('click', () => closeModal(elements.clientModal));
  closeButtons.cancelInvoice?.addEventListener('click', () => closeModal(elements.invoiceModal));
  closeButtons.cancelTask?.addEventListener('click', () => closeModal(elements.taskModal));
  closeButtons.cancelEmail?.addEventListener('click', () => closeModal(elements.invoiceEmailModal));
  closeButtons.closeDrawer?.addEventListener('click', () => toggleDrawer(false));

  document.getElementById('cancel-supabase')?.addEventListener('click', resetSupabaseConfig);

  elements.supabaseForm?.addEventListener('submit', handleSupabaseSubmit);
  elements.clientForm?.addEventListener('submit', handleClientSubmit);
  elements.manualForm?.addEventListener('submit', handleManualTimeSubmit);
  elements.planningForm?.addEventListener('submit', handlePlanningSubmit);
  elements.invoiceForm?.addEventListener('submit', handleInvoiceSubmit);
  elements.invoiceEmailForm?.addEventListener('submit', handleInvoiceEmailSubmit);
  elements.taskForm?.addEventListener('submit', handleTaskSubmit);

  elements.clientSearch?.addEventListener('input', handleClientSearch);
  elements.invoiceFilter?.addEventListener('change', renderInvoices);
  elements.taskStatusFilter?.addEventListener('change', renderTasks);
  elements.taskPriorityFilter?.addEventListener('change', renderTasks);

  elements.timeWeek?.addEventListener('change', handleWeekChange);

  startTimerButton?.addEventListener('click', startTimer);
  stopTimerButton?.addEventListener('click', stopTimer);
  resetTimerButton?.addEventListener('click', resetTimer);

  elements.exportWeekCsv?.addEventListener('click', exportWeekCsv);
  elements.exportIcs?.addEventListener('click', exportWeekIcs);
  elements.importIcs?.addEventListener('change', importIcsFile);
  elements.addLineItem?.addEventListener('click', () => addLineItem());
  elements.loadTimeEntries?.addEventListener('click', handleLoadTimeEntries);
  addSelectedTime?.addEventListener('click', addSelectedTimeEntries);

  elements.clientTable?.addEventListener('click', handleClientTableClick);
  elements.timeEntries?.addEventListener('click', handleTimeEntriesClick);
  elements.weekGrid?.addEventListener('click', handleWeekGridClick);
  elements.invoiceTable?.addEventListener('click', handleInvoiceTableClick);
  elements.taskBoard?.addEventListener('click', handleTaskBoardClick);
  elements.drawerFilter?.addEventListener('submit', handleDrawerFilterSubmit);
}

function initializeDefaults() {
  elements.timeWeek.value = formatWeekInputValue(state.activeWeekStart);
  updatePlanningWeekLabel();
  populateManualNow();
  elements.invoiceIssueDate.value = getISODate(new Date());
  const due = new Date();
  due.setDate(due.getDate() + 14);
  elements.invoiceDueDate.value = getISODate(due);
}

function tryRestoreSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_KEYS.url);
  const key = localStorage.getItem(STORAGE_KEYS.key);
  if (url && key) {
    connectSupabase(url, key);
  } else {
    openModal(elements.supabaseModal);
  }
}

async function connectSupabase(url, key) {
  try {
    state.supabase = initSupabase({ url, key });
    const ok = await testConnection();
    if (!ok) {
      throw new Error('Kan geen verbinding maken met Supabase. Controleer de gegevens.');
    }
    localStorage.setItem(STORAGE_KEYS.url, url);
    localStorage.setItem(STORAGE_KEYS.key, key);
    setConnectionStatus(true);
    closeModal(elements.supabaseModal);
    createToast('Verbonden met Supabase', 'success');
    await loadAllData();
  } catch (error) {
    console.error(error);
    createToast(error.message || 'Kan niet verbinden met Supabase', 'error');
    setConnectionStatus(false);
  }
}

function setConnectionStatus(connected) {
  if (!elements.connectionIndicator) return;
  elements.connectionIndicator.textContent = connected ? 'Verbonden' : 'Niet verbonden';
  elements.connectionIndicator.classList.toggle('status-badge--success', connected);
  elements.connectionIndicator.classList.toggle('status-badge--danger', !connected);
}

function resetSupabaseConfig() {
  resetSupabase();
  state.supabase = null;
  setConnectionStatus(false);
  localStorage.removeItem(STORAGE_KEYS.url);
  localStorage.removeItem(STORAGE_KEYS.key);
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove('hidden');
  elements.modalBackdrop?.classList.remove('hidden');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  const anyOpen = Array.from(document.querySelectorAll('.modal')).some(
    (item) => !item.classList.contains('hidden')
  );
  if (!anyOpen) {
    elements.modalBackdrop?.classList.add('hidden');
  }
}

function formatWeekInputValue(date) {
  const target = new Date(date.valueOf());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const weekNumber =
    1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  const weekStr = String(weekNumber).padStart(2, '0');
  return `${target.getFullYear()}-W${weekStr}`;
}

function updatePlanningWeekLabel() {
  if (!elements.planningWeekLabel) return;
  elements.planningWeekLabel.textContent = formatWeekRange(state.activeWeekStart);
}

function populateManualNow() {
  const now = new Date();
  const earlier = new Date(now);
  earlier.setHours(now.getHours() - 1);
  elements.manualStart.value = getISODateTimeLocal(earlier);
  elements.manualEnd.value = getISODateTimeLocal(now);
}

function updateTimerClients() {
  const options = state.clients
    .map((client) => `<option value="${client.id}">${client.name}</option>`)
    .join('');
  elements.timerClient.innerHTML = `<option value="">Selecteer klant</option>${options}`;
  elements.manualClient.innerHTML = `<option value="">Selecteer klant</option>${options}`;
  elements.invoiceClient.innerHTML = `<option value="">Selecteer klant</option>${options}`;
}

async function loadAllData() {
  if (!state.supabase) return;
  setLoading(true);
  try {
    await Promise.all([
      loadClients(),
      loadTimeEntries(),
      loadPlanningEntries(),
      loadInvoices(),
      loadTasks(),
    ]);
    renderClients();
    renderTimeEntries();
    renderPlanning();
    renderInvoices();
    renderTasks();
    renderDashboard();
    updateTimerClients();
  } catch (error) {
    console.error(error);
    createToast('Kon gegevens niet laden', 'error');
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  if (!refreshDataButton) return;
  refreshDataButton.disabled = isLoading;
  refreshDataButton.textContent = isLoading ? 'Laden…' : 'Gegevens verversen';
}

async function loadClients() {
  const { data, error } = await getSupabase()
    .from('clients')
    .select('*')
    .order('name');
  if (error) throw error;
  state.clients = data || [];
}

async function loadTimeEntries() {
  const since = new Date();
  since.setDate(since.getDate() - 365);
  const { data, error } = await getSupabase()
    .from('time_entries')
    .select('*, client:clients(id, name, hourly_rate)')
    .gte('start_time', since.toISOString())
    .order('start_time', { ascending: false });
  if (error) throw error;
  state.timeEntries = data || [];
}

async function loadPlanningEntries() {
  const start = new Date(state.activeWeekStart);
  start.setDate(start.getDate() - 14);
  const end = new Date(state.activeWeekStart);
  end.setDate(end.getDate() + 21);
  const { data, error } = await getSupabase()
    .from('planning_entries')
    .select('*')
    .gte('start_time', start.toISOString())
    .lte('end_time', end.toISOString())
    .order('start_time');
  if (error) throw error;
  state.planningEntries = data || [];
}

async function loadInvoices() {
  const since = new Date();
  since.setDate(since.getDate() - 540);
  const { data, error } = await getSupabase()
    .from('invoices')
    .select('*, client:clients(id, name), items:invoice_items(*)')
    .gte('issue_date', since.toISOString())
    .order('issue_date', { ascending: false });
  if (error) throw error;
  state.invoices = (data || []).map((invoice) => ({
    ...invoice,
    items: invoice.items || [],
  }));
  state.invoiceItems.clear();
  state.invoices.forEach((invoice) => state.invoiceItems.set(invoice.id, invoice.items));
}

async function loadTasks() {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('*')
    .order('deadline', { ascending: true });
  if (error) throw error;
  state.tasks = data || [];
}

function handleSupabaseSubmit(event) {
  event.preventDefault();
  const url = elements.supabaseUrl.value.trim();
  const key = elements.supabaseKey.value.trim();
  if (!url || !key) {
    createToast('Vul zowel URL als sleutel in', 'error');
    return;
  }
  connectSupabase(url, key);
}

function switchView(target) {
  elements.navButtons.forEach((button) => button.classList.toggle('active', button.dataset.target === target));
  elements.views.forEach((view) => view.classList.toggle('active', view.id === target));
}

function renderClients() {
  const query = (elements.clientSearch?.value || '').toLowerCase();
  const clients = state.clients.filter((client) =>
    [client.name, client.contact_name, client.email]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(query))
  );
  elements.clientsEmpty?.classList.toggle('hidden', clients.length > 0);
  elements.clientTable.innerHTML = clients
    .map((client) => {
      const lastEntry = state.timeEntries.find((entry) => entry.client_id === client.id);
      return `
        <tr data-id="${client.id}">
          <td>
            <strong>${client.name}</strong>
            ${client.contact_name ? `<div class="muted">${client.contact_name}</div>` : ''}
          </td>
          <td>
            ${client.email ? `<div>${client.email}</div>` : ''}
            ${client.phone ? `<div class="muted">${client.phone}</div>` : ''}
          </td>
          <td>${client.hourly_rate ? formatCurrency(client.hourly_rate) : '—'}</td>
          <td>${lastEntry ? formatDate(lastEntry.start_time) : 'Nog geen uren'}</td>
          <td class="table-actions">
            <button class="ghost-button" data-action="edit">Wijzig</button>
            <button class="ghost-button" data-action="delete">Verwijder</button>
          </td>
        </tr>`;
    })
    .join('');
}

function handleClientSearch() {
  renderClients();
}

function openClientModal(client = null) {
  elements.clientForm.reset();
  elements.clientId.value = client?.id || '';
  elements.clientModalTitle.textContent = client ? 'Klant bewerken' : 'Nieuwe klant';
  if (client) {
    elements.clientName.value = client.name || '';
    elements.clientContact.value = client.contact_name || '';
    elements.clientEmail.value = client.email || '';
    elements.clientPhone.value = client.phone || '';
    elements.clientAddress.value = client.address || '';
    elements.clientRate.value = client.hourly_rate || '';
    elements.clientNotes.value = client.notes || '';
  }
  openModal(elements.clientModal);
}

async function handleClientSubmit(event) {
  event.preventDefault();
  if (!state.supabase) return;
  const payload = {
    name: elements.clientName.value.trim(),
    contact_name: elements.clientContact.value.trim() || null,
    email: elements.clientEmail.value.trim() || null,
    phone: elements.clientPhone.value.trim() || null,
    address: elements.clientAddress.value.trim() || null,
    hourly_rate: elements.clientRate.value ? Number(elements.clientRate.value) : null,
    notes: elements.clientNotes.value.trim() || null,
  };
  const id = elements.clientId.value;
  try {
    if (id) {
      const { error } = await getSupabase().from('clients').update(payload).eq('id', id);
      if (error) throw error;
      createToast('Klant bijgewerkt');
    } else {
      const { error } = await getSupabase().from('clients').insert(payload);
      if (error) throw error;
      createToast('Klant aangemaakt');
    }
    closeModal(elements.clientModal);
    await loadClients();
    renderClients();
    updateTimerClients();
  } catch (error) {
    console.error(error);
    createToast('Opslaan van klant mislukt', 'error');
  }
}

async function handleClientTableClick(event) {
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  const client = state.clients.find((c) => c.id === row.dataset.id);
  if (!client) return;
  if (event.target.matches('[data-action="edit"]')) {
    openClientModal(client);
  }
  if (event.target.matches('[data-action="delete"]')) {
    if (confirm('Weet je zeker dat je deze klant wilt verwijderen?')) {
      try {
        const { error } = await getSupabase().from('clients').delete().eq('id', client.id);
        if (error) throw error;
        createToast('Klant verwijderd');
        await loadClients();
        renderClients();
        updateTimerClients();
      } catch (error) {
        console.error(error);
        createToast('Verwijderen mislukt', 'error');
      }
    }
  }
}

function startTimer() {
  if (state.timer.running) return;
  const clientId = elements.timerClient.value;
  if (!clientId) {
    createToast('Selecteer eerst een klant', 'error');
    return;
  }
  state.timer = {
    running: true,
    start: new Date(),
    clientId,
    description: elements.timerDescription.value.trim(),
  };
  startTimerButton.disabled = true;
  stopTimerButton.disabled = false;
  resetTimerButton.disabled = false;
  elements.timerSummaryBox.classList.add('hidden');
  state.timerInterval = setInterval(updateTimerDisplay, 1000);
  updateTimerDisplay();
}

function stopTimer() {
  if (!state.timer.running) return;
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  const end = new Date();
  const duration = Math.round((end - state.timer.start) / 1000);
  saveTimerEntry({
    clientId: state.timer.clientId,
    description: state.timer.description,
    start: state.timer.start,
    end,
    duration,
  });
  state.timer.running = false;
  startTimerButton.disabled = false;
  stopTimerButton.disabled = true;
  resetTimerButton.disabled = false;
  elements.timerSummaryBox.textContent = `Gelogd: ${formatDuration(duration)} voor ${getClientName(
    state.timer.clientId
  )}`;
  elements.timerSummaryBox.classList.remove('hidden');
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.timer = {
    running: false,
    start: null,
    clientId: null,
    description: '',
  };
  elements.timerDescription.value = '';
  elements.timerClient.value = '';
  elements.timerDisplay.textContent = '00:00:00';
  startTimerButton.disabled = false;
  stopTimerButton.disabled = true;
  resetTimerButton.disabled = true;
}

function updateTimerDisplay() {
  if (!state.timer.running || !state.timer.start) return;
  const now = new Date();
  const seconds = Math.round((now - state.timer.start) / 1000);
  elements.timerDisplay.textContent = formatDuration(seconds);
}

async function saveTimerEntry({ clientId, description, start, end, duration }) {
  try {
    const client = state.clients.find((c) => c.id === clientId);
    const payload = {
      client_id: clientId,
      description: description || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_seconds: duration,
      billable: true,
      hourly_rate: client?.hourly_rate || null,
    };
    const { error } = await getSupabase().from('time_entries').insert(payload);
    if (error) throw error;
    createToast('Tijd geboekt');
    await loadTimeEntries();
    renderTimeEntries();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Timer kon niet worden opgeslagen', 'error');
  }
}

async function handleManualTimeSubmit(event) {
  event.preventDefault();
  const clientId = elements.manualClient.value;
  const start = elements.manualStart.value;
  const end = elements.manualEnd.value;
  if (!clientId || !start || !end) {
    createToast('Vul klant, start en eindtijd in', 'error');
    return;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (endDate <= startDate) {
    createToast('Eindtijd moet na starttijd liggen', 'error');
    return;
  }
  const duration = Math.round((endDate - startDate) / 1000);
  try {
    const payload = {
      client_id: clientId,
      description: elements.manualDescription.value.trim() || null,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      duration_seconds: duration,
      billable: elements.manualBillable.value === 'true',
      hourly_rate: elements.manualRate.value ? Number(elements.manualRate.value) : null,
    };
    const { error } = await getSupabase().from('time_entries').insert(payload);
    if (error) throw error;
    createToast('Uren geregistreerd');
    elements.manualForm.reset();
    populateManualNow();
    await loadTimeEntries();
    renderTimeEntries();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Kon uren niet opslaan', 'error');
  }
}

function getClientName(id) {
  return state.clients.find((client) => client.id === id)?.name || 'Onbekende klant';
}

function handleWeekChange(event) {
  const value = event.target.value;
  if (!value) return;
  const [year, week] = value.split('-W');
  const simple = new Date(year, 0, 1 + (Number(week) - 1) * 7);
  const dow = simple.getDay();
  const weekStart = new Date(simple);
  if (dow <= 4) {
    weekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    weekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  weekStart.setHours(0, 0, 0, 0);
  state.activeWeekStart = weekStart;
  updatePlanningWeekLabel();
  renderTimeEntries();
  renderPlanning();
  renderDashboard();
}

function renderTimeEntries() {
  const start = getWeekStart(state.activeWeekStart);
  const end = getWeekEnd(state.activeWeekStart);
  const entries = state.timeEntries.filter((entry) => {
    const date = new Date(entry.start_time);
    return date >= start && date <= end;
  });
  elements.timeEmpty?.classList.toggle('hidden', entries.length > 0);
  elements.timeEntries.innerHTML = entries
    .map((entry) => `
      <tr data-id="${entry.id}">
        <td>${formatDate(entry.start_time)}</td>
        <td>${entry.client?.name || getClientName(entry.client_id)}</td>
        <td>${entry.description || '—'}</td>
        <td>${formatDuration(entry.duration_seconds)}</td>
        <td>${entry.billable ? 'Ja' : 'Nee'}</td>
        <td class="table-actions">
          <button class="ghost-button" data-action="delete">Verwijder</button>
        </td>
      </tr>`)
    .join('');
}

async function handleTimeEntriesClick(event) {
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  if (event.target.matches('[data-action="delete"]')) {
    if (!confirm('Verwijder deze tijdregistratie?')) return;
    try {
      const { error } = await getSupabase().from('time_entries').delete().eq('id', row.dataset.id);
      if (error) throw error;
      createToast('Boeking verwijderd');
      await loadTimeEntries();
      renderTimeEntries();
      renderDashboard();
    } catch (error) {
      console.error(error);
      createToast('Verwijderen mislukt', 'error');
    }
  }
}

function exportWeekCsv() {
  const start = getWeekStart(state.activeWeekStart);
  const end = getWeekEnd(state.activeWeekStart);
  const entries = state.timeEntries.filter((entry) => {
    const date = new Date(entry.start_time);
    return date >= start && date <= end;
  });
  const rows = [
    ['Datum', 'Klant', 'Omschrijving', 'Start', 'Einde', 'Duur (sec)', 'Billable'],
    ...entries.map((entry) => [
      formatDate(entry.start_time),
      entry.client?.name || getClientName(entry.client_id),
      entry.description || '',
      formatDateTime(entry.start_time),
      formatDateTime(entry.end_time),
      entry.duration_seconds,
      entry.billable ? 'Ja' : 'Nee',
    ]),
  ];
  const csv = toCSV(rows);
  downloadFile(`uren-${getISODate(start)}.csv`, csv, 'text/csv');
}

async function handlePlanningSubmit(event) {
  event.preventDefault();
  const payload = {
    title: elements.planningTitle.value.trim(),
    start_time: new Date(elements.planningStart.value).toISOString(),
    end_time: new Date(elements.planningEnd.value).toISOString(),
    location: elements.planningLocation.value.trim() || null,
    external_url: elements.planningLink.value.trim() || null,
    notes: elements.planningNotes.value.trim() || null,
  };
  if (!payload.title || !payload.start_time || !payload.end_time) {
    createToast('Vul titel en tijden in', 'error');
    return;
  }
  try {
    const { error } = await getSupabase().from('planning_entries').insert(payload);
    if (error) throw error;
    createToast('Planning toegevoegd');
    elements.planningForm.reset();
    await loadPlanningEntries();
    renderPlanning();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Kon planning niet opslaan', 'error');
  }
}

function renderPlanning() {
  updatePlanningWeekLabel();
  const start = getWeekStart(state.activeWeekStart);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
  const events = state.planningEntries.filter((entry) => {
    const date = new Date(entry.start_time);
    return date >= getWeekStart(state.activeWeekStart) && date <= getWeekEnd(state.activeWeekStart);
  });
  elements.weekGrid.innerHTML = days
    .map((day) => {
      const dayEvents = events.filter((event) => {
        const startDate = new Date(event.start_time);
        return startDate.getDate() === day.getDate() && startDate.getMonth() === day.getMonth();
      });
      const imported = state.importedEvents.filter((event) => {
        const startDate = new Date(event.start);
        return startDate >= day && startDate < new Date(day.getTime() + 86400000);
      });
      const allEvents = [...dayEvents, ...imported];
      const eventItems = allEvents
        .map((event) => {
          const startTime = event.start_time || event.start;
          const endTime = event.end_time || event.end;
          const isImported = Boolean(event.source === 'import');
          return `
            <li data-id="${event.id || ''}" data-imported="${isImported}">
              <strong>${event.title || 'Zonder titel'}</strong>
              <span>${formatDateTime(startTime)} – ${formatDateTime(endTime)}</span>
              ${event.location ? `<span>📍 ${event.location}</span>` : ''}
              ${event.external_url || event.url ? `<span>🔗 <a href="${
                event.external_url || event.url
              }" target="_blank">Link</a></span>` : ''}
              ${!isImported
                ? '<div class="event-actions"><button class="ghost-button" data-action="remove">Verwijder</button></div>'
                : ''}
            </li>`;
        })
        .join('');
      return `
        <div class="week-column" data-date="${day.toISOString()}">
          <header>
            <div>${day.toLocaleDateString('nl-NL', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })}</div>
            <span>${allEvents.length}</span>
          </header>
          <ul>${eventItems || '<li>Geen afspraken</li>'}</ul>
        </div>`;
    })
    .join('');
}

async function handleWeekGridClick(event) {
  if (!event.target.matches('[data-action="remove"]')) return;
  const item = event.target.closest('li[data-id]');
  if (!item) return;
  const id = item.dataset.id;
  if (!id) return;
  if (!confirm('Verwijder deze planning?')) return;
  try {
    const { error } = await getSupabase().from('planning_entries').delete().eq('id', id);
    if (error) throw error;
    createToast('Planning verwijderd');
    await loadPlanningEntries();
    renderPlanning();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Verwijderen mislukt', 'error');
  }
}

function exportWeekIcs() {
  const start = getWeekStart(state.activeWeekStart);
  const end = getWeekEnd(state.activeWeekStart);
  const events = state.planningEntries
    .filter((entry) => {
      const date = new Date(entry.start_time);
      return date >= start && date <= end;
    })
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      start: entry.start_time,
      end: entry.end_time,
      description: entry.notes,
      location: entry.location,
      url: entry.external_url,
    }));
  if (!events.length) {
    createToast('Geen events om te exporteren', 'error');
    return;
  }
  const ics = buildICS(events);
  downloadFile(`planning-${getISODate(start)}.ics`, ics, 'text/calendar');
  createToast('ICS-bestand aangemaakt');
}

async function importIcsFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const events = parseICS(text);
  if (!events.length) {
    createToast('Geen agenda-items gevonden in bestand', 'error');
    return;
  }
  const payloads = events
    .filter((event) => event.start)
    .map((event) => ({
      title: event.title || 'Agendaitem',
      start_time: new Date(event.start).toISOString(),
      end_time: event.end ? new Date(event.end).toISOString() : new Date(event.start).toISOString(),
      location: event.location || null,
      notes: event.description || null,
      external_url: event.url || null,
      source: 'import',
    }));
  try {
    const { error } = await getSupabase().from('planning_entries').insert(payloads);
    if (error) throw error;
    createToast(`${payloads.length} agenda-items geïmporteerd`);
    await loadPlanningEntries();
    renderPlanning();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Importeren mislukt', 'error');
  }
}

function handleLoadTimeEntries() {
  if (!elements.invoiceClient.value) {
    createToast('Kies eerst een klant', 'error');
    return;
  }
  toggleDrawer(true);
}

function toggleDrawer(open) {
  elements.drawer.classList.toggle('hidden', !open);
  elements.modalBackdrop?.classList.toggle('hidden', !open);
}

async function handleDrawerFilterSubmit(event) {
  event.preventDefault();
  const clientId = elements.invoiceClient.value;
  if (!clientId) {
    createToast('Kies eerst een klant', 'error');
    return;
  }
  const start = elements.drawerStart.value ? new Date(elements.drawerStart.value) : null;
  const end = elements.drawerEnd.value ? new Date(elements.drawerEnd.value) : null;
  let query = getSupabase()
    .from('time_entries')
    .select('*')
    .eq('client_id', clientId)
    .is('synced_invoice_id', null)
    .order('start_time', { ascending: false });
  if (start) query = query.gte('start_time', start.toISOString());
  if (end) query = query.lte('end_time', end.toISOString());
  try {
    const { data, error } = await query;
    if (error) throw error;
    state.drawerEntries = data || [];
    renderDrawerEntries();
  } catch (error) {
    console.error(error);
    createToast('Kon uren niet ophalen', 'error');
  }
}

function renderDrawerEntries() {
  elements.drawerTable.innerHTML = state.drawerEntries
    .map(
      (entry) => `
        <tr>
          <td><input type="checkbox" value="${entry.id}" /></td>
          <td>${formatDate(entry.start_time)}</td>
          <td>${entry.description || '—'}</td>
          <td>${formatDuration(entry.duration_seconds)}</td>
        </tr>`
    )
    .join('');
}

function addSelectedTimeEntries() {
  const selected = Array.from(elements.drawerTable.querySelectorAll('input[type="checkbox"]:checked'));
  if (!selected.length) {
    createToast('Selecteer minimaal één urenregel', 'error');
    return;
  }
  const entries = selected
    .map((input) => state.drawerEntries.find((entry) => entry.id === input.value))
    .filter(Boolean);
  entries.forEach((entry) => {
    addLineItem({
      description: entry.description || `Uren ${formatDate(entry.start_time)}`,
      quantity: Number((entry.duration_seconds / 3600).toFixed(2)),
      unit_price: entry.hourly_rate || getClientDefaultRate(entry.client_id),
      time_entry_id: entry.id,
    });
  });
  toggleDrawer(false);
}

function addLineItem(data = {}) {
  const template = elements.lineItemTemplate.content.cloneNode(true);
  const lineItem = template.querySelector('.line-item');
  lineItem.querySelector('[data-field="description"]').value = data.description || '';
  lineItem.querySelector('[data-field="quantity"]').value = data.quantity ?? 1;
  lineItem.querySelector('[data-field="unit_price"]').value = data.unit_price ?? '';
  lineItem.querySelector('[data-field="time_entry_id"]').value = data.time_entry_id || '';
  updateLineItemAmount(lineItem);
  lineItem.addEventListener('input', () => updateLineItemAmount(lineItem));
  lineItem.querySelector('[data-action="remove"]').addEventListener('click', () => {
    lineItem.remove();
    updateInvoiceSummary();
  });
  elements.lineItemsContainer.appendChild(lineItem);
  updateInvoiceSummary();
}

function updateLineItemAmount(lineItem) {
  const quantity = Number(lineItem.querySelector('[data-field="quantity"]').value) || 0;
  const unitPrice = Number(lineItem.querySelector('[data-field="unit_price"]').value) || 0;
  const amount = quantity * unitPrice;
  lineItem.querySelector('[data-field="amount"]').value = formatCurrency(amount);
  updateInvoiceSummary();
}

function updateInvoiceSummary() {
  const items = Array.from(elements.lineItemsContainer.querySelectorAll('.line-item'));
  const total = items.reduce((sum, item) => {
    const quantity = Number(item.querySelector('[data-field="quantity"]').value) || 0;
    const unitPrice = Number(item.querySelector('[data-field="unit_price"]').value) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  elements.invoiceTotal.textContent = formatCurrency(total);
}

function getClientDefaultRate(clientId) {
  return state.clients.find((client) => client.id === clientId)?.hourly_rate || 0;
}

async function handleInvoiceSubmit(event) {
  event.preventDefault();
  const items = Array.from(elements.lineItemsContainer.querySelectorAll('.line-item'));
  if (!items.length) {
    createToast('Voeg minimaal één factuurregel toe', 'error');
    return;
  }
  const total = items.reduce((sum, item) => {
    const quantity = Number(item.querySelector('[data-field="quantity"]').value) || 0;
    const unitPrice = Number(item.querySelector('[data-field="unit_price"]').value) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const invoiceId = elements.invoiceId.value;
  const payload = {
    client_id: elements.invoiceClient.value,
    invoice_number: elements.invoiceNumber.value.trim(),
    issue_date: elements.invoiceIssueDate.value,
    due_date: elements.invoiceDueDate.value,
    status: elements.invoiceStatus.value,
    notes: elements.invoiceNotes.value.trim() || null,
    total_amount: total,
  };
  try {
    let id = invoiceId;
    if (invoiceId) {
      const { error } = await getSupabase().from('invoices').update(payload).eq('id', invoiceId);
      if (error) throw error;
      const { error: deleteError } = await getSupabase().from('invoice_items').delete().eq('invoice_id', invoiceId);
      if (deleteError) throw deleteError;
    } else {
      const { data, error } = await getSupabase().from('invoices').insert(payload).select('id').single();
      if (error) throw error;
      id = data.id;
    }
    const itemPayloads = items.map((item) => ({
      invoice_id: id,
      description: item.querySelector('[data-field="description"]').value,
      quantity: Number(item.querySelector('[data-field="quantity"]').value) || 0,
      unit_price: Number(item.querySelector('[data-field="unit_price"]').value) || 0,
      time_entry_id: item.querySelector('[data-field="time_entry_id"]').value || null,
    }));
    const { error: itemsError } = await getSupabase().from('invoice_items').insert(itemPayloads);
    if (itemsError) throw itemsError;
    createToast('Factuur opgeslagen');
    closeModal(elements.invoiceModal);
    await loadInvoices();
    renderInvoices();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Opslaan van factuur mislukt', 'error');
  }
}

function openInvoiceModal(invoice = null) {
  elements.invoiceForm.reset();
  elements.lineItemsContainer.innerHTML = '';
  elements.invoiceId.value = invoice?.id || '';
  elements.invoiceModal.querySelector('#invoice-modal-title').textContent = invoice
    ? 'Factuur bewerken'
    : 'Nieuwe factuur';
  elements.invoiceClient.value = invoice?.client_id || '';
  elements.invoiceNumber.value = invoice?.invoice_number || generateInvoiceNumber();
  elements.invoiceIssueDate.value = invoice?.issue_date?.slice(0, 10) || getISODate(new Date());
  elements.invoiceDueDate.value = invoice?.due_date?.slice(0, 10) || elements.invoiceDueDate.value;
  elements.invoiceStatus.value = invoice?.status || 'concept';
  elements.invoiceNotes.value = invoice?.notes || '';
  (invoice?.items || []).forEach((item) =>
    addLineItem({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      time_entry_id: item.time_entry_id,
    })
  );
  updateInvoiceSummary();
  openModal(elements.invoiceModal);
}

function generateInvoiceNumber() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`;
}

function renderInvoices() {
  const filter = elements.invoiceFilter.value;
  const invoices = state.invoices.filter((invoice) => (filter === 'all' ? true : invoice.status === filter));
  elements.invoiceEmpty?.classList.toggle('hidden', invoices.length > 0);
  elements.invoiceTable.innerHTML = invoices
    .map((invoice) => `
      <tr data-id="${invoice.id}">
        <td>${invoice.invoice_number}</td>
        <td>${invoice.client?.name || getClientName(invoice.client_id)}</td>
        <td>${invoice.issue_date ? formatDate(invoice.issue_date) : '—'}</td>
        <td>${invoice.due_date ? formatDate(invoice.due_date) : '—'}</td>
        <td>${formatCurrency(invoice.total_amount || 0)}</td>
        <td><span class="badge-status ${invoice.status}">${statusLabel(invoice.status)}</span></td>
        <td class="table-actions">
          <button class="ghost-button" data-action="edit">Wijzig</button>
          <button class="ghost-button" data-action="pdf">PDF</button>
          <button class="ghost-button" data-action="email">E-mail</button>
          <button class="ghost-button" data-action="delete">Verwijder</button>
        </td>
      </tr>`)
    .join('');
}

async function handleInvoiceTableClick(event) {
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  const invoice = state.invoices.find((inv) => inv.id === row.dataset.id);
  if (!invoice) return;
  if (event.target.matches('[data-action="edit"]')) {
    openInvoiceModal(invoice);
  }
  if (event.target.matches('[data-action="pdf"]')) {
    generateInvoicePdf(invoice.id);
  }
  if (event.target.matches('[data-action="email"]')) {
    openInvoiceEmailModal(invoice);
  }
  if (event.target.matches('[data-action="delete"]')) {
    if (!confirm('Verwijder deze factuur?')) return;
    try {
      const { error } = await getSupabase().from('invoices').delete().eq('id', invoice.id);
      if (error) throw error;
      const { error: itemsError } = await getSupabase().from('invoice_items').delete().eq('invoice_id', invoice.id);
      if (itemsError) throw itemsError;
      createToast('Factuur verwijderd');
      await loadInvoices();
      renderInvoices();
      renderDashboard();
    } catch (error) {
      console.error(error);
      createToast('Verwijderen mislukt', 'error');
    }
  }
}

async function generateInvoicePdf(invoiceId) {
  try {
    const { data, error } = await getSupabase()
      .from('invoices')
      .select('*, client:clients(*), items:invoice_items(*)')
      .eq('id', invoiceId)
      .single();
    if (error) throw error;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const left = 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Factuur', left, 24);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Factuurnummer: ${data.invoice_number}`, left, 36);
    doc.text(`Factuurdatum: ${formatDate(data.issue_date)}`, left, 44);
    doc.text(`Vervaldatum: ${formatDate(data.due_date)}`, left, 52);

    doc.text('Factuur voor:', left, 68);
    doc.text(data.client?.name || 'Onbekende klant', left, 76);
    if (data.client?.address) {
      const lines = data.client.address.split('\n');
      lines.forEach((line, index) => doc.text(line, left, 84 + index * 8));
    }

    const startY = 110;
    doc.setFillColor(240);
    doc.rect(left, startY, 170, 8, 'F');
    doc.text('Omschrijving', left + 2, startY + 6);
    doc.text('Aantal', left + 90, startY + 6);
    doc.text('Tarief', left + 120, startY + 6);
    doc.text('Totaal', left + 150, startY + 6);

    let currentY = startY + 14;
    data.items.forEach((item) => {
      const total = (item.quantity || 0) * (item.unit_price || 0);
      doc.text(item.description || '—', left + 2, currentY);
      doc.text(String(item.quantity ?? 0), left + 90, currentY);
      doc.text(formatCurrency(item.unit_price || 0), left + 120, currentY);
      doc.text(formatCurrency(total), left + 150, currentY);
      currentY += 8;
    });

    doc.setFont('helvetica', 'bold');
    doc.text('Totaal', left + 120, currentY + 6);
    doc.text(formatCurrency(data.total_amount || 0), left + 150, currentY + 6);

    if (data.notes) {
      doc.setFont('helvetica', 'normal');
      doc.text('Opmerkingen:', left, currentY + 18);
      const lines = doc.splitTextToSize(data.notes, 160);
      doc.text(lines, left, currentY + 26);
    }

    const pdfBlob = doc.output('blob');
    await uploadInvoicePdf(invoiceId, pdfBlob);
    downloadFile(`factuur-${data.invoice_number}.pdf`, pdfBlob, 'application/pdf');
    createToast('Factuur PDF aangemaakt');
  } catch (error) {
    console.error(error);
    createToast('Kon factuur niet genereren', 'error');
  }
}

async function uploadInvoicePdf(invoiceId, blob) {
  try {
    const path = `${invoiceId}/factuur.pdf`;
    const { error } = await getSupabase().storage.from('invoices').upload(path, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf',
    });
    if (error) throw error;
    await getSupabase().from('invoices').update({ pdf_path: path }).eq('id', invoiceId);
  } catch (error) {
    console.error(error);
    createToast('Upload naar opslag mislukt', 'error');
  }
}

function openInvoiceEmailModal(invoice) {
  elements.emailInvoiceId.value = invoice.id;
  const client = state.clients.find((c) => c.id === invoice.client_id);
  elements.emailRecipient.value = client?.email || '';
  elements.emailSubject.value = `Factuur ${invoice.invoice_number}`;
  elements.emailMessage.value = `Beste ${client?.contact_name || client?.name || ''},\n\nIn de bijlage vind je factuur ${
    invoice.invoice_number
  }. Laat het weten als er vragen zijn.\n\nMet vriendelijke groet,\n`;
  openModal(elements.invoiceEmailModal);
}

async function handleInvoiceEmailSubmit(event) {
  event.preventDefault();
  const invoiceId = elements.emailInvoiceId.value;
  const recipient = elements.emailRecipient.value.trim();
  if (!recipient) {
    createToast('Vul een e-mailadres in', 'error');
    return;
  }
  try {
    const { error } = await getSupabase().functions.invoke('send-invoice', {
      body: {
        invoiceId,
        to: recipient,
        subject: elements.emailSubject.value.trim(),
        message: elements.emailMessage.value.trim(),
      },
    });
    if (error) throw error;
    createToast('Factuur verzonden');
    closeModal(elements.invoiceEmailModal);
    await loadInvoices();
    renderInvoices();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Versturen via e-mail mislukt', 'error');
  }
}

function openTaskModal(task = null) {
  elements.taskForm.reset();
  elements.taskId.value = task?.id || '';
  elements.taskModal.querySelector('#task-modal-title').textContent = task
    ? 'Taak bewerken'
    : 'Nieuwe taak';
  elements.taskTitle.value = task?.title || '';
  elements.taskDescription.value = task?.description || '';
  elements.taskDeadline.value = task?.deadline?.slice(0, 10) || '';
  elements.taskPriority.value = task?.priority || 'high';
  elements.taskStatus.value = task?.status || 'open';
  openModal(elements.taskModal);
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  const payload = {
    title: elements.taskTitle.value.trim(),
    description: elements.taskDescription.value.trim() || null,
    deadline: elements.taskDeadline.value || null,
    priority: elements.taskPriority.value,
    status: elements.taskStatus.value,
  };
  if (!payload.title) {
    createToast('Vul een titel in', 'error');
    return;
  }
  const id = elements.taskId.value;
  try {
    if (id) {
      const { error } = await getSupabase().from('tasks').update(payload).eq('id', id);
      if (error) throw error;
      createToast('Taak bijgewerkt');
    } else {
      const { error } = await getSupabase().from('tasks').insert(payload);
      if (error) throw error;
      createToast('Taak aangemaakt');
    }
    closeModal(elements.taskModal);
    await loadTasks();
    renderTasks();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Opslaan van taak mislukt', 'error');
  }
}

function renderTasks() {
  const statusFilter = elements.taskStatusFilter.value;
  const priorityFilter = elements.taskPriorityFilter.value;
  const tasks = state.tasks.filter((task) => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });
  elements.tasksEmpty?.classList.toggle('hidden', tasks.length > 0);
  const template = elements.taskTemplate;
  elements.taskBoard.innerHTML = '';
  tasks
    .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0))
    .forEach((task) => {
      const node = template.content.cloneNode(true);
      const card = node.querySelector('.task-card');
      card.dataset.id = task.id;
      card.querySelector('h4').textContent = task.title;
      card.querySelector('.description').textContent = task.description || 'Geen beschrijving';
      const badge = card.querySelector('.badge');
      badge.textContent = priorityLabel(task.priority);
      badge.classList.add(`badge-${task.priority}`);
      const meta = card.querySelector('.meta');
      const deadline = task.deadline ? `⏰ ${formatDate(task.deadline)}` : 'Geen deadline';
      meta.textContent = `${deadline} • ${statusLabel(task.status)}`;
      if (task.status === 'done') {
        card.classList.add('task-done');
      }
      elements.taskBoard.appendChild(node);
    });
}

async function handleTaskBoardClick(event) {
  const card = event.target.closest('.task-card');
  if (!card) return;
  const id = card.dataset.id;
  const task = state.tasks.find((t) => t.id === id);
  if (!task) return;
  if (event.target.matches('[data-action="edit"]')) {
    openTaskModal(task);
  }
  if (event.target.matches('[data-action="delete"]')) {
    if (!confirm('Taak verwijderen?')) return;
    try {
      const { error } = await getSupabase().from('tasks').delete().eq('id', id);
      if (error) throw error;
      createToast('Taak verwijderd');
      await loadTasks();
      renderTasks();
      renderDashboard();
    } catch (error) {
      console.error(error);
      createToast('Verwijderen mislukt', 'error');
    }
  }
  if (event.target.matches('[data-action="complete"]')) {
    updateTaskStatus(id, 'done');
  }
  if (event.target.matches('[data-action="progress"]')) {
    updateTaskStatus(id, 'in_behandeling');
  }
}

async function updateTaskStatus(id, status) {
  try {
    const { error } = await getSupabase().from('tasks').update({ status }).eq('id', id);
    if (error) throw error;
    await loadTasks();
    renderTasks();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Status bijwerken mislukt', 'error');
  }
}

function renderDashboard() {
  if (!state.supabase) return;
  const periodDays = Number(elements.dashboardPeriod.value || 30);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - periodDays + 1);
  const invoices = state.invoices.filter((invoice) => new Date(invoice.issue_date) >= start);
  const timeEntries = state.timeEntries.filter((entry) => new Date(entry.start_time) >= start);

  const revenue = sumBy(invoices, (invoice) => invoice.total_amount || 0);
  const hours = sumBy(timeEntries, (entry) => entry.duration_seconds || 0) / 3600;
  const previousStart = new Date(start);
  previousStart.setDate(start.getDate() - periodDays);
  const previousInvoices = state.invoices.filter(
    (invoice) => new Date(invoice.issue_date) >= previousStart && new Date(invoice.issue_date) < start
  );
  const previousTime = state.timeEntries.filter(
    (entry) => new Date(entry.start_time) >= previousStart && new Date(entry.start_time) < start
  );
  const previousRevenue = sumBy(previousInvoices, (invoice) => invoice.total_amount || 0);
  const previousHours = sumBy(previousTime, (entry) => entry.duration_seconds || 0) / 3600;
  elements.totalRevenue.textContent = formatCurrency(revenue);
  elements.totalHours.textContent = `${hours.toFixed(1)} uur`;
  elements.revenueTrend.textContent = formatTrend(revenue, previousRevenue);
  elements.hoursTrend.textContent = formatTrend(hours, previousHours, 'u');
  elements.revenuePeriodLabel.textContent = `Laatste ${periodDays} dagen`;
  elements.hoursPeriodLabel.textContent = `Laatste ${periodDays} dagen`;

  const openInvoices = state.invoices.filter((invoice) => invoice.status !== 'betaald');
  const outstanding = sumBy(openInvoices, (invoice) => invoice.total_amount || 0);
  elements.openInvoices.textContent = formatCurrency(outstanding);
  elements.openInvoicesCount.textContent = `${openInvoices.length} facturen`;

  const weekStart = getWeekStart(new Date());
  const weekEnd = getWeekEnd(new Date());
  const highPriority = state.tasks.filter(
    (task) => task.priority === 'high' && task.status !== 'done' && (!task.deadline || new Date(task.deadline) <= weekEnd)
  );
  elements.priorityTasks.textContent = `${highPriority.length} taken`;

  renderChart();
  renderUpcomingEvents();
  renderCriticalTasks();
}

function formatTrend(current, previous, suffix = '') {
  if (!previous) {
    return `${suffix ? `${suffix}` : ''}`;
  }
  const change = ((current - previous) / (previous || 1)) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function renderChart() {
  if (!elements.performanceChart) return;
  const ctx = elements.performanceChart.getContext('2d');
  const chartData = state.chartMode === 'revenue' ? buildRevenueDataset() : buildHoursDataset();
  if (state.chart) {
    state.chart.data.labels = chartData.labels;
    state.chart.data.datasets = chartData.datasets;
    state.chart.update();
    return;
  }
  state.chart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      tension: 0.35,
      plugins: {
        legend: {
          labels: { color: '#f8fafc' },
        },
      },
      scales: {
        x: {
          ticks: { color: '#cbd5f5' },
          grid: { color: 'rgba(255,255,255,0.08)' },
        },
        y: {
          ticks: { color: '#cbd5f5' },
          grid: { color: 'rgba(255,255,255,0.05)' },
        },
      },
    },
  });
}

function buildRevenueDataset() {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const labels = months.map((date) => date.toLocaleDateString('nl-NL', { month: 'short' }));
  const values = months.map((month) => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);
    return sumBy(state.invoices, (invoice) => {
      const issue = new Date(invoice.issue_date);
      return issue >= start && issue <= end ? invoice.total_amount || 0 : 0;
    });
  });
  return {
    labels,
    datasets: [
      {
        label: 'Omzet per maand',
        data: values,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.15)',
        fill: true,
      },
    ],
  };
}

function buildHoursDataset() {
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const start = getWeekStart(new Date());
    start.setDate(start.getDate() - (5 - index) * 7);
    return start;
  });
  const labels = weeks.map((week) => `Week ${weekNumber(week)}`);
  const values = weeks.map((week) => {
    const start = getWeekStart(week);
    const end = getWeekEnd(week);
    const seconds = sumBy(state.timeEntries, (entry) => {
      const date = new Date(entry.start_time);
      return date >= start && date <= end ? entry.duration_seconds || 0 : 0;
    });
    return Number((seconds / 3600).toFixed(2));
  });
  return {
    labels,
    datasets: [
      {
        label: 'Gewerkte uren per week',
        data: values,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56,189,248,0.2)',
        fill: true,
      },
    ],
  };
}

function weekNumber(date) {
  const target = new Date(date.valueOf());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week =
    1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
  return String(week).padStart(2, '0');
}

function renderUpcomingEvents() {
  const start = getWeekStart(new Date());
  const end = getWeekEnd(new Date());
  const events = state.planningEntries
    .filter((entry) => {
      const date = new Date(entry.start_time);
      return date >= start && date <= end;
    })
    .slice(0, 5);
  elements.upcomingEvents.innerHTML = events.length
    ? events
        .map(
          (event) => `
            <li>
              <strong>${event.title}</strong>
              <span>${formatDateTime(event.start_time)}</span>
            </li>`
        )
        .join('')
    : '<li>Geen afspraken gepland</li>';
}

function renderCriticalTasks() {
  const tasks = state.tasks
    .filter((task) => task.priority === 'high' && task.status !== 'done')
    .sort((a, b) => new Date(a.deadline || 0) - new Date(b.deadline || 0))
    .slice(0, 5);
  elements.criticalTasks.innerHTML = tasks.length
    ? tasks
        .map(
          (task) => `
            <li>
              <strong>${task.title}</strong>
              <span>${task.deadline ? formatDate(task.deadline) : 'Geen deadline'}</span>
            </li>`
        )
        .join('')
    : '<li>Geen urgente taken</li>';
}

