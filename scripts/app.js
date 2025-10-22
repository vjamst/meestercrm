import {
  initSupabase,
  getSupabase,
  resetSupabase,
} from './supabaseClient.js';
import {
  formatCurrency,
  formatDuration,
  formatDate,
  formatDateTime,
  getISODate,
  getISODateTimeLocal,
  startOfWeek,
  endOfWeek,
  addDays,
  formatWeekRange,
  groupBy,
  sumBy,
  toCSV,
  downloadFile,
  buildICS,
  parseICS,
  createToast,
  priorityLabel,
} from './utils.js';

const STORAGE_KEYS = {
  url: 'meestercrm_supabase_url',
  key: 'meestercrm_supabase_key',
};

const state = {
  supabase: null,
  session: null,
  user: null,
  clients: [],
  timeEntries: [],
  planning: [],
  invoices: [],
  tasks: [],
  timer: {
    running: false,
    startedAt: null,
    clientId: null,
    description: '',
  },
  timerInterval: null,
  activeWeek: startOfWeek(new Date()),
  chart: null,
  chartMode: 'revenue',
  drawerEntries: [],
  authMode: 'signin',
};

const elements = {
  navButtons: document.querySelectorAll('.nav-button'),
  views: document.querySelectorAll('.view'),
  connectionBadge: document.getElementById('connection-status'),
  userBadge: document.getElementById('user-status'),
  openSettings: document.getElementById('open-settings'),
  refreshButton: document.getElementById('refresh-button'),
  logoutButton: document.getElementById('logout-button'),
  settingsModal: document.getElementById('settings-modal'),
  authModal: document.getElementById('auth-modal'),
  clientModal: document.getElementById('client-modal'),
  invoiceModal: document.getElementById('invoice-modal'),
  invoiceEmailModal: document.getElementById('invoice-email-modal'),
  taskModal: document.getElementById('task-modal'),
  drawer: document.getElementById('drawer'),
  backdrop: document.getElementById('modal-backdrop'),
  settingsForm: document.getElementById('settings-form'),
  supabaseUrl: document.getElementById('supabase-url'),
  supabaseKey: document.getElementById('supabase-key'),
  clearSettings: document.getElementById('clear-settings'),
  authForm: document.getElementById('auth-form'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  authSubmit: document.getElementById('auth-submit'),
  authToggle: document.getElementById('auth-toggle'),
  authMessage: document.getElementById('auth-message'),
  dashboardRange: document.getElementById('dashboard-range'),
  metricRevenue: document.getElementById('metric-revenue'),
  metricRevenueDelta: document.getElementById('metric-revenue-delta'),
  metricRevenueRange: document.getElementById('metric-revenue-range'),
  metricHours: document.getElementById('metric-hours'),
  metricHoursDelta: document.getElementById('metric-hours-delta'),
  metricHoursRange: document.getElementById('metric-hours-range'),
  metricOpenInvoices: document.getElementById('metric-open-invoices'),
  metricOpenCount: document.getElementById('metric-open-count'),
  metricPriority: document.getElementById('metric-priority'),
  dashboardEvents: document.getElementById('dashboard-events'),
  dashboardTasks: document.getElementById('dashboard-tasks'),
  chartCanvas: document.getElementById('performance-chart'),
  toggleChart: document.getElementById('toggle-chart'),
  clientSearch: document.getElementById('client-search'),
  addClient: document.getElementById('add-client'),
  addClientEmpty: document.getElementById('empty-add-client'),
  clientsTable: document.getElementById('clients-table'),
  clientsEmpty: document.getElementById('clients-empty'),
  clientForm: document.getElementById('client-form'),
  clientId: document.getElementById('client-id'),
  clientName: document.getElementById('client-name'),
  clientEmail: document.getElementById('client-email'),
  clientPhone: document.getElementById('client-phone'),
  clientRate: document.getElementById('client-rate'),
  clientNotes: document.getElementById('client-notes'),
  clientModalTitle: document.getElementById('client-modal-title'),
  timeWeek: document.getElementById('time-week'),
  timerDisplay: document.getElementById('timer-display'),
  timerClient: document.getElementById('timer-client'),
  timerDescription: document.getElementById('timer-description'),
  startTimer: document.getElementById('start-timer'),
  stopTimer: document.getElementById('stop-timer'),
  resetTimer: document.getElementById('reset-timer'),
  timerFeedback: document.getElementById('timer-feedback'),
  manualForm: document.getElementById('manual-time-form'),
  manualClient: document.getElementById('manual-client'),
  manualStart: document.getElementById('manual-start'),
  manualEnd: document.getElementById('manual-end'),
  manualDescription: document.getElementById('manual-description'),
  timeTable: document.getElementById('time-table'),
  timeEmpty: document.getElementById('time-empty'),
  exportWeek: document.getElementById('export-week'),
  planningForm: document.getElementById('planning-form'),
  planningTitleInput: document.getElementById('planning-title-input'),
  planningClient: document.getElementById('planning-client'),
  planningStart: document.getElementById('planning-start'),
  planningEnd: document.getElementById('planning-end'),
  planningLocation: document.getElementById('planning-location'),
  planningLink: document.getElementById('planning-link'),
  previousWeek: document.getElementById('previous-week'),
  nextWeek: document.getElementById('next-week'),
  weekLabel: document.getElementById('week-label'),
  planningGrid: document.getElementById('planning-grid'),
  importIcs: document.getElementById('import-ics'),
  exportIcs: document.getElementById('export-ics'),
  invoiceFilter: document.getElementById('invoice-filter'),
  newInvoice: document.getElementById('new-invoice'),
  emptyInvoice: document.getElementById('empty-new-invoice'),
  invoiceTable: document.getElementById('invoice-table'),
  invoiceEmpty: document.getElementById('invoice-empty'),
  invoiceForm: document.getElementById('invoice-form'),
  invoiceModalTitle: document.getElementById('invoice-modal-title'),
  invoiceId: document.getElementById('invoice-id'),
  invoiceClient: document.getElementById('invoice-client'),
  invoiceNumber: document.getElementById('invoice-number'),
  invoiceIssue: document.getElementById('invoice-issue'),
  invoiceDue: document.getElementById('invoice-due'),
  invoiceVat: document.getElementById('invoice-vat'),
  invoicePaid: document.getElementById('invoice-paid'),
  invoiceTotal: document.getElementById('invoice-total'),
  lineItemsContainer: document.getElementById('line-items-container'),
  lineItemTemplate: document.getElementById('line-item-template'),
  loadTimeEntries: document.getElementById('load-time-entries'),
  addLineItem: document.getElementById('add-line-item'),
  invoiceEmailForm: document.getElementById('invoice-email-form'),
  emailInvoiceId: document.getElementById('email-invoice-id'),
  emailRecipient: document.getElementById('email-recipient'),
  emailSubject: document.getElementById('email-subject'),
  emailBody: document.getElementById('email-body'),
  drawerForm: document.getElementById('drawer-form'),
  drawerTable: document.getElementById('drawer-table'),
  drawerStart: document.getElementById('drawer-start'),
  drawerEnd: document.getElementById('drawer-end'),
  addSelectedTime: document.getElementById('add-selected-time'),
  taskTable: document.getElementById('task-table'),
  tasksEmpty: document.getElementById('tasks-empty'),
  addTask: document.getElementById('add-task'),
  addTaskEmpty: document.getElementById('empty-add-task'),
  taskCompleteFilter: document.getElementById('task-complete-filter'),
  taskPriorityFilter: document.getElementById('task-priority-filter'),
  taskForm: document.getElementById('task-form'),
  taskId: document.getElementById('task-id'),
  taskTitle: document.getElementById('task-title'),
  taskDeadline: document.getElementById('task-deadline'),
  taskPriority: document.getElementById('task-priority'),
  taskDone: document.getElementById('task-done'),
  taskModalTitle: document.getElementById('task-modal-title'),
};

init();

function init() {
  attachEventListeners();
  initializeDefaults();
  restoreSupabaseConfig();
}
function attachEventListeners() {
  elements.navButtons.forEach((button) =>
    button.addEventListener('click', () => switchView(button.dataset.view || button.dataset.target))
  );

  elements.openSettings?.addEventListener('click', () => openSettingsModal());
  elements.refreshButton?.addEventListener('click', () => loadAllData());
  elements.logoutButton?.addEventListener('click', handleLogout);

  document.querySelectorAll('[data-close]').forEach((button) =>
    button.addEventListener('click', (event) => {
      const modal = event.target.closest('.modal, .drawer');
      if (modal) closeModal(modal);
    })
  );

  elements.settingsForm?.addEventListener('submit', handleSupabaseSubmit);
  elements.clearSettings?.addEventListener('click', clearSupabaseConfig);

  elements.authForm?.addEventListener('submit', handleAuthSubmit);
  elements.authToggle?.addEventListener('click', toggleAuthMode);

  elements.dashboardRange?.addEventListener('change', renderDashboard);
  elements.toggleChart?.addEventListener('click', toggleChartMode);

  elements.clientSearch?.addEventListener('input', renderClients);
  elements.addClient?.addEventListener('click', () => openClientModal());
  elements.addClientEmpty?.addEventListener('click', () => openClientModal());
  elements.clientForm?.addEventListener('submit', handleClientSubmit);
  elements.clientsTable?.addEventListener('click', handleClientTableClick);

  elements.timeWeek?.addEventListener('change', handleWeekChange);
  elements.startTimer?.addEventListener('click', startTimer);
  elements.stopTimer?.addEventListener('click', stopTimer);
  elements.resetTimer?.addEventListener('click', resetTimer);
  elements.manualForm?.addEventListener('submit', handleManualTimeSubmit);
  elements.timeTable?.addEventListener('click', handleTimeTableClick);
  elements.exportWeek?.addEventListener('click', exportWeekCsv);

  elements.planningForm?.addEventListener('submit', handlePlanningSubmit);
  elements.previousWeek?.addEventListener('click', () => changeWeek(-1));
  elements.nextWeek?.addEventListener('click', () => changeWeek(1));
  elements.planningGrid?.addEventListener('click', handlePlanningGridClick);
  elements.importIcs?.addEventListener('change', importIcsFile);
  elements.exportIcs?.addEventListener('click', exportIcsFile);

  elements.invoiceFilter?.addEventListener('change', renderInvoices);
  elements.newInvoice?.addEventListener('click', () => openInvoiceModal());
  elements.emptyInvoice?.addEventListener('click', () => openInvoiceModal());
  elements.invoiceTable?.addEventListener('click', handleInvoiceTableClick);
  elements.invoiceForm?.addEventListener('submit', handleInvoiceSubmit);
  elements.invoiceVat?.addEventListener('input', updateInvoiceSummary);
  elements.loadTimeEntries?.addEventListener('click', openDrawer);
  elements.addLineItem?.addEventListener('click', () => addLineItem());
  elements.invoiceEmailForm?.addEventListener('submit', handleInvoiceEmailSubmit);

  elements.drawerForm?.addEventListener('submit', handleDrawerFilterSubmit);
  elements.addSelectedTime?.addEventListener('click', addSelectedTimeEntries);

  elements.addTask?.addEventListener('click', () => openTaskModal());
  elements.addTaskEmpty?.addEventListener('click', () => openTaskModal());
  elements.taskForm?.addEventListener('submit', handleTaskSubmit);
  elements.taskTable?.addEventListener('click', handleTaskTableClick);
  elements.taskCompleteFilter?.addEventListener('change', renderTasks);
  elements.taskPriorityFilter?.addEventListener('change', renderTasks);
}

function initializeDefaults() {
  if (elements.timeWeek) {
    const week = state.activeWeek;
    const year = week.getFullYear();
    const weekNumber = getWeekNumber(week);
    elements.timeWeek.value = `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }
  if (elements.manualStart && elements.manualEnd) {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000);
    elements.manualStart.value = getISODateTimeLocal(start);
    elements.manualEnd.value = getISODateTimeLocal(end);
  }
  if (elements.invoiceIssue) elements.invoiceIssue.value = getISODate(new Date());
  if (elements.invoiceDue) {
    const due = new Date();
    due.setDate(due.getDate() + 14);
    elements.invoiceDue.value = getISODate(due);
  }
  updateWeekLabel();
}

function restoreSupabaseConfig() {
  const url = localStorage.getItem(STORAGE_KEYS.url);
  const key = localStorage.getItem(STORAGE_KEYS.key);
  if (url && key) {
    elements.supabaseUrl.value = url;
    elements.supabaseKey.value = key;
    connectSupabase(url, key);
  } else {
    openSettingsModal();
  }
}

async function connectSupabase(url, key) {
  try {
    state.supabase = initSupabase({ url, key });
    const { error } = await getSupabase().from('clients').select('id').limit(1);
    if (error) throw error;
    localStorage.setItem(STORAGE_KEYS.url, url);
    localStorage.setItem(STORAGE_KEYS.key, key);
    setConnectionStatus(true);
    registerAuthListener();
    await resolveSession();
    closeModal(elements.settingsModal);
    createToast('Verbonden met Supabase', 'success');
  } catch (error) {
    console.error(error);
    createToast(error.message || 'Kon geen verbinding maken met Supabase', 'error');
    setConnectionStatus(false);
    openSettingsModal();
  }
}

function registerAuthListener() {
  if (!state.supabase) return;
  state.supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
}

async function resolveSession() {
  if (!state.supabase) return;
  const { data, error } = await state.supabase.auth.getSession();
  if (error) {
    console.error(error);
    return;
  }
  handleSession(data.session);
}

function handleSession(session) {
  state.session = session;
  state.user = session?.user || null;
  if (state.user) {
    elements.logoutButton.classList.remove('hidden');
    elements.userBadge.classList.remove('hidden');
    elements.userBadge.textContent = state.user.email;
    closeModal(elements.authModal);
    loadAllData();
  } else {
    elements.logoutButton.classList.add('hidden');
    elements.userBadge.classList.add('hidden');
    elements.userBadge.textContent = '';
    openModal(elements.authModal);
    clearData();
  }
}

function setConnectionStatus(connected) {
  if (!elements.connectionBadge) return;
  elements.connectionBadge.textContent = connected ? 'Verbonden' : 'Niet verbonden';
  elements.connectionBadge.classList.toggle('badge-success', connected);
  elements.connectionBadge.classList.toggle('badge-danger', !connected);
}

function clearData() {
  state.clients = [];
  state.timeEntries = [];
  state.planning = [];
  state.invoices = [];
  state.tasks = [];
  renderClients();
  renderTimeEntries();
  renderPlanning();
  renderInvoices();
  renderTasks();
  renderDashboard();
}

function openSettingsModal() {
  elements.supabaseUrl.value = localStorage.getItem(STORAGE_KEYS.url) || '';
  elements.supabaseKey.value = localStorage.getItem(STORAGE_KEYS.key) || '';
  openModal(elements.settingsModal);
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

function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEYS.url);
  localStorage.removeItem(STORAGE_KEYS.key);
  resetSupabase();
  state.supabase = null;
  setConnectionStatus(false);
  state.session = null;
  state.user = null;
  clearData();
  openSettingsModal();
}

async function handleLogout() {
  if (!state.supabase) return;
  await state.supabase.auth.signOut();
  createToast('Uitgelogd', 'success');
}

function toggleAuthMode() {
  state.authMode = state.authMode === 'signin' ? 'signup' : 'signin';
  if (state.authMode === 'signin') {
    elements.authSubmit.textContent = 'Inloggen';
    elements.authToggle.textContent = 'Nog geen account?';
  } else {
    elements.authSubmit.textContent = 'Account aanmaken';
    elements.authToggle.textContent = 'Ik heb al een account';
  }
  elements.authMessage.textContent = '';
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!state.supabase) return;
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value.trim();
  if (!email || !password) {
    elements.authMessage.textContent = 'Vul e-mail en wachtwoord in.';
    return;
  }
  try {
    if (state.authMode === 'signin') {
      const { error } = await state.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      elements.authMessage.textContent = '';
      createToast('Succesvol ingelogd', 'success');
    } else {
      const { error } = await state.supabase.auth.signUp({ email, password });
      if (error) throw error;
      elements.authMessage.textContent =
        'Account aangemaakt. Bevestig je e-mailadres indien Supabase dat vereist.';
      createToast('Account aangemaakt', 'success');
    }
  } catch (error) {
    console.error(error);
    elements.authMessage.textContent = error.message || 'Inloggen mislukt';
    createToast(error.message || 'Authenticatie mislukt', 'error');
  }
}

async function loadAllData() {
  if (!state.supabase || !state.user) return;
  try {
    elements.refreshButton.disabled = true;
    elements.refreshButton.textContent = 'Laden…';
    await Promise.all([
      loadClients(),
      loadTimeEntries(),
      loadPlanning(),
      loadInvoices(),
      loadTasks(),
    ]);
    renderClients();
    renderTimeEntries();
    renderPlanning();
    renderInvoices();
    renderTasks();
    renderDashboard();
    updateClientSelects();
  } catch (error) {
    console.error(error);
    createToast('Gegevens konden niet worden geladen', 'error');
  } finally {
    elements.refreshButton.disabled = false;
    elements.refreshButton.textContent = 'Verversen';
  }
}
async function loadClients() {
  const { data, error } = await getSupabase()
    .from('clients')
    .select('*')
    .eq('user_id', state.user.id)
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
    .eq('user_id', state.user.id)
    .gte('started_at', since.toISOString())
    .order('started_at', { ascending: false });
  if (error) throw error;
  state.timeEntries = data || [];
}

async function loadPlanning() {
  const start = addDays(state.activeWeek, -14);
  const end = addDays(state.activeWeek, 21);
  const { data, error } = await getSupabase()
    .from('planning_events')
    .select('*')
    .eq('user_id', state.user.id)
    .gte('starts_at', start.toISOString())
    .lte('ends_at', end.toISOString())
    .order('starts_at');
  if (error) throw error;
  state.planning = data || [];
}

async function loadInvoices() {
  const since = new Date();
  since.setMonth(since.getMonth() - 18);
  const { data, error } = await getSupabase()
    .from('invoices')
    .select('*, client:clients(id, name, email, phone), items:invoice_items(*)')
    .eq('user_id', state.user.id)
    .gte('issue_date', since.toISOString())
    .order('issue_date', { ascending: false });
  if (error) throw error;
  state.invoices = (data || []).map((invoice) => ({
    ...invoice,
    items: invoice.items || [],
  }));
}

async function loadTasks() {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('*')
    .eq('user_id', state.user.id)
    .order('due_date', { ascending: true });
  if (error) throw error;
  state.tasks = data || [];
}

function switchView(view) {
  elements.navButtons.forEach((button) =>
    button.classList.toggle('active', (button.dataset.view || button.dataset.target) === view)
  );
  elements.views.forEach((section) => section.classList.toggle('active', section.id === view));
}

function renderClients() {
  const query = (elements.clientSearch?.value || '').toLowerCase();
  const rows = state.clients.filter((client) =>
    [client.name, client.email, client.phone]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
  );
  elements.clientsEmpty?.classList.toggle('hidden', rows.length > 0);
  elements.clientsTable.innerHTML = rows
    .map((client) => {
      const lastEntry = state.timeEntries.find((entry) => Number(entry.client_id) === Number(client.id));
      return `
        <tr data-id="${client.id}">
          <td>
            <strong>${client.name}</strong>
            ${client.notes ? `<div class="muted">${client.notes}</div>` : ''}
          </td>
          <td>
            ${client.email ? `<div>${client.email}</div>` : ''}
            ${client.phone ? `<div class="muted">${client.phone}</div>` : ''}
          </td>
          <td>${client.hourly_rate ? formatCurrency(client.hourly_rate) : '—'}</td>
          <td>${lastEntry ? formatDate(lastEntry.started_at) : 'Nog geen uren'}</td>
          <td class="table-actions">
            <button type="button" class="ghost-button" data-action="edit">Wijzig</button>
            <button type="button" class="ghost-button" data-action="delete">Verwijder</button>
          </td>
        </tr>`;
    })
    .join('');
}

function openClientModal(client = null) {
  elements.clientForm.reset();
  elements.clientId.value = client?.id || '';
  elements.clientModalTitle.textContent = client ? 'Klant bewerken' : 'Nieuwe klant';
  if (client) {
    elements.clientName.value = client.name || '';
    elements.clientEmail.value = client.email || '';
    elements.clientPhone.value = client.phone || '';
    elements.clientRate.value = client.hourly_rate || '';
    elements.clientNotes.value = client.notes || '';
  }
  openModal(elements.clientModal);
}

async function handleClientSubmit(event) {
  event.preventDefault();
  if (!state.user) return;
  const payload = {
    user_id: state.user.id,
    name: elements.clientName.value.trim(),
    email: elements.clientEmail.value.trim() || null,
    phone: elements.clientPhone.value.trim() || null,
    hourly_rate: elements.clientRate.value ? Number(elements.clientRate.value) : null,
    notes: elements.clientNotes.value.trim() || null,
  };
  if (!payload.name) {
    createToast('Naam is verplicht', 'error');
    return;
  }
  try {
    const id = elements.clientId.value;
    if (id) {
      const { error } = await getSupabase()
        .from('clients')
        .update(payload)
        .eq('id', id)
        .eq('user_id', state.user.id);
      if (error) throw error;
      createToast('Klant bijgewerkt', 'success');
    } else {
      const { error } = await getSupabase().from('clients').insert(payload);
      if (error) throw error;
      createToast('Klant aangemaakt', 'success');
    }
    closeModal(elements.clientModal);
    await loadClients();
    renderClients();
    updateClientSelects();
  } catch (error) {
    console.error(error);
    createToast('Opslaan van klant mislukt', 'error');
  }
}

async function handleClientTableClick(event) {
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  const client = state.clients.find((item) => item.id === row.dataset.id);
  if (!client) return;
  if (event.target.matches('[data-action="edit"]')) {
    openClientModal(client);
  }
  if (event.target.matches('[data-action="delete"]')) {
    if (!confirm('Wil je deze klant verwijderen?')) return;
    try {
      const { error } = await getSupabase()
        .from('clients')
        .delete()
        .eq('id', client.id)
        .eq('user_id', state.user.id);
      if (error) throw error;
      createToast('Klant verwijderd', 'success');
      await loadClients();
      renderClients();
      updateClientSelects();
    } catch (error) {
      console.error(error);
      createToast('Verwijderen mislukt', 'error');
    }
  }
}

function updateClientSelects() {
  const options = ['<option value="">Selecteer klant</option>'].concat(
    state.clients.map((client) => `<option value="${client.id}">${client.name}</option>`)
  );
  const html = options.join('');
  if (elements.timerClient) elements.timerClient.innerHTML = html;
  if (elements.manualClient) elements.manualClient.innerHTML = html;
  if (elements.planningClient) elements.planningClient.innerHTML = html;
  if (elements.invoiceClient) elements.invoiceClient.innerHTML = html;
}

function getWeekNumber(date) {
  const target = new Date(date.valueOf());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff =
    (target.getTime() - firstThursday.getTime()) / 86400000 +
    ((firstThursday.getDay() + 6) % 7) -
    3;
  return 1 + Math.round(diff / 7);
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
  state.activeWeek = weekStart;
  updateWeekLabel();
  renderTimeEntries();
  renderPlanning();
  renderDashboard();
}

function updateWeekLabel() {
  if (elements.weekLabel) {
    elements.weekLabel.textContent = formatWeekRange(state.activeWeek);
  }
}

function changeWeek(delta) {
  state.activeWeek = addDays(state.activeWeek, delta * 7);
  if (elements.timeWeek) {
    elements.timeWeek.value = generateWeekInput(state.activeWeek);
  }
  renderTimeEntries();
  renderPlanning();
  renderDashboard();
}

function generateWeekInput(date) {
  const week = getWeekNumber(date);
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function startTimer() {
  if (state.timer.running) return;
  const clientId = elements.timerClient.value;
  if (!clientId) {
    createToast('Kies een klant om de timer te starten', 'error');
    return;
  }
  state.timer.running = true;
  state.timer.startedAt = new Date();
  state.timer.clientId = clientId;
  state.timer.description = elements.timerDescription.value.trim();
  elements.startTimer.disabled = true;
  elements.stopTimer.disabled = false;
  elements.resetTimer.disabled = false;
  elements.timerFeedback.classList.add('hidden');
  updateTimerDisplay();
  state.timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (!state.timer.running) return;
  clearInterval(state.timerInterval);
  const end = new Date();
  const duration = Math.round((end.getTime() - state.timer.startedAt.getTime()) / 1000);
  state.timer.running = false;
  elements.startTimer.disabled = false;
  elements.stopTimer.disabled = true;
  elements.timerFeedback.textContent = `Gelogd: ${formatDuration(duration)} voor ${
    getClientName(state.timer.clientId) || 'onbekende klant'
  }`;
  elements.timerFeedback.classList.remove('hidden');
  saveTimeEntry({
    clientId: state.timer.clientId,
    note: state.timer.description,
    start: state.timer.startedAt,
    end,
  });
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timer.running = false;
  state.timer.startedAt = null;
  state.timer.clientId = null;
  state.timer.description = '';
  elements.timerDisplay.textContent = '00:00:00';
  elements.startTimer.disabled = false;
  elements.stopTimer.disabled = true;
  elements.resetTimer.disabled = true;
  elements.timerDescription.value = '';
}

function updateTimerDisplay() {
  if (!state.timer.running || !state.timer.startedAt) return;
  const now = new Date();
  const seconds = Math.round((now.getTime() - state.timer.startedAt.getTime()) / 1000);
  elements.timerDisplay.textContent = formatDuration(seconds);
}

function getClientRate(clientId) {
  if (!clientId) return null;
  const id = Number(clientId);
  return state.clients.find((client) => Number(client.id) === id)?.hourly_rate || null;
}
async function saveTimeEntry({ clientId, note, start, end }) {
  if (!state.user) return;
  const payload = {
    user_id: state.user.id,
    client_id: clientId ? Number(clientId) : null,
    started_at: start.toISOString(),
    ended_at: end.toISOString(),
    note: note || null,
  };
  try {
    const { error } = await getSupabase().from('time_entries').insert(payload);
    if (error) throw error;
    createToast('Tijd geregistreerd', 'success');
    await loadTimeEntries();
    renderTimeEntries();
    renderDashboard();
    updateClientSelects();
  } catch (error) {
    console.error(error);
    createToast('Timer kon niet worden opgeslagen', 'error');
  }
}

async function handleManualTimeSubmit(event) {
  event.preventDefault();
  if (!state.user) return;
  const clientId = elements.manualClient.value;
  const startValue = elements.manualStart.value;
  const endValue = elements.manualEnd.value;
  if (!clientId || !startValue || !endValue) {
    createToast('Vul klant, start- en eindtijd in', 'error');
    return;
  }
  const startDate = new Date(startValue);
  const endDate = new Date(endValue);
  if (endDate <= startDate) {
    createToast('Eindtijd moet na starttijd liggen', 'error');
    return;
  }
  await saveTimeEntry({
    clientId,
    note: elements.manualDescription.value.trim(),
    start: startDate,
    end: endDate,
  });
  elements.manualForm.reset();
  const now = new Date();
  elements.manualStart.value = getISODateTimeLocal(new Date(now.getTime() - 60 * 60 * 1000));
  elements.manualEnd.value = getISODateTimeLocal(now);
}

function getClientName(id) {
  if (id == null) return 'Onbekende klant';
  const target = state.clients.find((client) => Number(client.id) === Number(id));
  return target?.name || 'Onbekende klant';
}

function renderTimeEntries() {
  const start = startOfWeek(state.activeWeek);
  const end = endOfWeek(state.activeWeek);
  const entries = state.timeEntries.filter((entry) => {
    const date = new Date(entry.started_at);
    return date >= start && date <= end;
  });
  elements.timeEmpty?.classList.toggle('hidden', entries.length > 0);
  elements.timeTable.innerHTML = entries
    .map(
      (entry) => `
        <tr data-id="${entry.id}">
          <td>${formatDate(entry.started_at)}</td>
          <td>${entry.client?.name || getClientName(entry.client_id)}</td>
          <td>${entry.note || '—'}</td>
          <td>${formatDuration(entry.seconds)}</td>
          <td class="table-actions">
            <button type="button" class="ghost-button" data-action="delete">Verwijder</button>
          </td>
        </tr>`
    )
    .join('');
}

async function handleTimeTableClick(event) {
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  if (!event.target.matches('[data-action="delete"]')) return;
  if (!confirm('Verwijder deze tijdregistratie?')) return;
  try {
    const { error } = await getSupabase()
      .from('time_entries')
      .delete()
      .eq('id', Number(row.dataset.id))
      .eq('user_id', state.user.id);
    if (error) throw error;
    createToast('Urenregel verwijderd', 'success');
    await loadTimeEntries();
    renderTimeEntries();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Verwijderen mislukt', 'error');
  }
}

function exportWeekCsv() {
  const start = startOfWeek(state.activeWeek);
  const end = endOfWeek(state.activeWeek);
  const entries = state.timeEntries.filter((entry) => {
    const date = new Date(entry.started_at);
    return date >= start && date <= end;
  });
  if (!entries.length) {
    createToast('Geen uren om te exporteren', 'error');
    return;
  }
  const rows = [
    ['Datum', 'Klant', 'Notitie', 'Start', 'Einde', 'Duur (sec)'],
    ...entries.map((entry) => [
      formatDate(entry.started_at),
      entry.client?.name || getClientName(entry.client_id),
      entry.note || '',
      formatDateTime(entry.started_at),
      formatDateTime(entry.ended_at),
      entry.seconds,
    ]),
  ];
  downloadFile(`uren-${getISODate(start)}.csv`, toCSV(rows), 'text/csv');
  createToast('Weekexport aangemaakt', 'success');
}

async function handlePlanningSubmit(event) {
  event.preventDefault();
  if (!state.user) return;
  const title = elements.planningTitleInput.value.trim();
  const start = elements.planningStart.value;
  const end = elements.planningEnd.value;
  if (!title || !start || !end) {
    createToast('Vul titel, start en einde in', 'error');
    return;
  }
  const payload = {
    user_id: state.user.id,
    client_id: elements.planningClient.value ? Number(elements.planningClient.value) : null,
    title,
    starts_at: new Date(start).toISOString(),
    ends_at: new Date(end).toISOString(),
    location: elements.planningLocation.value.trim() || null,
    link: elements.planningLink.value.trim() || null,
  };
  try {
    const { error } = await getSupabase().from('planning_events').insert(payload);
    if (error) throw error;
    createToast('Planning toegevoegd', 'success');
    elements.planningForm.reset();
    await loadPlanning();
    renderPlanning();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Kon planning niet opslaan', 'error');
  }
}

function renderPlanning() {
  updateWeekLabel();
  const start = startOfWeek(state.activeWeek);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const events = state.planning.filter((event) => {
    const date = new Date(event.starts_at);
    return date >= start && date <= endOfWeek(state.activeWeek);
  });
  elements.planningGrid.innerHTML = days
    .map((day) => {
      const dayEvents = events.filter((event) => {
        const date = new Date(event.starts_at);
        return (
          date.getFullYear() === day.getFullYear() &&
          date.getMonth() === day.getMonth() &&
          date.getDate() === day.getDate()
        );
      });
      const list = dayEvents
        .map(
          (event) => `
            <li data-id="${event.id}">
              <strong>${event.title}</strong>
              <span>${formatDateTime(event.starts_at)} – ${formatDateTime(event.ends_at)}</span>
              ${event.location ? `<span>📍 ${event.location}</span>` : ''}
              ${event.link ? `<span>🔗 <a href="${event.link}" target="_blank">Link</a></span>` : ''}
              <div class="event-actions">
                <button type="button" class="ghost-button" data-action="remove">Verwijder</button>
              </div>
            </li>`
        )
        .join('');
      return `
        <div class="day" data-date="${day.toISOString()}">
          <header>
            <div>${day.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })}</div>
            <span class="muted">${dayEvents.length}</span>
          </header>
          <ul>${list || '<li>Geen afspraken</li>'}</ul>
        </div>`;
    })
    .join('');
}

async function handlePlanningGridClick(event) {
  const button = event.target.closest('[data-action="remove"]');
  if (!button) return;
  const item = button.closest('li[data-id]');
  if (!item) return;
  if (!confirm('Verwijder dit agendaitem?')) return;
  try {
    const { error } = await getSupabase()
      .from('planning_events')
      .delete()
      .eq('id', Number(item.dataset.id))
      .eq('user_id', state.user.id);
    if (error) throw error;
    createToast('Planning verwijderd', 'success');
    await loadPlanning();
    renderPlanning();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Verwijderen mislukt', 'error');
  }
}

function exportIcsFile() {
  const start = startOfWeek(state.activeWeek);
  const end = endOfWeek(state.activeWeek);
  const events = state.planning.filter((entry) => {
    const date = new Date(entry.starts_at);
    return date >= start && date <= end;
  });
  if (!events.length) {
    createToast('Geen afspraken om te exporteren', 'error');
    return;
  }
  const ics = buildICS(
    events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.starts_at,
      end: event.ends_at,
      description: event.location || '',
      location: event.location,
      url: event.link,
    }))
  );
  downloadFile(`planning-${getISODate(start)}.ics`, ics, 'text/calendar');
  createToast('ICS-bestand aangemaakt', 'success');
}

async function importIcsFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const events = parseICS(text);
  if (!events.length) {
    createToast('Geen events gevonden in bestand', 'error');
    return;
  }
  const payloads = events
    .filter((event) => event.start)
    .map((event) => ({
      user_id: state.user.id,
      title: event.title || 'Agenda item',
      client_id: null,
      starts_at: new Date(event.start).toISOString(),
      ends_at: event.end ? new Date(event.end).toISOString() : new Date(event.start).toISOString(),
      location: event.location || null,
      link: event.url || null,
    }));
  try {
    const { error } = await getSupabase().from('planning_events').insert(payloads);
    if (error) throw error;
    createToast(`${payloads.length} agenda-items geïmporteerd`, 'success');
    await loadPlanning();
    renderPlanning();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Importeren mislukt', 'error');
  } finally {
    elements.importIcs.value = '';
  }
}
function openInvoiceModal(invoice = null) {
  elements.invoiceForm.reset();
  elements.lineItemsContainer.innerHTML = '';
  elements.invoiceId.value = invoice?.id || '';
  elements.invoiceClient.value = invoice?.client_id || '';
  elements.invoiceNumber.value = invoice?.number || generateInvoiceNumber();
  elements.invoiceIssue.value = invoice?.issue_date?.slice(0, 10) || getISODate(new Date());
  const defaultDue = (() => {
    const due = new Date();
    due.setDate(due.getDate() + 14);
    return getISODate(due);
  })();
  elements.invoiceDue.value = invoice?.due_date?.slice(0, 10) || defaultDue;
  elements.invoiceVat.value = invoice?.vat_rate ?? 21;
  elements.invoicePaid.checked = Boolean(invoice?.paid);
  (invoice?.items || []).forEach((item) =>
    addLineItem({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })
  );
  updateInvoiceSummary();
  elements.invoiceModalTitle.textContent = invoice ? 'Factuur bewerken' : 'Nieuwe factuur';
  openModal(elements.invoiceModal);
}

function addLineItem(data = {}) {
  const template = elements.lineItemTemplate.content.cloneNode(true);
  const item = template.querySelector('.line-item');
  item.querySelector('[data-field="description"]').value = data.description || '';
  item.querySelector('[data-field="quantity"]').value = data.quantity ?? 1;
  item.querySelector('[data-field="unit_price"]').value = data.unit_price ?? '';
  updateLineItemAmount(item);
  item.addEventListener('input', () => updateLineItemAmount(item));
  item.querySelector('[data-action="remove"]').addEventListener('click', () => {
    item.remove();
    updateInvoiceSummary();
  });
  elements.lineItemsContainer.appendChild(item);
  updateInvoiceSummary();
}

function updateLineItemAmount(item) {
  const quantity = Number(item.querySelector('[data-field="quantity"]').value) || 0;
  const rate = Number(item.querySelector('[data-field="unit_price"]').value) || 0;
  item.querySelector('[data-field="amount"]').value = formatCurrency(quantity * rate);
  updateInvoiceSummary();
}

function updateInvoiceSummary() {
  const items = Array.from(elements.lineItemsContainer.querySelectorAll('.line-item'));
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.querySelector('[data-field="quantity"]').value) || 0;
    const rate = Number(item.querySelector('[data-field="unit_price"]').value) || 0;
    return sum + quantity * rate;
  }, 0);
  const vatRate = Number(elements.invoiceVat?.value ?? 21);
  const vatAmount = subtotal * (vatRate / 100);
  elements.invoiceTotal.textContent = `${formatCurrency(subtotal + vatAmount)} (incl. btw)`;
}

function generateInvoiceNumber() {
  const date = new Date();
  return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate()
  ).padStart(2, '0')}-${Math.floor(Math.random() * 900 + 100)}`;
}

