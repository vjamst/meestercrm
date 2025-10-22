export function formatCurrency(value = 0) {
  const number = Number(value) || 0;
  return number.toLocaleString('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  });
}

export function formatDuration(seconds = 0) {
  const total = Number(seconds) || 0;
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  return [hrs, mins, secs]
    .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, '0')))
    .join(':');
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getISODate(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10);
}

export function getISODateTimeLocal(date = new Date()) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfWeek(date = new Date()) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatWeekRange(date) {
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  const formatter = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });
  return `${formatter.format(start)} – ${formatter.format(end)} (${start.getFullYear()})`;
}

export function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function sumBy(items, valueFn) {
  return items.reduce((total, item) => total + Number(valueFn(item) || 0), 0);
}

export function toCSV(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell ?? '';
          if (typeof value === 'number') return value;
          const escaped = String(value).replace(/"/g, '""');
          if (/[,"\n]/.test(escaped)) {
            return `"${escaped}"`;
          }
          return escaped;
        })
        .join(',')
    )
    .join('\n');
}

export function downloadFile(filename, content, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildICS(events = []) {
  const header = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MeesterCRM//NL'];
  const body = events.map((event) => {
    const start = formatIcsDate(event.start);
    const end = formatIcsDate(event.end || event.start);
    const uid = event.id || crypto.randomUUID();
    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcs(event.title || '')}`,
      event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : null,
      event.location ? `LOCATION:${escapeIcs(event.location)}` : null,
      event.url ? `URL:${escapeIcs(event.url)}` : null,
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n');
  });
  return [...header, ...body, 'END:VCALENDAR'].join('\r\n');
}

function formatIcsDate(value) {
  const date = new Date(value);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcs(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,');
}

export function parseICS(content) {
  const events = [];
  const lines = content.split(/\r?\n/);
  let current = null;
  for (const raw of lines) {
    if (raw === 'BEGIN:VEVENT') {
      current = {};
    } else if (raw === 'END:VEVENT') {
      if (current) events.push(current);
      current = null;
    } else if (current) {
      const [key, ...valueParts] = raw.split(':');
      const value = valueParts.join(':');
      if (key.startsWith('DTSTART')) current.start = parseIcsDate(value);
      if (key.startsWith('DTEND')) current.end = parseIcsDate(value);
      if (key === 'SUMMARY') current.title = value;
      if (key === 'DESCRIPTION') current.description = value;
      if (key === 'LOCATION') current.location = value;
      if (key === 'URL') current.url = value;
    }
  }
  return events.filter((event) => event.start);
}

function parseIcsDate(value) {
  if (!value) return null;
  const matches = /^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})/.exec(value);
  if (!matches) return null;
  const [, year, month, day, hour, minute, second] = matches;
  return new Date(Date.UTC(year, Number(month) - 1, day, hour, minute, second)).toISOString();
}

let toastTimeout;

export function createToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  clearTimeout(toastTimeout);
  container.innerHTML = '';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  toastTimeout = setTimeout(() => {
    toast.remove();
  }, 3200);
}

export function priorityLabel(priority) {
  const value = Number(priority);
  if (value === 1) return 'Hoog';
  if (value === 3) return 'Laag';
  return 'Normaal';
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
