export const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export function formatCurrency(value) {
  const numeric = typeof value === 'number' ? value : Number(value) || 0;
  return currencyFormatter.format(numeric);
}

export function formatDuration(seconds = 0) {
  const sec = Math.max(0, Math.round(seconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const rest = sec % 60;
  return [hours, minutes, rest]
    .map((unit) => String(unit).padStart(2, '0'))
    .join(':');
}

export function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString('nl-NL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getISODate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
}

export function getISODateTimeLocal(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function formatWeekRange(date = new Date()) {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function groupBy(array, keyFn) {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function sumBy(array, valueFn) {
  return array.reduce((sum, item) => sum + (valueFn(item) || 0), 0);
}

export function toCSV(rows, delimiter = ';') {
  return rows
    .map((row) => row.map((cell) => escapeCSVCell(cell, delimiter)).join(delimiter))
    .join('\n');
}

function escapeCSVCell(value, delimiter) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(delimiter) || str.includes('\"') || str.includes('\n')) {
    return `"${str.replace(/\"/g, '""')}"`;
  }
  return str;
}

export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

export function buildICS(events) {
  const header = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MeesterCRM//NL'];
  const footer = ['END:VCALENDAR'];
  const body = events.map((event) => formatICSEvent(event));
  return [...header, ...body, ...footer].join('\r\n');
}

function formatICSEvent(event) {
  const start = formatICSDate(event.start);
  const end = formatICSDate(event.end);
  const uid = event.id || crypto.randomUUID();
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${escapeICS(event.url)}`);
  }
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

function formatICSDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeICS(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

export function parseICS(text) {
  const events = [];
  const lines = text.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      current = {};
    } else if (line.startsWith('END:VEVENT') && current) {
      events.push(current);
      current = null;
    } else if (current) {
      const [rawKey, ...rest] = line.split(':');
      const key = rawKey.split(';')[0];
      const value = rest.join(':');
      switch (key) {
        case 'SUMMARY':
          current.title = value;
          break;
        case 'DESCRIPTION':
          current.description = value;
          break;
        case 'DTSTART':
          current.start = parseICSDate(value);
          break;
        case 'DTEND':
          current.end = parseICSDate(value);
          break;
        case 'LOCATION':
          current.location = value;
          break;
        case 'URL':
          current.url = value;
          break;
      }
    }
  }
  return events;
}

function parseICSDate(value) {
  if (!value) return null;
  if (value.endsWith('Z')) {
    return new Date(value);
  }
  const match = value.match(/(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})?/);
  if (!match) return null;
  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
}

export function debounce(fn, wait = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

export function unique(array, keyFn) {
  const set = new Set();
  return array.filter((item) => {
    const key = keyFn(item);
    if (set.has(key)) return false;
    set.add(key);
    return true;
  });
}

export function createToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span><button aria-label="Sluiten">×</button>`;
  const close = () => {
    toast.remove();
  };
  toast.querySelector('button').addEventListener('click', close);
  container.appendChild(toast);
  setTimeout(close, 5000);
}

export function priorityLabel(priority) {
  switch (priority) {
    case 'high':
      return 'Hoog';
    case 'medium':
      return 'Middel';
    case 'low':
      return 'Laag';
    default:
      return priority;
  }
}

export function statusLabel(status) {
  const map = {
    open: 'Open',
    in_behandeling: 'In behandeling',
    done: 'Afgerond',
    concept: 'Concept',
    verzonden: 'Verzonden',
    betaald: 'Betaald',
    vervallen: 'Vervallen',
  };
  return map[status] || status;
}
