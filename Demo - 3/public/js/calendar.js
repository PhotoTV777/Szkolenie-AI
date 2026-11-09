const calendarSection = document.getElementById('calendar-section');
const calendarTitle = document.getElementById('calendar-title');
const calendarGrid = document.getElementById('calendar-grid');
const calendarStatus = document.getElementById('calendar-status');

const WEEKDAY_LABELS = ['pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.', 'niedz.'];
const MONTH_LABELS = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

let weekStart = startOfWeekMonday(new Date());
let selectedRoomId = null;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatIsoLocal(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfWeekMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function getWeekDays(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function formatWeekTitle(days) {
  const first = days[0];
  const last = days[6];
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} ${MONTH_LABELS[first.getMonth()]} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${MONTH_LABELS[first.getMonth()]} – ${last.getDate()} ${MONTH_LABELS[last.getMonth()]} ${last.getFullYear()}`;
}

function setCalendarStatus(message, isError = false) {
  setBanner(calendarStatus, message, isError ? 'error' : 'info');
  if (message) {
    calendarStatus.classList.add('mb-4');
  }
}

function groupByDate(reservations) {
  /** @type {Record<string, typeof reservations>} */
  const map = {};
  for (const item of reservations) {
    if (!map[item.date]) {
      map[item.date] = [];
    }
    map[item.date].push(item);
  }
  return map;
}

function renderCalendar(days, reservations) {
  const byDate = groupByDate(reservations);
  calendarTitle.textContent = formatWeekTitle(days);

  calendarGrid.innerHTML = days
    .map((day) => {
      const iso = formatIsoLocal(day);
      const items = byDate[iso] || [];
      const jsDay = day.getDay();
      const labelIndex = jsDay === 0 ? 6 : jsDay - 1;
      const blocks =
        items.length === 0
          ? '<p class="py-6 text-center text-[11px] text-ink-500/60">Brak</p>'
          : items
              .map((r) => {
                const purpose = escapeHtml(r.purpose);
                const person = escapeHtml(r.person_name);
                return `
          <article class="border-l-2 border-accent bg-white py-2 pl-2 pr-1 text-left shadow-sm ring-1 ring-ink-200/80">
            <p class="text-[11px] font-semibold tabular-nums leading-none text-accent">${escapeHtml(r.time_start)}–${escapeHtml(r.time_end)}</p>
            <p class="mt-1.5 line-clamp-3 text-[11px] font-medium leading-snug text-ink-950" title="${purpose}">${purpose}</p>
            <p class="mt-1 truncate text-[10px] text-ink-500" title="${person}">${person}</p>
          </article>
        `;
              })
              .join('');

      const isToday = formatIsoLocal(day) === formatIsoLocal(new Date());
      const dayHead = isToday
        ? 'bg-accent text-white'
        : 'bg-ink-100 text-ink-700';
      const dayBody = isToday ? 'bg-accent-soft/50 ring-1 ring-accent-ring' : 'bg-ink-50';

      return `
        <div class="flex min-h-[11rem] flex-col overflow-hidden rounded-lg ${dayBody}">
          <header class="px-2 py-1.5 text-center ${dayHead}">
            <p class="text-[10px] font-semibold uppercase tracking-wide opacity-90">${WEEKDAY_LABELS[labelIndex]}</p>
            <p class="text-sm font-bold tabular-nums">${day.getDate()}.${pad2(day.getMonth() + 1)}</p>
          </header>
          <div class="flex flex-1 flex-col gap-1.5 p-1.5">${blocks}</div>
        </div>
      `;
    })
    .join('');
}

async function refreshCalendar() {
  if (!selectedRoomId) {
    calendarSection.classList.add('hidden');
    return;
  }

  calendarSection.classList.remove('hidden');
  const days = getWeekDays(weekStart);
  const from = formatIsoLocal(days[0]);
  const to = formatIsoLocal(days[6]);

  setCalendarStatus('Ładowanie rezerwacji…');
  calendarGrid.innerHTML = '';

  try {
    const reservations = await apiGet(
      `/api/rooms/${selectedRoomId}/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    setCalendarStatus('');
    renderCalendar(days, reservations);
  } catch (err) {
    setCalendarStatus(err.message, true);
    calendarGrid.innerHTML = '';
  }
}

function onRoomSelected(roomId) {
  selectedRoomId = roomId;
  refreshCalendar();
  window.reservationForm?.onRoomSelected?.(roomId);
}

function getSelectedRoomId() {
  return selectedRoomId;
}

function goPrevWeek() {
  weekStart = addDays(weekStart, -7);
  refreshCalendar();
}

function goNextWeek() {
  weekStart = addDays(weekStart, 7);
  refreshCalendar();
}

function goThisWeek() {
  weekStart = startOfWeekMonday(new Date());
  refreshCalendar();
}

document.getElementById('week-prev')?.addEventListener('click', goPrevWeek);
document.getElementById('week-next')?.addEventListener('click', goNextWeek);
document.getElementById('week-today')?.addEventListener('click', goThisWeek);

function jumpToWeekContaining(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  weekStart = startOfWeekMonday(new Date(y, m - 1, d));
  return refreshCalendar();
}

window.roomCalendar = {
  onRoomSelected,
  getSelectedRoomId,
  refresh: refreshCalendar,
  jumpToWeekContaining,
};