async function handleInvoiceSubmit(event) {
  event.preventDefault();
  if (!state.user) return;
  const items = Array.from(elements.lineItemsContainer.querySelectorAll('.line-item'));
  if (!items.length) {
    createToast('Voeg minimaal één factuurregel toe', 'error');
    return;
  }
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.querySelector('[data-field="quantity"]').value) || 0;
    const rate = Number(item.querySelector('[data-field="unit_price"]').value) || 0;
    return sum + quantity * rate;
  }, 0);
  const vatRate = Number(elements.invoiceVat.value || 0);
  const payload = {
    user_id: state.user.id,
    client_id: elements.invoiceClient.value ? Number(elements.invoiceClient.value) : null,
    number: elements.invoiceNumber.value.trim(),
    issue_date: elements.invoiceIssue.value,
    due_date: elements.invoiceDue.value || null,
    total_ex_vat: subtotal,
    vat_rate: vatRate,
    paid: elements.invoicePaid.checked,
  };
  if (!payload.number || !payload.client_id) {
    createToast('Kies een klant en factuurnummer', 'error');
    return;
  }
  try {
    let invoiceId = elements.invoiceId.value || null;
    if (invoiceId) {
      const { error } = await getSupabase()
        .from('invoices')
        .update(payload)
        .eq('id', invoiceId)
        .eq('user_id', state.user.id);
      if (error) throw error;
      const { error: deleteItemsError } = await getSupabase()
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceId);
      if (deleteItemsError) throw deleteItemsError;
    } else {
      const { data, error } = await getSupabase()
        .from('invoices')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      invoiceId = data.id;
    }
    const itemPayloads = items.map((item) => ({
      invoice_id: invoiceId,
      description: item.querySelector('[data-field="description"]').value,
      quantity: Number(item.querySelector('[data-field="quantity"]').value) || 0,
      unit_price: Number(item.querySelector('[data-field="unit_price"]').value) || 0,
    }));
    if (itemPayloads.length) {
      const { error: insertItemsError } = await getSupabase().from('invoice_items').insert(itemPayloads);
      if (insertItemsError) throw insertItemsError;
    }
    createToast('Factuur opgeslagen', 'success');
    closeModal(elements.invoiceModal);
    await loadInvoices();
    renderInvoices();
    renderDashboard();
  } catch (error) {
    console.error(error);
    createToast('Opslaan van factuur mislukt', 'error');
  }
}

