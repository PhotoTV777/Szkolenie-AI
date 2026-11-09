const statusEl = document.getElementById('status');
const roomsEl = document.getElementById('rooms-list');
const selectedRoomNameEl = document.getElementById('selected-room-name');
const calendarPlaceholder = document.getElementById('calendar-placeholder');

let roomsCache = [];

function setStatus(message, type = 'info') {
  setBanner(statusEl, message, type);
}

function equipmentText(room) {
  const parts = [];
  if (room.has_projector) parts.push('projektor');
  if (room.has_computers) parts.push('komputery');
  return parts.length ? parts.join(', ') : 'standard';
}

function renderRooms(rooms) {
  roomsCache = rooms;

  if (rooms.length === 0) {
    roomsEl.innerHTML =
      '<p class="text-sm text-ink-500">Brak sal w systemie.</p>';
    return;
  }

  roomsEl.innerHTML = rooms
    .map(
      (room) => `
    <button
      type="button"
      class="room-item w-full rounded-lg border border-ink-200 bg-white px-3 py-3 text-left transition hover:border-ink-500/25 hover:bg-ink-50"
      data-room-id="${room.id}"
      aria-pressed="false"
    >
      <div class="flex items-baseline justify-between gap-2">
        <span class="font-semibold text-ink-950">${escapeHtml(room.name)}</span>
        <span class="shrink-0 text-xs font-medium tabular-nums text-ink-500">${room.capacity} os.</span>
      </div>
      <p class="mt-0.5 truncate text-xs text-ink-500">${escapeHtml(room.building)}</p>
      <p class="mt-1.5 truncate text-[11px] capitalize text-ink-500/90">${escapeHtml(equipmentText(room))}</p>
    </button>
  `
    )
    .join('');

  bindRoomSelection(rooms);
}

function bindRoomSelection(rooms) {
  const previous =
    window.roomCalendar?.getSelectedRoomId?.() ??
    (rooms[0] ? rooms[0].id : null);

  roomsEl.querySelectorAll('.room-item').forEach((btn) => {
    btn.addEventListener('click', () => selectRoom(Number(btn.dataset.roomId)));
  });

  if (previous) {
    selectRoom(previous, { scroll: false });
  }
}

function updateSelectedRoomLabel(roomId) {
  if (!selectedRoomNameEl) return;
  const room = roomsCache.find((r) => r.id === roomId);
  selectedRoomNameEl.textContent = room
    ? `${room.name}, ${room.building}`
    : '—';
}

function selectRoom(roomId, options = {}) {
  roomsEl.querySelectorAll('.room-item').forEach((btn) => {
    const active = Number(btn.dataset.roomId) === roomId;
    btn.classList.toggle('border-accent', active);
    btn.classList.toggle('bg-accent-soft', active);
    btn.classList.toggle('ring-1', active);
    btn.classList.toggle('ring-accent-ring', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  updateSelectedRoomLabel(roomId);

  const calendarSection = document.getElementById('calendar-section');
  if (calendarSection) {
    calendarSection.classList.remove('hidden');
  }
  calendarPlaceholder?.classList.add('hidden');

  window.roomCalendar?.onRoomSelected(roomId);

  if (options.scroll !== false) {
    calendarSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function loadRooms() {
  setStatus('Ładowanie…', 'info');
  roomsEl.innerHTML = '';

  try {
    const rooms = await apiGet('/api/rooms');
    setStatus('');
    renderRooms(rooms);
  } catch (err) {
    setStatus(err.message, 'error');
    roomsEl.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', loadRooms);
