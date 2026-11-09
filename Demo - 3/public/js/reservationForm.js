const formSection = document.getElementById('reservation-form-section');
const formEl = document.getElementById('reservation-form');
const formStatusEl = document.getElementById('reservation-form-status');
const submitBtn = document.getElementById('reservation-submit');

function setFormStatus(message, type = 'error') {
  setBanner(formStatusEl, message, type);
  if (message) {
    formStatusEl.classList.add('mb-4');
  }
}

function onRoomSelected(roomId) {
  if (!roomId) {
    formSection.classList.add('hidden');
    return;
  }
  formSection.classList.remove('hidden');
  setFormStatus('');
}

function readFormData() {
  const formData = new FormData(formEl);
  return {
    date: String(formData.get('date') || '').trim(),
    time_start: String(formData.get('time_start') || '').trim(),
    time_end: String(formData.get('time_end') || '').trim(),
    purpose: String(formData.get('purpose') || '').trim(),
    person_name: String(formData.get('person_name') || '').trim(),
  };
}

async function handleSubmit(event) {
  event.preventDefault();

  const roomId = window.roomCalendar?.getSelectedRoomId?.();
  if (!roomId) {
    setFormStatus('Najpierw wybierz salę z listy.');
    return;
  }

  const payload = readFormData();
  setFormStatus('');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Zapisywanie…';

  try {
    const result = await apiPost(
      `/api/rooms/${roomId}/reservations`,
      payload
    );

    if (!result.ok) {
      setFormStatus(
        result.error || 'Nie udało się dodać rezerwacji.',
        result.status === 409 ? 'error' : 'error'
      );
      return;
    }

    setFormStatus('Rezerwacja została dodana.', 'success');
    await window.roomCalendar.jumpToWeekContaining(payload.date);
  } catch (err) {
    setFormStatus(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Zarezerwuj';
  }
}

formEl?.addEventListener('submit', handleSubmit);

window.reservationForm = {
  onRoomSelected,
};