function renderInvoices() {
  const filter = elements.invoiceFilter.value;
  const invoices = state.invoices.filter((invoice) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return invoice.paid;
    if (filter === 'open') return !invoice.paid;
    return true;
  });
  elements.invoiceEmpty?.classList.toggle('hidden', invoices.length > 0);
  elements.invoiceTable.innerHTML = invoices
    .map(
      (invoice) => `
        <tr data-id="${invoice.id}">
          <td>${invoice.number}</td>
          <td>${invoice.client?.name || getClientName(invoice.client_id)}</td>
          <td>${invoice.issue_date ? formatDate(invoice.issue_date) : '—'}</td>
          <td>${invoice.due_date ? formatDate(invoice.due_date) : '—'}</td>
          <td>${formatCurrency(calculateInvoiceTotal(invoice))}</td>
          <td><span class="badge-status ${invoice.paid ? 'paid' : 'open'}">${invoice.paid ? 'Betaald' : 'Openstaand'}</span></td>
          <td class="table-actions">
            <button type="button" class="ghost-button" data-action="edit">Wijzig</button>
            <button type="button" class="ghost-button" data-action="pdf">PDF</button>
            <button type="button" class="ghost-button" data-action="email">E-mail</button>
            <button type="button" class="ghost-button" data-action="delete">Verwijder</button>
          </td>
        </tr>`
    )
    .join('');
}

