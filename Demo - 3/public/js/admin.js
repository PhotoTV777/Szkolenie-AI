const ADMIN_KEY_STORAGE = 'rezerwacja-sal-admin-key';

const statusEl = document.getElementById('status');
const formStatusEl = document.getElementById('form-status');
const roomsBodyEl = document.getElementById('rooms-list');
const roomsEmptyEl = document.getElementById('rooms-empty');
const roomsCountEl = document.getElementById('rooms-count');
const roomsTable = roomsBodyEl?.closest('table');
const formEl = document.getElementById('room-form');
const submitBtn = document.getElementById('room-submit');
const adminKeyInput = document.getElementById('admin-key');

function setFormStatus(message, type = 'error') {
  setBanner(formStatusEl, message, type);
  if (message) {
    formStatusEl.classList.add('mb-4');
  }
}

function setPageStatus(message, type = 'info') {
  setBanner(statusEl, message, type);
}

function getAdminHeaders() {
  const key = adminKeyInput.value.trim();
  if (!key) {
    return {};
  }
  return { 'X-Admin-Key': key };
}

function equipmentCell(room) {
  const tags = [];
  if (room.has_projector) {
    tags.push(
      '<span class="inline-block rounded-md bg-violet-50 px-1.5 py-0.5 text-[11px] font-medium text-violet-800">Projektor</span>'
    );
  }
  if (room.has_computers) {
    tags.push(
      '<span class="inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-800">Komputery</span>'
    );
  }
  if (tags.length === 0) {
    return '<span class="text-xs text-ink-500">Standard</span>';
  }
  return `<div class="flex flex-wrap gap-1">${tags.join('')}</div>`;
}

function renderRoomList(rooms) {
  const sorted = [...rooms].sort((a, b) => {
    const bc = a.building.localeCompare(b.building, 'pl');
    return bc !== 0 ? bc : a.name.localeCompare(b.name, 'pl');
  });

  if (roomsCountEl) {
    const n = sorted.length;
    roomsCountEl.textContent =
      n === 0 ? '' : n === 1 ? '1 sala' : `${n} ${n < 5 ? 'sale' : 'sal'}`;
  }

  if (sorted.length === 0) {
    roomsBodyEl.innerHTML = '';
    roomsTable?.classList.add('hidden');
    roomsEmptyEl?.classList.remove('hidden');
    return;
  }

  roomsTable?.classList.remove('hidden');
  roomsEmptyEl?.classList.add('hidden');

  roomsBodyEl.innerHTML = sorted
    .map(
      (room) => `
    <tr class="hover:bg-ink-50/80">
      <td class="px-4 py-3 font-medium text-ink-950">${escapeHtml(room.name)}</td>
      <td class="px-4 py-3 text-ink-600">${escapeHtml(room.building)}</td>
      <td class="px-4 py-3 text-right tabular-nums text-ink-700">${room.capacity}</td>
      <td class="px-4 py-3">${equipmentCell(room)}</td>
    </tr>
  `
    )
    .join('');
}

async function loadRooms() {
  setPageStatus('Ładowanie katalogu…', 'info');
  try {
    const rooms = await apiGet('/api/rooms');
    setPageStatus('');
    renderRoomList(rooms);
  } catch (err) {
    setPageStatus(err.message, 'error');
    roomsBodyEl.innerHTML = '';
    roomsTable?.classList.add('hidden');
    roomsEmptyEl?.classList.remove('hidden');
    if (roomsCountEl) roomsCountEl.textContent = '';
  }
}

function readRoomPayload() {
  const data = new FormData(formEl);
  const capacity = Number(data.get('capacity'));
  if (!Number.isInteger(capacity) || capacity < 1) {
    return { error: 'Liczba miejsc musi być liczbą całkowitą większą od 0.' };
  }

  const name = String(data.get('name') || '').trim();
  const building = String(data.get('building') || '').trim();
  if (!name || !building) {
    return { error: 'Nazwa sali i budynek są wymagane.' };
  }

  return {
    payload: {
      name,
      building,
      capacity,
      has_projector: data.get('has_projector') === 'on',
      has_computers: data.get('has_computers') === 'on',
    },
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  setFormStatus('');

  const parsed = readRoomPayload();
  if (parsed.error) {
    setFormStatus(parsed.error);
    return;
  }

  const adminKey = adminKeyInput.value.trim();
  if (adminKey) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
  }

  submitBtn.disabled = true;
  const prevLabel = submitBtn.textContent;
  submitBtn.textContent = 'Zapisywanie…';

  try {
    const result = await apiPost('/api/rooms', parsed.payload, getAdminHeaders());
    if (!result.ok) {
      setFormStatus(result.error || 'Nie udało się dodać sali.');
      return;
    }

    setFormStatus('Sala została dodana i jest widoczna na stronie rezerwacji.', 'success');
    formEl.reset();
    if (adminKey) {
      adminKeyInput.value = adminKey;
    }
    await loadRooms();
  } catch (err) {
    setFormStatus(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = prevLabel;
  }
}

const savedKey = sessionStorage.getItem(ADMIN_KEY_STORAGE);
if (savedKey) {
  adminKeyInput.value = savedKey;
}

formEl.addEventListener('submit', handleSubmit);
document.addEventListener('DOMContentLoaded', loadRooms);
