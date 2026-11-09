import { REMINDER_PRESETS, localDateKey } from './domain.js'

export const today = () => localDateKey()
export const dateFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })

export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

export function formatDate(value) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.valueOf()) ? value : dateFormatter.format(date)
}

export function formatAgendaTime(agenda) {
  if (agenda.allDay) return 'Sepanjang hari'
  const start = new Date(agenda.startsAt)
  const end = new Date(agenda.endsAt)
  return `${timeFormatter.format(start)}–${timeFormatter.format(end)}`
}

export function formatReminder(minutes) {
  if (minutes % 1440 === 0) return `${minutes / 1440} hari sebelumnya`
  if (minutes % 60 === 0) return `${minutes / 60} jam sebelumnya`
  return `${minutes} menit sebelumnya`
}

export function renderReminderFields(reminders, allDay, prefix) {
  const selected = reminders ?? [allDay ? 1440 : 30]
  const customReminder = selected.find((minutes) => !REMINDER_PRESETS.includes(minutes))
  const presets = REMINDER_PRESETS.map((minutes) => `
    <label class="checkbox-label"><input type="checkbox" name="reminderOffsets" value="${minutes}" ${selected.includes(minutes) ? 'checked' : ''}> ${formatReminder(minutes)}</label>`).join('')
  return `<fieldset class="course-options reminder-options"><legend>Pengingat <span>(pengaturan tersimpan, belum mengirim notifikasi)</span></legend>
    <div class="reminder-grid">${presets}</div>
    <label for="${prefix}-custom-reminder">Durasi khusus <span>(menit sebelum agenda, opsional)</span></label>
    <input id="${prefix}-custom-reminder" name="customReminderMinutes" type="number" min="1" max="525600" step="1" value="${customReminder ?? ''}" placeholder="Contoh: 90">
  </fieldset>`
}

export function readReminderValues(form) {
  const values = form.getAll('reminderOffsets').map(Number)
  const customValue = String(form.get('customReminderMinutes') ?? '').trim()
  if (customValue) {
    const custom = Number(customValue)
    if (!Number.isInteger(custom) || custom < 1 || custom > 525600) {
      throw new Error('Durasi khusus harus berupa bilangan bulat 1 hingga 525600 menit.')
    }
    values.push(custom)
  }
  return values
}

export function setDefaultReminder(dialog, prefix, minutes) {
  dialog.querySelectorAll(`input[name="reminderOffsets"]`).forEach((input) => {
    input.checked = Number(input.value) === minutes
  })
  const customInput = dialog.querySelector(`#${prefix}-custom-reminder`)
  if (customInput) customInput.value = ''
}

export function byDateAndTitle(left, right) {
  const leftDate = left.startsAt ?? `${left.date ?? left.dueDate ?? ''}T00:00:00`
  const rightDate = right.startsAt ?? `${right.date ?? right.dueDate ?? ''}T00:00:00`
  return leftDate.localeCompare(rightDate) || left.title.localeCompare(right.title, 'id')
}

export function dateOffset(value, days) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)
  return localDateKey(date)
}