function calculateInvoiceTotal(invoice) {
  const subtotal = Number(invoice.total_ex_vat || 0);
  const vatRate = Number(invoice.vat_rate || 0);
  return subtotal * (1 + vatRate / 100);
}

async function handleInvoiceTableClick(event) {
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  const invoiceId = Number(row.dataset.id);
  const invoice = state.invoices.find((item) => Number(item.id) === invoiceId);
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
      const { error } = await getSupabase()
        .from('invoices')
        .delete()
        .eq('id', invoice.id)
        .eq('user_id', state.user.id);
      if (error) throw error;
      await getSupabase().from('invoice_items').delete().eq('invoice_id', invoice.id);
      createToast('Factuur verwijderd', 'success');
      await loadInvoices();
      renderInvoices();
      renderDashboard();
    } catch (error) {
      console.error(error);
      createToast('Verwijderen mislukt', 'error');
    }
  }
}

async function buildInvoicePdf(invoiceId) {
  const { data, error } = await getSupabase()
    .from('invoices')
    .select('*, client:clients(*), items:invoice_items(*)')
    .eq('id', invoiceId)
    .eq('user_id', state.user.id)
    .single();
  if (error) throw error;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Factuur', 20, 24);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Factuurnummer: ${data.number}`, 20, 36);
  doc.text(`Factuurdatum: ${formatDate(data.issue_date)}`, 20, 44);
  doc.text(`Vervaldatum: ${formatDate(data.due_date)}`, 20, 52);
  doc.text('Factuur voor:', 20, 68);
  doc.text(data.client?.name || 'Onbekende klant', 20, 76);
  if (data.client?.email) {
    doc.text(data.client.email, 20, 84);
  }
  if (data.client?.phone) {
    doc.text(data.client.phone, 20, 90);
  }
  const startY = 108;
  doc.setFillColor(230);
  doc.rect(20, startY, 170, 8, 'F');
  doc.text('Omschrijving', 22, startY + 6);
  doc.text('Aantal', 108, startY + 6);
  doc.text('Tarief', 138, startY + 6);
  doc.text('Totaal', 160, startY + 6);
  let currentY = startY + 14;
  data.items.forEach((item) => {
    const total = (item.quantity || 0) * (item.unit_price || 0);
    doc.text(item.description || '—', 22, currentY);
    doc.text(String(item.quantity ?? 0), 108, currentY);
    doc.text(formatCurrency(item.unit_price || 0), 138, currentY);
    doc.text(formatCurrency(total), 160, currentY);
    currentY += 8;
  });
  const subtotal = Number(data.total_ex_vat || 0);
  const vatRate = Number(data.vat_rate || 0);
  const vatAmount = subtotal * (vatRate / 100);
  const totalIncl = subtotal + vatAmount;
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotaal', 138, currentY + 6);
  doc.text(formatCurrency(subtotal), 160, currentY + 6);
  doc.text(`BTW (${vatRate.toFixed(1)}%)`, 138, currentY + 14);
  doc.text(formatCurrency(vatAmount), 160, currentY + 14);
  doc.text('Totaal', 138, currentY + 22);
  doc.text(formatCurrency(totalIncl), 160, currentY + 22);
  return { doc, invoice: data };
}

async function generateInvoicePdf(invoiceId) {
  try {
    const { doc, invoice } = await buildInvoicePdf(invoiceId);
    const blob = doc.output('blob');
    downloadFile(`factuur-${invoice.number}.pdf`, blob, 'application/pdf');
    createToast('Factuur PDF aangemaakt', 'success');
  } catch (error) {
    console.error(error);
    createToast('Kon factuur niet genereren', 'error');
  }
}
function openInvoiceEmailModal(invoice) {
  elements.invoiceEmailForm.reset();
  elements.emailInvoiceId.value = invoice.id;
  elements.emailRecipient.value = invoice.client?.email || '';
  elements.emailSubject.value = `Factuur ${invoice.number}`;
  elements.emailBody.value = 'Beste klant,\n\nZie bijgevoegd de factuur.\n\nMet vriendelijke groet,';
  openModal(elements.invoiceEmailModal);
}

async function handleInvoiceEmailSubmit(event) {
  event.preventDefault();
  if (!state.supabase) return;
  const invoiceId = elements.emailInvoiceId.value;
  try {
    const { doc, invoice } = await buildInvoicePdf(invoiceId);
    const pdfData = doc.output('datauristring');
    const pdfBase64 = pdfData.split(',')[1];
    const filename = `factuur-${invoice.number}.pdf`;
    const { error } = await getSupabase().functions.invoke('send-invoice', {
      body: {
        invoiceId,
        to: elements.emailRecipient.value,
        subject: elements.emailSubject.value,
        message: elements.emailBody.value,
        pdfBase64,
        filename,
      },
    });
    if (error) throw error;
    createToast('Factuur verzonden', 'success');
    closeModal(elements.invoiceEmailModal);
  } catch (error) {
    console.error(error);
    createToast(error.message || 'Versturen mislukt', 'error');
  }
}

function openDrawer() {
  if (!elements.invoiceClient.value) {
    createToast('Kies eerst een klant', 'error');
    return;
  }
  elements.drawerTable.innerHTML = '';
  elements.drawerStart.value = '';
  elements.drawerEnd.value = '';
  openModal(elements.drawer);
}

async function handleDrawerFilterSubmit(event) {
  event.preventDefault();
  const clientId = elements.invoiceClient.value;
  if (!clientId) {
    createToast('Kies eerst een klant', 'error');
    return;
  }
  let query = getSupabase()
    .from('time_entries')
    .select('*')
    .eq('user_id', state.user.id)
    .eq('client_id', Number(clientId))
    .order('started_at', { ascending: false });
  if (elements.drawerStart.value) {
    query = query.gte('started_at', new Date(elements.drawerStart.value).toISOString());
  }
  if (elements.drawerEnd.value) {
    query = query.lte('started_at', new Date(elements.drawerEnd.value).toISOString());
  }
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
          <td>${formatDate(entry.started_at)}</td>
          <td>${entry.note || '—'}</td>
          <td>${formatDuration(entry.seconds)}</td>
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
  selected
    .map((input) => state.drawerEntries.find((entry) => String(entry.id) === input.value))
    .filter(Boolean)
    .forEach((entry) => {
      addLineItem({
        description: entry.note || `Uren ${formatDate(entry.started_at)}`,
        quantity: Number(((entry.seconds || 0) / 3600).toFixed(2)),
        unit_price: getClientRate(entry.client_id) || 0,
      });
    });
  closeModal(elements.drawer);
}

function openTaskModal(task = null) {
  elements.taskForm.reset();
  elements.taskId.value = task?.id || '';
  elements.taskTitle.value = task?.title || '';
  elements.taskDeadline.value = task?.due_date || '';
  elements.taskPriority.value = String(task?.priority ?? 2);
  elements.taskDone.checked = Boolean(task?.done);
  elements.taskModalTitle.textContent = task ? 'Taak bewerken' : 'Nieuwe taak';
  openModal(elements.taskModal);
}

async function handleTaskSubmit(event) {
  event.preventDefault();
  if (!state.user) return;
  const payload = {
    user_id: state.user.id,
    title: elements.taskTitle.value.trim(),
    due_date: elements.taskDeadline.value || null,
    priority: Number(elements.taskPriority.value || 2),
    done: elements.taskDone.checked,
  };
  if (!payload.title) {
    createToast('Titel is verplicht', 'error');
    return;
  }
  try {
    const id = elements.taskId.value;
    if (id) {
      const { error } = await getSupabase()
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .eq('user_id', state.user.id);
      if (error) throw error;
      createToast('Taak bijgewerkt', 'success');
    } else {
      const { error } = await getSupabase().from('tasks').insert(payload);
      if (error) throw error;
      createToast('Taak aangemaakt', 'success');
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
  const statusFilter = elements.taskCompleteFilter?.value || 'all';
  const priorityFilter = elements.taskPriorityFilter?.value || 'all';
  const filtered = state.tasks.filter((task) => {
    const statusOk = statusFilter === 'all' || (statusFilter === 'done' ? task.done : !task.done);
    const priorityOk = priorityFilter === 'all' || String(task.priority) === priorityFilter;
    return statusOk && priorityOk;
  });
  elements.tasksEmpty?.classList.toggle('hidden', filtered.length > 0);
  elements.taskTable.innerHTML = filtered
    .map((task) => {
      const statusText = task.done ? 'Afgerond' : 'Openstaand';
      return `
        <tr data-id="${task.id}">
          <td>
            <strong>${task.title}</strong>
          </td>
          <td>${task.due_date ? formatDate(task.due_date) : '—'}</td>
          <td>${priorityLabel(task.priority)}</td>
          <td>${statusText}</td>
          <td class="table-actions">
            <button type="button" class="ghost-button" data-action="toggle">${task.done ? 'Markeer open' : 'Markeer klaar'}</button>
            <button type="button" class="ghost-button" data-action="edit">Bewerken</button>
            <button type="button" class="ghost-button" data-action="delete">Verwijder</button>
          </td>
        </tr>`;
    })
    .join('');
}

async function handleTaskTableClick(event) {
  const row = event.target.closest('tr[data-id]');
  if (!row) return;
  const id = Number(row.dataset.id);
  const task = state.tasks.find((item) => Number(item.id) === id);
  if (!task) return;
  if (event.target.matches('[data-action="edit"]')) {
    openTaskModal(task);
    return;
  }
  if (event.target.matches('[data-action="toggle"]')) {
    try {
      const { error } = await getSupabase()
        .from('tasks')
        .update({ done: !task.done })
        .eq('id', id)
        .eq('user_id', state.user.id);
      if (error) throw error;
      await loadTasks();
      renderTasks();
      renderDashboard();
    } catch (error) {
      console.error(error);
      createToast('Bijwerken mislukt', 'error');
    }
    return;
  }
  if (event.target.matches('[data-action="delete"]')) {
    if (!confirm('Verwijder deze taak?')) return;
    try {
      const { error } = await getSupabase()
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', state.user.id);
      if (error) throw error;
      createToast('Taak verwijderd', 'success');
      await loadTasks();
      renderTasks();
      renderDashboard();
    } catch (error) {
      console.error(error);
      createToast('Verwijderen mislukt', 'error');
    }
  }
}

function renderDashboard() {
  const periodDays = Number(elements.dashboardRange.value) || 30;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodDays);
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - periodDays);
  const previousEnd = new Date(startDate);

  const currentInvoices = state.invoices.filter((invoice) => {
    const date = invoice.issue_date ? new Date(invoice.issue_date) : null;
    return date && date >= startDate && date <= endDate;
  });
  const previousInvoices = state.invoices.filter((invoice) => {
    const date = invoice.issue_date ? new Date(invoice.issue_date) : null;
    return date && date >= previousStart && date < previousEnd;
  });
  const revenueNow = sumBy(currentInvoices, (invoice) => calculateInvoiceTotal(invoice));
  const revenuePrev = sumBy(previousInvoices, (invoice) => calculateInvoiceTotal(invoice));
  elements.metricRevenue.textContent = formatCurrency(revenueNow);
  elements.metricRevenueRange.textContent = `Laatste ${periodDays} dagen`;
  elements.metricRevenueDelta.textContent = formatDelta(revenueNow, revenuePrev);

  const currentEntries = state.timeEntries.filter((entry) => {
    const date = new Date(entry.started_at);
    return date >= startDate && date <= endDate;
  });
  const previousEntries = state.timeEntries.filter((entry) => {
    const date = new Date(entry.started_at);
    return date >= previousStart && date < previousEnd;
  });
  const hoursNow = sumBy(currentEntries, (entry) => entry.seconds || 0);
  const hoursPrev = sumBy(previousEntries, (entry) => entry.seconds || 0);
  elements.metricHours.textContent = formatDuration(hoursNow);
  elements.metricHoursRange.textContent = `Laatste ${periodDays} dagen`;
  elements.metricHoursDelta.textContent = formatDelta(hoursNow, hoursPrev);

  const openInvoices = state.invoices.filter((invoice) => !invoice.paid);
  elements.metricOpenInvoices.textContent = formatCurrency(
    sumBy(openInvoices, (invoice) => calculateInvoiceTotal(invoice))
  );
  elements.metricOpenCount.textContent = `${openInvoices.length} facturen`;

  const focusTasks = state.tasks.filter((task) => task.priority === 1 && !task.done);
  elements.metricPriority.textContent = `${focusTasks.length} taken`;

  const upcomingEvents = state.planning
    .filter((event) => {
      const date = new Date(event.starts_at);
      return date >= new Date() && date <= addDays(new Date(), 7);
    })
    .slice(0, 5);
  elements.dashboardEvents.innerHTML = upcomingEvents
    .map(
      (event) => `
        <li>
          <strong>${event.title}</strong>
          <span>${formatDateTime(event.starts_at)}</span>
          ${event.location ? `<span class="muted">${event.location}</span>` : ''}
        </li>`
    )
    .join('');

  const importantTasks = focusTasks
    .filter((task) => !task.due_date || new Date(task.due_date) <= endOfWeek(new Date()))
    .slice(0, 5);
  elements.dashboardTasks.innerHTML = importantTasks
    .map(
      (task) => `
        <li>
          <strong>${task.title}</strong>
          <span class="muted">${task.due_date ? formatDate(task.due_date) : 'Geen deadline'}</span>
        </li>`
    )
    .join('');

  renderChart();
}

function formatDelta(current, previous) {
  if (!previous) return '—';
  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)}%`;
}

function toggleChartMode() {
  state.chartMode = state.chartMode === 'revenue' ? 'hours' : 'revenue';
  elements.toggleChart.textContent = state.chartMode === 'revenue' ? 'Toon uren' : 'Toon omzet';
  renderChart();
}

function renderChart() {
  if (!elements.chartCanvas) return;
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    date.setDate(1);
    return date;
  });
  const labels = months.map((date) => date.toLocaleDateString('nl-NL', { month: 'short' }));
  const revenueData = months.map((date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return sumBy(state.invoices, (invoice) => {
      const issue = invoice.issue_date ? new Date(invoice.issue_date) : null;
      return issue && issue >= start && issue <= end ? calculateInvoiceTotal(invoice) : 0;
    });
  });
  const hoursData = months.map((date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return sumBy(state.timeEntries, (entry) => {
      const logged = new Date(entry.started_at);
      return logged >= start && logged <= end ? (entry.seconds || 0) / 3600 : 0;
    });
  });
  const dataset = state.chartMode === 'revenue' ? revenueData : hoursData;
  const label = state.chartMode === 'revenue' ? 'Omzet (EUR)' : 'Uren';
  const color = state.chartMode === 'revenue' ? '#38bdf8' : '#a855f7';
  if (state.chart) {
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].data = dataset;
    state.chart.data.datasets[0].label = label;
    state.chart.data.datasets[0].backgroundColor = color;
    state.chart.data.datasets[0].borderColor = color;
    state.chart.update();
  } else {
    state.chart = new Chart(elements.chartCanvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label,
            data: dataset,
            backgroundColor: color,
            borderColor: color,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            ticks: {
              callback: (value) => (state.chartMode === 'revenue' ? formatCurrency(value) : `${value}u`),
            },
          },
        },
      },
    });
  }
}

function startOfMonth(date) {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function endOfMonth(date) {
  const end = new Date(date);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return end;
}

function openModal(modal) {
  if (!modal) return;
  modal.classList.remove('hidden');
  elements.backdrop?.classList.remove('hidden');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('hidden');
  const anyOpen = Array.from(document.querySelectorAll('.modal, .drawer')).some(
    (item) => !item.classList.contains('hidden')
  );
  if (!anyOpen) {
    elements.backdrop?.classList.add('hidden');
  }
}
