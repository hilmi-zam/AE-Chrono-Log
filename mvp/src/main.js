import './style.css'
import { listRecords, listRecoverySnapshots, openDatabase, readBackupRecords, restoreBackupRecords, saveConvertedRecord, saveOccurrenceException, saveRecord, softDeleteRecord } from './db.js'
import { AGENDA_COLORS, COURSE_COLORS, expandAgendaOccurrences, isOverdue, localDateKey, normalizeAgenda, normalizeCourse, normalizeInbox, normalizeOccurrenceException, normalizeTask, REMINDER_PRESETS, TASK_STATUSES } from './domain.js'
import { createBackup, parseBackup } from './backup.js'

const app = document.querySelector('#app')
const SERVICE_WORKER_CACHE_VERSION = 'v2'
const state = {
  database: null,
  page: 'dashboard',
  tasks: [],
  agendas: [],
  inbox: [],
  courses: [],
  selectedCourseId: '',
  showArchivedCourses: false,
  calendarView: 'week',
  calendarDate: localDateKey(),
  message: '',
  query: '',
  searchType: 'all',
  searchFrom: '',
  searchTo: '',
  searchReturnPage: 'dashboard',
  taskFilter: 'Aktif',
  inboxView: 'active',
  recoverySnapshots: [],
  isMoreOpen: false,
}

const today = () => localDateKey()
const dateFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.valueOf()) ? value : dateFormatter.format(date)
}

function formatAgendaTime(agenda) {
  if (agenda.allDay) return 'Sepanjang hari'
  const start = new Date(agenda.startsAt)
  const end = new Date(agenda.endsAt)
  return `${timeFormatter.format(start)}–${timeFormatter.format(end)}`
}

function formatReminder(minutes) {
  if (minutes % 1440 === 0) return `${minutes / 1440} hari sebelumnya`
  if (minutes % 60 === 0) return `${minutes / 60} jam sebelumnya`
  return `${minutes} menit sebelumnya`
}

function renderReminderFields(reminders, allDay, prefix) {
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

function readReminderValues(form) {
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

function setDefaultReminder(dialog, prefix, minutes) {
  dialog.querySelectorAll(`input[name="reminderOffsets"]`).forEach((input) => {
    input.checked = Number(input.value) === minutes
  })
  const customInput = dialog.querySelector(`#${prefix}-custom-reminder`)
  if (customInput) customInput.value = ''
}

function byDateAndTitle(left, right) {
  const leftDate = left.startsAt ?? `${left.date ?? left.dueDate ?? ''}T00:00:00`
  const rightDate = right.startsAt ?? `${right.date ?? right.dueDate ?? ''}T00:00:00`
  return leftDate.localeCompare(rightDate) || left.title.localeCompare(right.title, 'id')
}

async function refreshData() {
  ;[state.tasks, state.agendas, state.inbox, state.courses, state.recoverySnapshots] = await Promise.all([
    listRecords(state.database, 'tasks'),
    listRecords(state.database, 'agendas'),
    listRecords(state.database, 'inbox'),
    listRecords(state.database, 'courses'),
    listRecoverySnapshots(state.database),
  ])
  render()
}

function pageTitle() {
  return ({
    dashboard: ['Ruang hari ini', 'Ringkasan personal'],
    agenda: ['Agenda', 'Semua kegiatan'],
    tasks: ['Tugas', 'Yang perlu dituntaskan'],
    courses: ['Mata kuliah', 'Penawaran per periode'],
    inbox: ['Inbox', 'Tangkap dulu, rapikan nanti'],
    notifications: ['Pusat notifikasi', 'Pratinjau pengingat lokal'],
    settings: ['Pengaturan', 'Data dan preferensi lokal'],
    search: ['Hasil pencarian', 'Cari di seluruh ruang personal'],
  })[state.page]
}

function activeTasks() {
  return state.tasks.filter((task) => task.status !== 'Selesai').sort((a, b) => {
    if (!a.dueDate) return b.dueDate ? 1 : a.title.localeCompare(b.title, 'id')
    if (!b.dueDate) return -1
    return a.dueDate.localeCompare(b.dueDate)
  })
}

function todayAgendas() {
  return expandAgendaOccurrences(state.agendas, today(), today())
}

function dateOffset(value, days) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)
  return localDateKey(date)
}

function startOfWeek(value) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7))
  return localDateKey(date)
}

function startOfMonth(value) {
  return `${value.slice(0, 7)}-01`
}

function endOfMonth(value) {
  const [year, month] = value.slice(0, 7).split('-').map(Number)
  return localDateKey(new Date(year, month, 0))
}

function calendarRange() {
  if (state.calendarView === 'day') return [state.calendarDate, state.calendarDate]
  if (state.calendarView === 'week') {
    const start = startOfWeek(state.calendarDate)
    return [start, dateOffset(start, 6)]
  }
  const first = startOfMonth(state.calendarDate)
  const last = endOfMonth(state.calendarDate)
  const start = startOfWeek(first)
  const end = dateOffset(startOfWeek(last), 6)
  return [start, end]
}

function calendarEvents(fromDate, throughDate) {
  const agendas = expandAgendaOccurrences(state.agendas, fromDate, throughDate)
  const deadlines = state.tasks
    .filter((task) => task.dueDate && task.dueDate >= fromDate && task.dueDate <= throughDate)
    .map((task) => ({
      id: task.id,
      title: task.title,
      date: task.dueDate,
      allDay: true,
      startsAt: null,
      endsAt: null,
      isTask: true,
      status: task.status,
    }))
  return [...agendas, ...deadlines].sort(byDateAndTitle)
}

function agendaOccurrences(fromDate, throughDate) {
  return expandAgendaOccurrences(state.agendas, fromDate, throughDate)
}

function renderCalendarEntry(item, compact = false) {
  const date = item.date
  const time = item.isTask ? 'Deadline' : formatAgendaTime(item)
  const color = /^#[\da-f]{6}$/i.test(item.categoryColor ?? '') ? item.categoryColor : AGENDA_COLORS[0]
  const details = [
    time,
    item.category,
    item.courseId ? state.courses.find((course) => course.id === item.courseId)?.name : '',
    item.location,
    item.status === 'cancelled' ? 'Dibatalkan' : '',
  ].filter(Boolean).join(' · ')

  if (!compact) {
    return `<article class="calendar-day-entry${item.status === 'cancelled' ? ' is-cancelled' : ''}${item.isTask ? ' is-task-deadline' : ''}" ${item.isTask ? '' : `style="--event-color:${color}"`}>
      <div class="record-time">${escapeHTML(time)}</div>
      <div class="record-copy"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(details)}</p>${item.topic ? `<p><strong>${escapeHTML(item.topic)}</strong></p>` : ''}${item.summary ? `<p class="record-description">${escapeHTML(item.summary)}</p>` : ''}${item.materialUrl ? `<p><a href="${escapeHTML(item.materialUrl)}" target="_blank" rel="noopener noreferrer">Buka materi</a></p>` : ''}</div>
      ${item.isTask
        ? `<button class="button button-small" type="button" data-action="calendar-task" data-id="${escapeHTML(item.id)}">Lihat tugas</button>`
        : item.recurrence?.frequency === 'weekly'
          ? `<button class="button button-small" type="button" data-action="occurrence-edit" data-id="${escapeHTML(item.seriesId)}" data-date="${escapeHTML(item.originalDate)}">Ubah pertemuan</button>`
            : `<button class="button button-small" type="button" data-action="agenda-edit" data-id="${escapeHTML(item.id)}">Edit agenda</button><button class="icon-button" type="button" data-action="delete" data-store="agendas" data-id="${escapeHTML(item.id)}" aria-label="Hapus agenda ${escapeHTML(item.title)}">×</button>`}
    </article>`
  }

  const action = item.isTask ? 'calendar-task' : item.recurrence?.frequency === 'weekly' ? 'occurrence-edit' : 'calendar-select-date'
  return `<button class="calendar-event${item.isTask ? ' calendar-event-task' : ''}${item.status === 'cancelled' ? ' calendar-event-cancelled' : ''}" type="button" ${item.isTask ? '' : `style="--event-color:${color}"`} data-action="${action}" data-id="${escapeHTML(item.isTask ? item.id : item.seriesId ?? item.id)}" data-date="${escapeHTML(item.originalDate ?? date)}" title="${escapeHTML(`${item.title} · ${details}`)}">
    <span>${escapeHTML(item.isTask ? 'Tugas' : time)}</span><strong>${escapeHTML(item.title)}</strong>
  </button>`
}

function renderDayCalendar(date) {
  const events = calendarEvents(date, date)
  return `<div class="calendar-day-list"><div class="calendar-date-heading">${escapeHTML(dateFormatter.format(new Date(`${date}T12:00:00`)))}</div>
    ${events.length ? events.map((item) => renderCalendarEntry(item)).join('') : emptyState('Tidak ada kegiatan', 'Agenda dan deadline pada tanggal ini akan muncul di sini.')}</div>`
}

function renderWeekCalendar(start) {
  const weekdays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
  return `<div class="calendar-week-grid">${weekdays.map((weekday, index) => {
    const date = dateOffset(start, index)
    const events = calendarEvents(date, date)
    return `<section class="calendar-day-column"><button class="calendar-day-heading" type="button" data-action="calendar-select-date" data-date="${date}"><span>${weekday}</span><strong>${date.slice(8, 10)}</strong></button>
      <div class="calendar-day-events">${events.length ? events.map((item) => renderCalendarEntry(item, true)).join('') : '<span class="calendar-no-events">—</span>'}</div></section>`
  }).join('')}</div>`
}

function renderMonthCalendar(start, end) {
  const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
  const isCurrentMonth = (date) => date.slice(0, 7) === state.calendarDate.slice(0, 7)
  const cells = []
  for (let date = start; date <= end; date = dateOffset(date, 1)) {
    const events = calendarEvents(date, date)
    cells.push(`<section class="calendar-month-cell${isCurrentMonth(date) ? '' : ' is-outside-month'}${date === today() ? ' is-today' : ''}">
      <button class="calendar-day-heading" type="button" data-action="calendar-select-date" data-date="${date}" aria-label="Lihat ${escapeHTML(formatDate(date))}"><strong>${date.slice(8, 10)}</strong></button>
      <div class="calendar-month-events">${events.slice(0, 3).map((item) => renderCalendarEntry(item, true)).join('')}${events.length > 3 ? `<span class="calendar-more">+${events.length - 3} lainnya</span>` : ''}</div>
    </section>`)
  }
  return `<div class="calendar-month-grid">${weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join('')}${cells.join('')}</div>`
}

function renderCalendarPage() {
  const [start, end] = calendarRange()
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(`${state.calendarDate}T12:00:00`))
  const rangeLabel = state.calendarView === 'day'
    ? formatDate(state.calendarDate)
    : state.calendarView === 'week'
      ? `${formatDate(start)} – ${formatDate(end)}`
      : monthLabel
  const content = state.calendarView === 'day'
    ? renderDayCalendar(state.calendarDate)
    : state.calendarView === 'week'
      ? renderWeekCalendar(start)
      : renderMonthCalendar(start, end)

  return `<section class="panel calendar-panel">
    <div class="calendar-toolbar">
      <div class="calendar-navigation"><button class="button" type="button" data-action="calendar-step" data-direction="-1" aria-label="Periode sebelumnya">←</button><button class="button" type="button" data-action="calendar-today">Hari ini</button><button class="button" type="button" data-action="calendar-step" data-direction="1" aria-label="Periode berikutnya">→</button></div>
      <h2 class="calendar-range-title">${escapeHTML(rangeLabel)}</h2>
      <div class="calendar-view-switch" role="group" aria-label="Tampilan kalender">${[['day', 'Hari'], ['week', 'Minggu'], ['month', 'Bulan']].map(([view, label]) => `<button class="button${state.calendarView === view ? ' is-selected' : ''}" type="button" data-action="calendar-view" data-view="${view}" aria-pressed="${state.calendarView === view}">${label}</button>`).join('')}</div>
    </div>
    ${content}
  </section>`
}

function renderAgendaCard(agenda, allowOccurrenceEdit = true) {
  const course = state.courses.find((item) => item.id === agenda.courseId)
  const repeated = Boolean(agenda.recurrence?.frequency === 'weekly')
  const cancelled = agenda.status === 'cancelled'
  const color = /^#[\da-f]{6}$/i.test(agenda.categoryColor ?? '') ? agenda.categoryColor : AGENDA_COLORS[0]
  const reminderText = (agenda.reminders ?? []).length ? `Pengingat: ${agenda.reminders.map(formatReminder).join(', ')}` : ''
  return `
    <article class="record-row agenda-row${cancelled ? ' is-cancelled' : ''}" style="--event-color:${color}">
      <div class="record-time">${escapeHTML(formatAgendaTime(agenda))}</div>
      <div class="record-copy"><h3>${escapeHTML(agenda.title)}</h3><p>${agenda.allDay ? 'Agenda sepanjang hari' : formatDate(agenda.date)}${course ? ` · ${escapeHTML(course.name)}` : ''}${agenda.category ? ` · ${escapeHTML(agenda.category)}` : ''}${cancelled ? ' · <strong class="overdue-label">Dibatalkan</strong>' : ''}${repeated ? ' · Mingguan' : ''}${agenda.sourceInboxId ? ' · Dari Inbox' : ''}</p>${agenda.location ? `<p>Lokasi: ${escapeHTML(agenda.location)}</p>` : ''}${agenda.onlineUrl ? `<p><a href="${escapeHTML(agenda.onlineUrl)}" target="_blank" rel="noopener noreferrer">Buka tautan online</a></p>` : ''}${reminderText ? `<p class="muted-copy">${escapeHTML(reminderText)}</p>` : ''}${agenda.topic ? `<p><strong>${escapeHTML(agenda.topic)}</strong></p>` : ''}${agenda.summary ? `<p class="record-description">${escapeHTML(agenda.summary)}</p>` : ''}${agenda.materialUrl ? `<p><a href="${escapeHTML(agenda.materialUrl)}" target="_blank" rel="noopener noreferrer">Buka materi</a></p>` : ''}</div>
      ${repeated && allowOccurrenceEdit ? `<button class="button button-small" type="button" data-action="occurrence-edit" data-id="${escapeHTML(agenda.seriesId)}" data-date="${escapeHTML(agenda.originalDate)}">Ubah pertemuan</button>` : ''}
      ${!agenda.archivedAt ? `<button class="button button-small" type="button" data-action="agenda-edit" data-id="${escapeHTML(repeated ? agenda.seriesId : agenda.id)}">Edit agenda</button>` : ''}
      ${!repeated ? `<button class="icon-button" type="button" data-action="delete" data-store="agendas" data-id="${escapeHTML(agenda.id)}" aria-label="Hapus agenda ${escapeHTML(agenda.title)}">×</button>` : ''}
    </article>`
}

function renderTaskCard(task, compact = false) {
  const overdue = isOverdue(task)
  const linkedCourses = (task.courseIds ?? [])
    .map((id) => state.courses.find((course) => course.id === id)?.name)
    .filter(Boolean)
  return `
    <article class="record-row task-row${task.status === 'Selesai' ? ' is-done' : ''}">
      <label class="status-control">
        <span class="sr-only">Status ${escapeHTML(task.title)}</span>
        <select data-action="task-status" data-id="${escapeHTML(task.id)}" aria-label="Status tugas ${escapeHTML(task.title)}">
          ${TASK_STATUSES.map((status) => `<option value="${escapeHTML(status)}" ${status === task.status ? 'selected' : ''}>${escapeHTML(status)}</option>`).join('')}
        </select>
      </label>
      <div class="record-copy"><h3>${escapeHTML(task.title)}</h3><p>${task.dueDate ? `Deadline ${formatDate(task.dueDate)}` : 'Tanpa deadline'}${overdue ? ' · <strong class="overdue-label">Terlambat</strong>' : ''}${linkedCourses.length ? ` · ${linkedCourses.map(escapeHTML).join(', ')}` : ''}${task.sourceInboxId ? ' · Dari Inbox' : ''}</p>${!compact && task.description ? `<p class="record-description">${escapeHTML(task.description)}</p>` : ''}</div>
      ${compact ? '' : `<button class="button button-small" type="button" data-action="task-edit" data-id="${escapeHTML(task.id)}">Edit</button>`}
      <button class="icon-button" type="button" data-action="delete" data-store="tasks" data-id="${escapeHTML(task.id)}" aria-label="Hapus tugas ${escapeHTML(task.title)}">×</button>
    </article>`
}

function courseColor(course) {
  return COURSE_COLORS.includes(course.color) ? course.color : COURSE_COLORS[0]
}

function renderCourseCard(course) {
  const taskCount = state.tasks.filter((task) => task.courseIds?.includes(course.id)).length
  const period = [course.period, course.academicYear].filter(Boolean).join(' · ')
  return `<button class="course-card" type="button" data-action="course-open" data-id="${escapeHTML(course.id)}">
    <span class="course-color" style="--course-color:${courseColor(course)}"></span>
    <span class="course-copy"><strong>${escapeHTML(course.name)}</strong><span>${escapeHTML([course.code, period, course.instructor].filter(Boolean).join(' · ') || 'Detail belum diisi')}</span></span>
    <span class="course-count">${taskCount} tugas</span>
  </button>`
}

function renderCoursePage() {
  const course = state.courses.find((item) => item.id === state.selectedCourseId)
  if (course) {
    const tasks = state.tasks.filter((task) => task.courseIds?.includes(course.id)).sort(byDateAndTitle)
    const fromDate = course.startDate && course.startDate > dateOffset(today(), -30) ? course.startDate : dateOffset(today(), -30)
    const throughDate = course.endDate && course.endDate < dateOffset(today(), 90) ? course.endDate : dateOffset(today(), 90)
    const meetings = agendaOccurrences(fromDate, throughDate).filter((agenda) => agenda.courseId === course.id)
    const period = [course.period, course.academicYear].filter(Boolean).join(' · ')
    return `<section class="panel">
      <div class="panel-heading"><button class="text-button" type="button" data-action="courses-back">← Semua mata kuliah</button><button class="button" type="button" data-action="course-edit" data-id="${escapeHTML(course.id)}">Edit</button></div>
      <div class="course-detail-heading"><span class="course-color course-color-large" style="--course-color:${courseColor(course)}"></span><div><p class="eyebrow">${course.archivedAt ? 'DIARSIPKAN' : 'MATA KULIAH'}${course.code ? ` · ${escapeHTML(course.code)}` : ''}</p><h2>${escapeHTML(course.name)}</h2><p>${escapeHTML([period, course.instructor].filter(Boolean).join(' · ') || 'Periode belum diisi')}</p>${course.startDate || course.endDate ? `<p>${course.startDate ? formatDate(course.startDate) : 'Tanggal mulai belum diisi'} – ${course.endDate ? formatDate(course.endDate) : 'Tanggal akhir belum diisi'}</p>` : ''}</div></div>
      <div class="panel-heading course-section-heading"><div><p class="eyebrow">JADWAL BERULANG & PERTEMUAN</p><h3>Pertemuan (${meetings.length})</h3></div>${course.archivedAt ? '' : `<button class="button button-dark" type="button" data-action="new-course-agenda" data-id="${escapeHTML(course.id)}">+ Tambah jadwal</button>`}</div>
      ${meetings.length ? `<div class="record-list">${meetings.map((meeting) => `<div class="dated-row"><span class="date-chip">${formatDate(meeting.date)}</span>${renderAgendaCard(meeting, !course.archivedAt)}</div>`).join('')}</div>` : emptyState('Belum ada jadwal kuliah', 'Tambahkan jadwal mingguan untuk melihat dan mencatat tiap pertemuan.')}
      <div class="panel-heading course-section-heading"><div><p class="eyebrow">TERKAIT</p><h3>Tugas (${tasks.length})</h3></div>${course.archivedAt ? '' : `<button class="button button-dark" type="button" data-action="new-course-task" data-id="${escapeHTML(course.id)}">+ Tambah tugas</button>`}</div>
      ${tasks.length ? `<div class="record-list">${tasks.map((task) => renderTaskCard(task)).join('')}</div>` : emptyState('Belum ada tugas', 'Tautkan tugas ke mata kuliah ini saat membuat tugas.')}
      <div class="course-archive-actions"><button class="button" type="button" data-action="${course.archivedAt ? 'course-restore' : 'course-archive'}" data-id="${escapeHTML(course.id)}">${course.archivedAt ? 'Pulihkan mata kuliah' : 'Arsipkan mata kuliah'}</button></div>
    </section>`
  }

  const courses = state.courses.filter((item) => Boolean(item.archivedAt) === state.showArchivedCourses)
    .sort((left, right) => left.name.localeCompare(right.name, 'id'))
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">${state.showArchivedCourses ? 'RIWAYAT' : 'KATALOG'}</p><h2>${state.showArchivedCourses ? 'Mata kuliah diarsipkan' : 'Mata kuliah aktif'}</h2></div><div class="course-list-actions"><button class="button" type="button" data-action="toggle-archived-courses">${state.showArchivedCourses ? 'Lihat yang aktif' : 'Lihat arsip'}</button>${!state.showArchivedCourses ? '<button class="button button-dark" type="button" data-action="new-course">+ Tambah</button>' : ''}</div></div>
    ${courses.length ? `<div class="course-list">${courses.map(renderCourseCard).join('')}</div>` : emptyState(state.showArchivedCourses ? 'Belum ada arsip' : 'Belum ada mata kuliah', state.showArchivedCourses ? 'Mata kuliah yang diarsipkan akan muncul di sini.' : 'Tambahkan penawaran mata kuliah untuk satu periode.')}</section>`
}

function renderInboxCard(item) {
  const converted = item.status === 'converted'
  const destination = item.convertedTo?.type === 'tasks' ? 'Tugas' : 'Agenda'
  return `
    <article class="inbox-card">
      <div class="record-copy"><span class="eyebrow">${item.url ? 'TAUTAN' : 'CATATAN CEPAT'}</span><p>${escapeHTML(item.content)}</p></div>
      <div class="inbox-actions">
        ${converted
          ? `<button class="button button-small" type="button" data-page="${item.convertedTo.type === 'tasks' ? 'tasks' : 'agenda'}">Lihat ${destination.toLocaleLowerCase('id')}</button>`
          : `<button class="button button-small" type="button" data-action="convert-task" data-id="${escapeHTML(item.id)}">Jadikan tugas</button>
            <button class="button button-small" type="button" data-action="convert-agenda" data-id="${escapeHTML(item.id)}">Jadikan agenda</button>`}
        <button class="icon-button" type="button" data-action="delete" data-store="inbox" data-id="${escapeHTML(item.id)}" aria-label="Hapus item Inbox">×</button>
      </div>
      ${converted ? `<p class="muted-copy inbox-source-status">Sudah dikonversi menjadi ${destination.toLocaleLowerCase('id')}; sumber tetap tersimpan.</p>` : ''}
    </article>`
}

function taskGroup(task) {
  if (task.status === 'Selesai') return 'Selesai'
  if (!task.dueDate) return 'Tanpa deadline'
  if (task.dueDate < today()) return 'Terlambat'
  if (task.dueDate === today()) return 'Hari ini'
  return 'Mendatang'
}

function renderTasksPage() {
  const allTasks = [...state.tasks].sort((left, right) => (left.dueDate || '9999').localeCompare(right.dueDate || '9999'))
  const tasks = allTasks.filter((task) => {
    if (state.taskFilter === 'Aktif') return task.status !== 'Selesai'
    if (state.taskFilter === 'Semua') return true
    return taskGroup(task) === state.taskFilter
  })
  const groups = state.taskFilter === 'Semua'
    ? ['Terlambat', 'Hari ini', 'Mendatang', 'Tanpa deadline', 'Selesai']
    : state.taskFilter === 'Aktif'
      ? ['Terlambat', 'Hari ini', 'Mendatang', 'Tanpa deadline']
      : [state.taskFilter]
  const sections = groups.map((group) => {
    const records = tasks.filter((task) => taskGroup(task) === group)
    if (!records.length) return ''
    return `<section class="task-group"><div class="task-group-heading"><h3>${escapeHTML(group)}</h3><span>${records.length}</span></div><div class="record-list">${records.map((task) => renderTaskCard(task)).join('')}</div></section>`
  }).join('')
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">DAFTAR KERJA</p><h2>Semua tugas</h2></div><button class="button button-dark" data-action="new-task">+ Tambah tugas</button></div>
    <div class="task-filters" role="group" aria-label="Filter tugas">${['Aktif', 'Terlambat', 'Hari ini', 'Mendatang', 'Tanpa deadline', 'Selesai', 'Semua'].map((filter) => `<button class="button button-small${state.taskFilter === filter ? ' is-selected' : ''}" type="button" data-action="task-filter" data-filter="${escapeHTML(filter)}" aria-pressed="${state.taskFilter === filter}">${escapeHTML(filter)}</button>`).join('')}</div>
    ${sections || emptyState('Tidak ada tugas di filter ini', 'Pilih filter lain atau tambahkan tugas baru.')}</section>`
}

function renderInboxPage() {
  const converted = state.inboxView === 'converted'
  const items = state.inbox.filter((item) => converted ? item.status === 'converted' : item.status === 'active')
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">QUICK CAPTURE</p><h2>${converted ? 'Riwayat konversi' : 'Simpan cepat'}</h2></div><div class="panel-heading-actions"><button class="button" type="button" data-action="inbox-view" data-view="${converted ? 'active' : 'converted'}">${converted ? 'Inbox aktif' : 'Riwayat'}</button>${!converted ? '<button class="button button-dark" data-action="new-inbox">+ Tangkap ide</button>' : ''}</div></div>
    ${items.length ? `<div class="inbox-list">${items.map(renderInboxCard).join('')}</div>` : emptyState(converted ? 'Belum ada konversi' : 'Inbox bersih', converted ? 'Item Inbox yang diubah menjadi tugas atau agenda akan tercatat di sini.' : 'Ide atau tautan baru bisa disimpan tanpa dipikirkan kategorinya dulu.')}</section>`
}

function reminderPreviews() {
  const now = new Date()
  const previews = []
  for (const task of state.tasks) {
    if (task.status === 'Selesai' || !task.dueDate) continue
    const due = new Date(`${task.dueDate}T09:00:00`)
    for (const [label, offset] of [['H-3', 3], ['H-1', 1], ['Hari H', 0]]) {
      const fireAt = new Date(due.getTime() - offset * 86400000)
      if (fireAt > now && fireAt < new Date(now.getTime() + 90 * 86400000)) {
        previews.push({ at: fireAt, title: task.title, detail: `Tugas · ${label} deadline${offset ? ` · ${formatDate(task.dueDate)}` : ''}` })
      }
    }
  }
  for (const agenda of expandAgendaOccurrences(state.agendas, today(), dateOffset(today(), 90))) {
    if (agenda.status === 'cancelled') continue
    const startsAt = agenda.allDay ? new Date(`${agenda.date}T09:00:00`) : new Date(agenda.startsAt)
    for (const minutes of agenda.reminders ?? []) {
      const fireAt = new Date(startsAt.getTime() - minutes * 60000)
      if (fireAt > now && fireAt < new Date(now.getTime() + 90 * 86400000)) {
        previews.push({ at: fireAt, title: agenda.title, detail: `Agenda · ${formatReminder(minutes)} · ${formatDate(agenda.date)}` })
      }
    }
  }
  return previews.sort((left, right) => left.at - right.at).slice(0, 30)
}

function renderNotificationsPage() {
  const previews = reminderPreviews()
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">PENGINGAT TERSIMPAN</p><h2>Pratinjau pengingat</h2></div><span class="status-pill">Simulasi lokal</span></div>
    <div class="notice notice-warning"><strong>Notifikasi belum aktif.</strong> Ini hanya pratinjau berdasarkan tenggat dan pengingat yang tersimpan. Aplikasi belum mengirim push notification atau pengingat di latar belakang.</div>
    ${previews.length ? `<div class="record-list">${previews.map((item) => `<article class="notification-row"><div class="notification-date">${escapeHTML(new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(item.at))}</div><div class="record-copy"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.detail)}</p></div></article>`).join('')}</div>` : emptyState('Belum ada pratinjau', 'Pengingat yang jatuh dalam 90 hari ke depan akan tampil di sini.')}</section>`
}

function renderSettingsPage() {
  const counts = [
    ['Tugas', state.tasks.length],
    ['Agenda', state.agendas.length],
    ['Inbox', state.inbox.length],
    ['Mata kuliah', state.courses.length],
  ]
  const snapshots = state.recoverySnapshots.filter((item) => item.reason === 'before-restore')
  return `<div class="settings-grid">
    <section class="panel"><div class="panel-heading"><div><p class="eyebrow">PENYIMPANAN</p><h2>Data perangkat ini</h2></div><span class="status-pill"><span class="local-dot"></span> Lokal</span></div>
      <p class="muted-copy">Data disimpan di IndexedDB pada browser ini. Sinkronisasi akun atau cloud belum tersedia.</p>
      <div class="settings-counts">${counts.map(([label, count]) => `<div><span>${label}</span><strong>${count}</strong></div>`).join('')}</div>
    </section>
    <section class="panel"><div class="panel-heading"><div><p class="eyebrow">CADANGAN</p><h2>Backup dan pemulihan</h2></div></div>
      <p class="muted-copy">Ekspor file JSON untuk menyimpan salinan di luar browser. Pemulihan akan mengganti data saat ini secara atomik setelah file diperiksa.</p>
      <div class="settings-actions"><button class="button button-dark" type="button" data-action="export-backup">Ekspor backup</button><button class="button" type="button" data-action="import-backup">Pilih backup untuk dipulihkan</button><input id="backup-file" class="sr-only" type="file" accept="application/json,.json"></div>
      <p class="muted-copy">Sebelum pemulihan, salinan kondisi saat ini disimpan di browser ini agar dapat dipulihkan kembali dari daftar snapshot.</p>
      ${snapshots.length ? `<div class="snapshot-list"><h3>Snapshot sebelum pemulihan</h3>${snapshots.map((snapshot) => `<div class="snapshot-row"><span>${escapeHTML(new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(snapshot.createdAt)))}</span><button class="button button-small" type="button" data-action="restore-snapshot" data-id="${escapeHTML(snapshot.id)}">Pulihkan snapshot</button></div>`).join('')}</div>` : ''}
    </section>
    <section class="panel"><div class="panel-heading"><div><p class="eyebrow">PREFERENSI</p><h2>Notifikasi</h2></div><span class="status-pill">Belum aktif</span></div><p class="muted-copy">Tanggal pengingat tersimpan dan dapat dilihat pada Pusat notifikasi, tetapi pengiriman notifikasi belum tersedia di prototipe ini.</p><button class="button" type="button" data-page="notifications">Lihat pratinjau pengingat</button></section>
    <section class="panel"><div class="panel-heading"><div><p class="eyebrow">AKUN DAN SINKRONISASI</p><h2>Perangkat ini saja</h2></div></div><p class="muted-copy">Autentikasi, sinkronisasi cloud, serta pemulihan antarperangkat belum tersedia. File backup adalah satu-satunya cara memindahkan data pada tahap ini.</p></section>
  </div>`
}

function emptyState(title, copy) {
  return `<div class="empty-state"><span class="empty-mark">○</span><h3>${escapeHTML(title)}</h3><p>${escapeHTML(copy)}</p></div>`
}

function renderDashboard() {
  const tasks = activeTasks().slice(0, 5)
  const agendas = todayAgendas()
  const upcoming = agendaOccurrences(dateOffset(today(), 1), dateOffset(today(), 90)).slice(0, 3)
  return `
    <section class="welcome-card">
      <div><p class="eyebrow">PERSONAL DESK <span>/</span> OFFLINE-FIRST</p><h2>Fokus ke hal yang penting.</h2><p>Hari ini punya ruang untuk dikerjakan satu per satu.</p></div>
      <div class="welcome-date"><span>HARI INI</span><strong>${escapeHTML(dateFormatter.format(new Date()))}</strong></div>
    </section>
    <section class="stat-grid" aria-label="Ringkasan hari ini">
      <article class="stat-card"><span>AGENDA HARI INI</span><strong>${agendas.length.toString().padStart(2, '0')}</strong></article>
      <article class="stat-card"><span>TUGAS AKTIF</span><strong>${activeTasks().length.toString().padStart(2, '0')}</strong></article>
      <article class="stat-card"><span>INBOX BARU</span><strong>${state.inbox.filter((item) => item.status === 'active').length.toString().padStart(2, '0')}</strong></article>
    </section>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">JADWAL</p><h2>Agenda hari ini</h2></div><button class="text-button" data-page="agenda">Lihat agenda →</button></div>
        ${agendas.length ? `<div class="record-list">${agendas.map(renderAgendaCard).join('')}</div>` : emptyState('Belum ada agenda', 'Tambahkan kegiatan yang ingin kamu ingat hari ini.')}
      </section>
      <section class="panel"><div class="panel-heading"><div><p class="eyebrow">LANGKAH BERIKUTNYA</p><h2>Tugas aktif</h2></div><button class="text-button" data-page="tasks">Lihat tugas →</button></div>
        ${tasks.length ? `<div class="record-list">${tasks.map((task) => renderTaskCard(task, true)).join('')}</div>` : emptyState('Semua beres', 'Belum ada tugas aktif yang tercatat.')}
      </section>
      <section class="panel panel-wide"><div class="panel-heading"><div><p class="eyebrow">SELANJUTNYA</p><h2>Agenda mendatang</h2></div></div>
        ${upcoming.length ? `<div class="record-list">${upcoming.map((agenda) => `<div class="dated-row"><span class="date-chip">${formatDate(agenda.date)}</span>${renderAgendaCard(agenda)}</div>`).join('')}</div>` : emptyState('Belum ada agenda mendatang', 'Jadwal yang kamu tambahkan akan muncul di sini.')}
      </section>
    </div>`
}

function renderPageContent() {
  if (state.page === 'dashboard') return renderDashboard()

  if (state.page === 'agenda') {
    return `<div class="calendar-page"><div class="panel-heading"><div><p class="eyebrow">KALENDER PRIBADI</p><h2>Jadwal dan tenggat</h2></div><button class="button button-dark" data-action="new-agenda">+ Tambah agenda</button></div>${renderCalendarPage()}</div>`
  }

  if (state.page === 'tasks') return renderTasksPage()

  if (state.page === 'courses') return renderCoursePage()
  if (state.page === 'inbox') return renderInboxPage()
  if (state.page === 'notifications') return renderNotificationsPage()
  if (state.page === 'settings') return renderSettingsPage()
  if (state.page === 'search') return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">HASIL DAN FILTER</p><h2>Pencarian global</h2></div></div>${filteredSearch()}</section>`
  return emptyState('Halaman tidak ditemukan', 'Pilih halaman dari navigasi utama.')
}

function filteredSearch() {
  const query = state.query.trim().toLocaleLowerCase('id')
  if (!query) return ''

  const allItems = [
    ...state.tasks.map((item) => ({ ...item, type: 'Tugas', page: 'tasks', dateKey: item.dueDate, detail: item.dueDate ? formatDate(item.dueDate) : 'Tanpa deadline' })),
    ...state.agendas.map((item) => ({ ...item, type: 'Agenda', page: 'agenda', dateKey: item.date, detail: formatDate(item.date) })),
    ...state.courses.filter((item) => !item.archivedAt).map((item) => ({ ...item, title: item.name, description: [item.code, item.instructor, item.period, item.academicYear].filter(Boolean).join(' '), type: 'Mata kuliah', page: 'courses', dateKey: item.startDate || item.createdAt.slice(0, 10), detail: [item.code, item.period, item.academicYear].filter(Boolean).join(' · ') || 'Mata kuliah' })),
    ...state.inbox.filter((item) => item.status === 'active').map((item) => ({ ...item, title: item.content, type: 'Inbox', page: 'inbox', dateKey: item.createdAt.slice(0, 10), detail: 'Quick capture' })),
  ]
  const matches = allItems
    .map((item) => {
      const title = item.title.toLocaleLowerCase('id')
      const content = `${item.title} ${item.description ?? ''} ${item.content ?? ''}`.toLocaleLowerCase('id')
      const relevance = title === query ? 0 : title.startsWith(query) ? 1 : title.includes(query) ? 2 : 3
      return { ...item, relevance, content }
    })
    .filter((item) => item.content.includes(query))
    .filter((item) => state.searchType === 'all' || item.page === state.searchType)
    .filter((item) => !state.searchFrom || item.dateKey >= state.searchFrom)
    .filter((item) => !state.searchTo || item.dateKey <= state.searchTo)
    .sort((left, right) => left.relevance - right.relevance || (left.dateKey ?? '').localeCompare(right.dateKey ?? ''))

  return `<div class="search-results"><span class="eyebrow">${matches.length} HASIL PENCARIAN</span><div class="search-filters"><label>Jenis<select id="search-type"><option value="all" ${state.searchType === 'all' ? 'selected' : ''}>Semua</option><option value="tasks" ${state.searchType === 'tasks' ? 'selected' : ''}>Tugas</option><option value="agenda" ${state.searchType === 'agenda' ? 'selected' : ''}>Agenda</option><option value="courses" ${state.searchType === 'courses' ? 'selected' : ''}>Mata kuliah</option><option value="inbox" ${state.searchType === 'inbox' ? 'selected' : ''}>Inbox</option></select></label><label>Dari<input id="search-from" type="date" value="${escapeHTML(state.searchFrom)}"></label><label>Sampai<input id="search-to" type="date" value="${escapeHTML(state.searchTo)}"></label></div>${matches.length ? matches.map((item) => `<button class="search-result" data-page="${item.page}" ${item.page === 'courses' ? `data-course-id="${escapeHTML(item.id)}"` : ''}><strong>${escapeHTML(item.title)}</strong><span>${item.type} · ${escapeHTML(item.detail)}</span></button>`).join('') : '<p class="muted-copy">Tidak ada hasil yang cocok.</p>'}</div>`
}

function render() {
  const [title, subtitle] = pageTitle()
  const activeInboxCount = state.inbox.filter((item) => item.status === 'active').length
  const searchResults = state.page === 'search' ? '' : filteredSearch()
  const selectedCourse = state.courses.find((course) => course.id === state.selectedCourseId)
  const isSecondaryPage = ['courses', 'notifications', 'settings'].includes(state.page)
  const quickAddAction = state.page === 'courses'
    ? state.selectedCourseId ? 'new-course-task' : 'new-course'
    : state.page === 'tasks' ? 'new-task' : state.page === 'agenda' ? 'new-agenda' : 'new-inbox'

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#" data-page="dashboard"><span class="brand-mark">Æ</span><span>chrono<span class="brand-light">log</span></span></a>
        <p class="nav-label">RUANG PERSONAL</p>
        <nav class="main-nav" aria-label="Navigasi utama">
          <button class="nav-item ${state.page === 'dashboard' ? 'active' : ''}" data-page="dashboard"><span class="nav-symbol">◫</span>Hari ini</button>
          <button class="nav-item ${state.page === 'agenda' ? 'active' : ''}" data-page="agenda"><span class="nav-symbol">▦</span>Agenda</button>
          <button class="nav-item ${state.page === 'tasks' ? 'active' : ''}" data-page="tasks"><span class="nav-symbol">✓</span>Tugas</button>
          <button class="nav-item ${state.page === 'inbox' ? 'active' : ''}" data-page="inbox"><span class="nav-symbol">↳</span>Inbox <span class="nav-count">${activeInboxCount}</span></button>
          <button class="nav-item nav-item-secondary ${state.page === 'courses' ? 'active' : ''}" data-page="courses"><span class="nav-symbol">▤</span>Mata kuliah</button>
          <button class="nav-item nav-item-secondary ${state.page === 'notifications' ? 'active' : ''}" data-page="notifications"><span class="nav-symbol">◷</span>Notifikasi</button>
          <button class="nav-item nav-item-secondary ${state.page === 'settings' ? 'active' : ''}" data-page="settings"><span class="nav-symbol">⚙</span>Pengaturan</button>
          <button class="nav-item nav-item-more ${isSecondaryPage ? 'active' : ''}" type="button" data-action="toggle-more" aria-haspopup="dialog" aria-expanded="${state.isMoreOpen}"><span class="nav-symbol">⋯</span>Lainnya</button>
        </nav>
        <div class="sidebar-bottom"><span class="local-dot"></span><span>Disimpan di perangkat ini</span></div>
      </aside>
      ${state.isMoreOpen ? `
        <div class="more-sheet-backdrop" data-action="close-more" aria-hidden="true"></div>
        <div class="more-sheet" role="dialog" aria-modal="true" aria-label="Menu navigasi lainnya">
          <div class="more-sheet-header">
            <span class="eyebrow">MENU LAINNYA</span>
            <button class="icon-button more-sheet-close" type="button" data-action="close-more" aria-label="Tutup menu lainnya">×</button>
          </div>
          <div class="more-sheet-items">
            <button class="more-sheet-item ${state.page === 'courses' ? 'active' : ''}" data-page="courses"><span class="nav-symbol">▤</span>Mata kuliah</button>
            <button class="more-sheet-item ${state.page === 'notifications' ? 'active' : ''}" data-page="notifications"><span class="nav-symbol">◷</span>Notifikasi</button>
            <button class="more-sheet-item ${state.page === 'settings' ? 'active' : ''}" data-page="settings"><span class="nav-symbol">⚙</span>Pengaturan</button>
          </div>
        </div>
      ` : ''}
      <main class="main-content">
        <header class="topbar"><div class="mobile-brand"><span class="mobile-brand-mark">Æ</span><strong>Chrono Log</strong><span class="mobile-brand-state"><span class="local-dot"></span> Lokal</span></div><div class="topbar-title"><p class="eyebrow">${escapeHTML(subtitle.toUpperCase())} <span>/</span> PROTOTIPE LOKAL</p><h1>${escapeHTML(title)}</h1></div>
          <div class="topbar-actions"><label class="search-box"><span aria-hidden="true">⌕</span><span class="sr-only">Cari tugas, agenda, mata kuliah, atau Inbox</span><input id="global-search" type="search" placeholder="Cari di ruangmu…" value="${escapeHTML(state.query)}" autocomplete="off"></label><button class="button button-dark" data-action="${quickAddAction}" ${state.page === 'courses' && state.selectedCourseId ? `data-id="${escapeHTML(state.selectedCourseId)}"` : ''} ${['notifications', 'settings'].includes(state.page) || selectedCourse?.archivedAt ? 'hidden' : ''}>+ Tambah</button></div>
        </header>
        <p class="prototype-note"><strong>Mode lokal tahap awal.</strong> Data tersimpan di browser ini; sinkronisasi antarperangkat dan autentikasi belum tersedia. Ekspor backup secara berkala dari Pengaturan.</p>
        <div id="notice" class="notice" role="status" aria-live="polite" ${state.message ? '' : 'hidden'}>${escapeHTML(state.message)}</div>
        <div class="search-slot">${searchResults}</div>
        <section class="page-content">${renderPageContent()}</section>
      </main>
      <dialog id="record-dialog" aria-labelledby="dialog-title"></dialog>
    </div>`
}

function showMessage(message) {
  state.message = message
  render()
  window.setTimeout(() => {
    if (state.message === message) {
      state.message = ''
      render()
    }
  }, 4500)
}

function localDateTimeValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function occurrenceDateTime(series, date, isEnd = false) {
  const original = new Date(series.startsAt)
  const [year, month, day] = date.split('-').map(Number)
  const occurrence = new Date(year, month - 1, day)
  occurrence.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), original.getMilliseconds())
  if (isEnd) occurrence.setTime(occurrence.getTime() + (new Date(series.endsAt) - new Date(series.startsAt)))
  return occurrence
}

function openOccurrenceDialog(seriesId, originalDate) {
  const series = state.agendas.find((agenda) => agenda.id === seriesId)
  if (!series) throw new Error('Jadwal berulang tidak ditemukan.')
  const existing = series.exceptions?.[originalDate] ?? {}
  const effectiveDate = existing.date ?? originalDate
  const allDay = existing.allDay ?? series.allDay
  const reminders = existing.reminders ?? series.reminders ?? [series.allDay ? 1440 : 30]
  const start = existing.startsAt ? new Date(existing.startsAt) : series.allDay ? null : occurrenceDateTime(series, originalDate)
  const end = existing.endsAt ? new Date(existing.endsAt) : series.allDay ? null : occurrenceDateTime(series, originalDate, true)
  const dialog = document.querySelector('#record-dialog')
  dialog.innerHTML = `
    <form id="occurrence-form" class="dialog-form">
      <div class="dialog-heading"><p class="eyebrow">PERUBAHAN SATU PERTEMUAN</p><h2 id="dialog-title">Catat pertemuan</h2><p class="muted-copy">${escapeHTML(formatDate(originalDate))} · jadwal mingguan tetap utuh</p></div>
      <label for="occurrence-title">Judul <span>(opsional)</span></label><input id="occurrence-title" name="title" maxlength="160" value="${escapeHTML(existing.title || series.title)}">
      <label class="checkbox-label"><input id="occurrence-cancelled" name="cancelled" type="checkbox" ${existing.status === 'cancelled' ? 'checked' : ''}> Tandai pertemuan dibatalkan</label>
      <label class="checkbox-label"><input id="occurrence-all-day" name="allDay" type="checkbox" ${allDay ? 'checked' : ''}> Sepanjang hari</label>
      <div id="occurrence-timed-fields" class="form-grid" ${allDay ? 'hidden' : ''}><div><label for="occurrence-start">Mulai</label><input id="occurrence-start" name="startsAt" type="datetime-local" value="${start ? localDateTimeValue(start) : ''}" ${allDay ? '' : 'required'}></div><div><label for="occurrence-end">Selesai</label><input id="occurrence-end" name="endsAt" type="datetime-local" value="${end ? localDateTimeValue(end) : ''}" ${allDay ? '' : 'required'}></div></div>
      <div id="occurrence-all-day-field" ${allDay ? '' : 'hidden'}><label for="occurrence-date">Tanggal</label><input id="occurrence-date" name="date" type="date" value="${escapeHTML(effectiveDate)}" ${allDay ? 'required' : ''}></div>
      <label for="occurrence-category">Kategori</label><input id="occurrence-category" name="category" maxlength="80" value="${escapeHTML(existing.category || series.category || 'Pribadi')}">
      <div class="form-grid"><div><label for="occurrence-category-color">Warna kategori</label><input id="occurrence-category-color" name="categoryColor" type="color" value="${escapeHTML(existing.categoryColor || series.categoryColor || AGENDA_COLORS[0])}"></div><div><label for="occurrence-location">Lokasi fisik <span>(opsional)</span></label><input id="occurrence-location" name="location" maxlength="200" value="${escapeHTML(existing.location ?? series.location ?? '')}"></div></div>
      <label for="occurrence-online-url">Tautan online <span>(opsional)</span></label><input id="occurrence-online-url" name="onlineUrl" type="url" maxlength="2048" value="${escapeHTML(existing.onlineUrl ?? series.onlineUrl ?? '')}" placeholder="https://…">
      <label for="occurrence-topic">Topik <span>(opsional)</span></label><input id="occurrence-topic" name="topic" maxlength="160" value="${escapeHTML(existing.topic ?? '')}">
      <label for="occurrence-summary">Ringkasan <span>(opsional)</span></label><textarea id="occurrence-summary" name="summary" rows="3" maxlength="2000">${escapeHTML(existing.summary ?? '')}</textarea>
      <label for="occurrence-material">Tautan materi <span>(opsional)</span></label><input id="occurrence-material" name="materialUrl" type="url" maxlength="2048" value="${escapeHTML(existing.materialUrl ?? '')}" placeholder="https://…">
      ${renderReminderFields(reminders, allDay, 'occurrence')}
      <p class="dialog-error" role="alert"></p>
      <div class="dialog-actions"><button class="button" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">Simpan pertemuan</button></div>
    </form>`
  dialog.showModal()
  dialog.querySelector('#occurrence-title').focus()

  let remindersTouched = false
  const reminderOverrideExists = Array.isArray(existing.reminders)
  dialog.querySelectorAll('input[name="reminderOffsets"]').forEach((input) => {
    input.addEventListener('change', () => { remindersTouched = true })
  })
  dialog.querySelector('#occurrence-custom-reminder').addEventListener('input', () => { remindersTouched = true })

  dialog.querySelector('#occurrence-all-day').addEventListener('change', (event) => {
    const isAllDay = event.currentTarget.checked
    dialog.querySelector('#occurrence-timed-fields').hidden = isAllDay
    dialog.querySelector('#occurrence-all-day-field').hidden = !isAllDay
    dialog.querySelector('#occurrence-start').required = !isAllDay
    dialog.querySelector('#occurrence-end').required = !isAllDay
    dialog.querySelector('#occurrence-date').required = isAllDay
    if (!reminderOverrideExists && !remindersTouched) setDefaultReminder(dialog, 'occurrence', isAllDay ? 1440 : 30)
  })

  dialog.querySelector('#occurrence-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const isAllDay = form.get('allDay') === 'on'
    const date = isAllDay ? String(form.get('date')) : localDateKey(new Date(String(form.get('startsAt'))))
    const startValue = isAllDay ? '' : String(form.get('startsAt'))
    const endValue = isAllDay ? '' : String(form.get('endsAt'))
    const baseStart = series.allDay ? '' : localDateTimeValue(occurrenceDateTime(series, originalDate))
    const baseEnd = series.allDay ? '' : localDateTimeValue(occurrenceDateTime(series, originalDate, true))
    const moved = isAllDay
      ? date !== originalDate || !series.allDay
      : date !== originalDate || startValue !== baseStart || endValue !== baseEnd || series.allDay
    try {
      const exception = normalizeOccurrenceException({
        title: form.get('title'),
        topic: form.get('topic'),
        summary: form.get('summary'),
        materialUrl: form.get('materialUrl'),
        onlineUrl: form.get('onlineUrl'),
        category: form.get('category'),
        categoryColor: form.get('categoryColor'),
        location: form.get('location'),
        reminders: readReminderValues(form),
        cancelled: form.get('cancelled') === 'on',
        moved,
        allDay: isAllDay,
        date,
        startsAt: form.get('startsAt'),
        endsAt: form.get('endsAt'),
      })
      await saveOccurrenceException(state.database, seriesId, originalDate, exception)
      dialog.close()
      state.message = exception.status === 'cancelled' ? 'Pertemuan dibatalkan; jadwal mingguan tetap.' : 'Perubahan pertemuan disimpan tanpa mengubah jadwal mingguan.'
      await refreshData()
    } catch (error) {
      dialog.querySelector('.dialog-error').textContent = error.message || 'Gagal menyimpan pertemuan.'
    }
  })
}

function openDialog(kind, sourceInboxId = '', recordId = '') {
  const dialog = document.querySelector('#record-dialog')
  const source = state.inbox.find((item) => item.id === sourceInboxId)
  const content = source?.content ?? ''
  const isConversion = Boolean(sourceInboxId)
  const existing = kind === 'course'
    ? state.courses.find((course) => course.id === recordId)
    : kind === 'task'
      ? state.tasks.find((task) => task.id === recordId)
      : kind === 'agenda'
        ? state.agendas.find((agenda) => agenda.id === recordId)
        : null

  if (kind === 'course') {
    dialog.innerHTML = `
      <form id="record-form" class="dialog-form">
        <div class="dialog-heading"><p class="eyebrow">${existing ? 'UBAH PENAWARAN' : 'KATALOG KULIAH'}</p><h2 id="dialog-title">${existing ? 'Edit mata kuliah' : 'Mata kuliah baru'}</h2></div>
        <label for="course-name">Nama mata kuliah</label><input id="course-name" name="name" maxlength="160" required value="${escapeHTML(existing?.name ?? '')}">
        <div class="form-grid"><div><label for="course-code">Kode <span>(opsional)</span></label><input id="course-code" name="code" maxlength="40" value="${escapeHTML(existing?.code ?? '')}"></div><div><label for="course-instructor">Pengajar <span>(opsional)</span></label><input id="course-instructor" name="instructor" maxlength="120" value="${escapeHTML(existing?.instructor ?? '')}"></div></div>
        <div class="form-grid"><div><label for="course-period">Periode/semester <span>(opsional)</span></label><input id="course-period" name="period" maxlength="60" value="${escapeHTML(existing?.period ?? '')}"></div><div><label for="course-year">Tahun akademik <span>(opsional)</span></label><input id="course-year" name="academicYear" maxlength="30" value="${escapeHTML(existing?.academicYear ?? '')}"></div></div>
        <div class="form-grid"><div><label for="course-start">Tanggal mulai <span>(opsional)</span></label><input id="course-start" name="startDate" type="date" value="${escapeHTML(existing?.startDate ?? '')}"></div><div><label for="course-end">Tanggal akhir <span>(opsional)</span></label><input id="course-end" name="endDate" type="date" value="${escapeHTML(existing?.endDate ?? '')}"></div></div>
        <label for="course-color">Warna <span>(opsional)</span></label><select id="course-color" name="color"><option value="">Tanpa warna</option>${COURSE_COLORS.map((color) => `<option value="${color}" ${color === existing?.color ? 'selected' : ''}>Warna ${color}</option>`).join('')}</select>
        <p class="dialog-error" role="alert"></p>
        <div class="dialog-actions"><button class="button" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">Simpan</button></div>
      </form>`
  } else if (kind === 'task' || kind === 'agenda') {
    dialog.innerHTML = `
      <form id="record-form" class="dialog-form">
        <div class="dialog-heading"><p class="eyebrow">${existing ? 'UBAH CATATAN' : isConversion ? 'KONVERSI INBOX' : 'CATATAN BARU'}</p><h2 id="dialog-title">${existing ? `Edit ${kind === 'task' ? 'tugas' : 'agenda'}` : kind === 'task' ? 'Tugas baru' : 'Agenda baru'}</h2></div>
        <input type="hidden" name="sourceInboxId" value="${escapeHTML(sourceInboxId)}">
        <label for="record-title">Judul</label><input id="record-title" name="title" maxlength="160" required value="${escapeHTML(existing?.title ?? content)}" autofocus>
        ${kind === 'task'
          ? `<label for="task-description">Deskripsi <span>(opsional)</span></label><textarea id="task-description" name="description" rows="3" maxlength="2000">${escapeHTML(existing?.description ?? (isConversion ? content : ''))}</textarea><label for="task-due">Deadline <span>(opsional)</span></label><input id="task-due" name="dueDate" type="date" value="${escapeHTML(existing?.dueDate ?? '')}"><label for="task-status">Status</label><select id="task-status" name="status">${TASK_STATUSES.map((status) => `<option value="${escapeHTML(status)}" ${status === (existing?.status ?? TASK_STATUSES[0]) ? 'selected' : ''}>${escapeHTML(status)}</option>`).join('')}</select><fieldset class="course-options"><legend>Mata kuliah <span>(opsional, bisa lebih dari satu)</span></legend>${state.courses.filter((course) => !course.archivedAt).length ? state.courses.filter((course) => !course.archivedAt).map((course) => `<label class="checkbox-label"><input type="checkbox" name="courseIds" value="${escapeHTML(course.id)}" ${existing?.courseIds?.includes(course.id) || (!existing && course.id === recordId) ? 'checked' : ''}> ${escapeHTML(course.name)}</label>`).join('') : '<p class="muted-copy">Tambahkan mata kuliah terlebih dahulu.</p>'}</fieldset>`
          : `<label class="checkbox-label"><input id="agenda-all-day" name="allDay" type="checkbox" ${existing?.allDay ? 'checked' : ''}> Sepanjang hari</label>
            <div id="agenda-timed-fields" class="form-grid" ${existing?.allDay ? 'hidden' : ''}><div><label for="agenda-start">Mulai</label><input id="agenda-start" name="startsAt" type="datetime-local" value="${existing?.startsAt ? localDateTimeValue(new Date(existing.startsAt)) : localDateTimeValue()}" ${existing?.allDay ? '' : 'required'}></div><div><label for="agenda-end">Selesai</label><input id="agenda-end" name="endsAt" type="datetime-local" value="${existing?.endsAt ? localDateTimeValue(new Date(existing.endsAt)) : localDateTimeValue(new Date(Date.now() + 60 * 60 * 1000))}" ${existing?.allDay ? '' : 'required'}></div></div>
            <div id="agenda-all-day-field" ${existing?.allDay ? '' : 'hidden'}><label for="agenda-date">Tanggal</label><input id="agenda-date" name="date" type="date" value="${escapeHTML(existing?.date ?? today())}" ${existing?.allDay ? 'required' : ''}></div>
            <div class="form-grid"><div><label for="agenda-category">Kategori</label><input id="agenda-category" name="category" maxlength="80" list="agenda-category-options" value="${escapeHTML(existing?.category ?? 'Pribadi')}"><datalist id="agenda-category-options"><option value="Kuliah"><option value="Organisasi"><option value="Pribadi"><option value="Proyek"></datalist></div><div><label for="agenda-category-color">Warna kategori</label><input id="agenda-category-color" name="categoryColor" type="color" value="${escapeHTML(existing?.categoryColor ?? AGENDA_COLORS[0])}"></div></div>
            <label for="agenda-location">Lokasi fisik <span>(opsional)</span></label><input id="agenda-location" name="location" maxlength="200" placeholder="Gedung, ruang, atau alamat" value="${escapeHTML(existing?.location ?? '')}">
            <label for="agenda-online-url">Tautan online <span>(opsional)</span></label><input id="agenda-online-url" name="onlineUrl" type="url" maxlength="2048" placeholder="https://…" value="${escapeHTML(existing?.onlineUrl ?? '')}">
            <label class="checkbox-label"><input id="agenda-repeat-weekly" name="repeatWeekly" type="checkbox" ${existing?.recurrence?.frequency === 'weekly' ? 'checked' : ''}> Ulangi setiap minggu</label>
            <div id="agenda-repeat-fields" ${existing?.recurrence?.frequency === 'weekly' ? '' : 'hidden'}><label for="agenda-repeat-until">Ulangi sampai</label><input id="agenda-repeat-until" name="repeatUntil" type="date" value="${escapeHTML(existing?.recurrence?.until ?? state.courses.find((course) => course.id === recordId)?.endDate ?? dateOffset(today(), 90))}" ${existing?.recurrence?.frequency === 'weekly' ? 'required' : ''}></div>
            <label for="agenda-course">Mata kuliah <span>(opsional)</span></label><select id="agenda-course" name="courseId"><option value="">Tanpa mata kuliah</option>${state.courses.filter((course) => !course.archivedAt).map((course) => `<option value="${escapeHTML(course.id)}" ${course.id === (existing?.courseId ?? recordId) ? 'selected' : ''}>${escapeHTML(course.name)}</option>`).join('')}</select>
            ${renderReminderFields(existing?.reminders ?? [existing?.allDay ? 1440 : 30], Boolean(existing?.allDay), 'agenda')}`}
        <p class="dialog-error" role="alert"></p>
        <div class="dialog-actions"><button class="button" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">${isConversion ? 'Konversi & simpan' : 'Simpan'}</button></div>
      </form>`
  } else {
    dialog.innerHTML = `
      <form id="record-form" class="dialog-form">
        <div class="dialog-heading"><p class="eyebrow">QUICK CAPTURE</p><h2 id="dialog-title">Simpan ke Inbox</h2></div>
        <label for="inbox-content">Teks atau URL</label><textarea id="inbox-content" name="content" rows="5" maxlength="4000" required autofocus placeholder="Simpan ide, pengingat, atau tautan…">${escapeHTML(content)}</textarea>
        <p class="dialog-error" role="alert"></p>
        <div class="dialog-actions"><button class="button" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">Simpan</button></div>
      </form>`
  }

  dialog.showModal()
  dialog.querySelector('input:not([type="hidden"]), textarea')?.focus()

  const allDayToggle = dialog.querySelector('#agenda-all-day')
  let remindersTouched = false
  dialog.querySelectorAll('input[name="reminderOffsets"]').forEach((input) => {
    input.addEventListener('change', () => { remindersTouched = true })
  })
  dialog.querySelector('#agenda-custom-reminder')?.addEventListener('input', () => { remindersTouched = true })
  allDayToggle?.addEventListener('change', () => {
    dialog.querySelector('#agenda-timed-fields').hidden = allDayToggle.checked
    dialog.querySelector('#agenda-all-day-field').hidden = !allDayToggle.checked
    dialog.querySelector('#agenda-start').required = !allDayToggle.checked
    dialog.querySelector('#agenda-end').required = !allDayToggle.checked
    dialog.querySelector('#agenda-date').required = allDayToggle.checked
    if (!remindersTouched) setDefaultReminder(dialog, 'agenda', allDayToggle.checked ? 1440 : 30)
  })

  const repeatWeeklyToggle = dialog.querySelector('#agenda-repeat-weekly')
  repeatWeeklyToggle?.addEventListener('change', () => {
    const repeatFields = dialog.querySelector('#agenda-repeat-fields')
    const repeatUntil = dialog.querySelector('#agenda-repeat-until')
    repeatFields.hidden = !repeatWeeklyToggle.checked
    repeatUntil.required = repeatWeeklyToggle.checked
  })

  dialog.querySelector('#record-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const sourceId = String(form.get('sourceInboxId') ?? '')

    try {
      if (kind === 'course') {
        const record = normalizeCourse({
          name: form.get('name'),
          code: form.get('code'),
          instructor: form.get('instructor'),
          period: form.get('period'),
          academicYear: form.get('academicYear'),
          startDate: form.get('startDate'),
          endDate: form.get('endDate'),
          color: form.get('color'),
        })
        if (existing) {
          record.id = existing.id
          record.archivedAt = existing.archivedAt ?? null
        }
        const savedCourse = await saveRecord(state.database, 'courses', record)
        state.selectedCourseId = savedCourse.id
        state.page = 'courses'
      } else if (kind === 'task') {
        const record = normalizeTask({
          title: form.get('title'),
          description: form.get('description'),
          dueDate: form.get('dueDate'),
          status: form.get('status'),
          courseIds: form.getAll('courseIds'),
        })
        if (sourceId) await saveConvertedRecord(state.database, 'tasks', record, sourceId)
        else await saveRecord(state.database, 'tasks', existing ? { ...record, id: existing.id, sourceInboxId: existing.sourceInboxId } : record)
      } else if (kind === 'agenda') {
        const record = normalizeAgenda({
          title: form.get('title'),
          allDay: form.get('allDay') === 'on',
          date: form.get('date'),
          startsAt: form.get('startsAt'),
          endsAt: form.get('endsAt'),
          recurrence: form.get('repeatWeekly') === 'on' ? 'weekly' : '',
          repeatUntil: form.get('repeatUntil'),
          courseId: form.get('courseId'),
          category: form.get('category'),
          categoryColor: form.get('categoryColor'),
          location: form.get('location'),
          onlineUrl: form.get('onlineUrl'),
          reminders: readReminderValues(form),
        })
        if (sourceId) await saveConvertedRecord(state.database, 'agendas', record, sourceId)
        else await saveRecord(state.database, 'agendas', existing ? { ...record, id: existing.id, sourceInboxId: existing.sourceInboxId } : record)
      } else {
        await saveRecord(state.database, 'inbox', normalizeInbox({ content: form.get('content') }))
      }
      dialog.close()
      state.message = sourceId ? 'Item Inbox dikonversi dan tetap tertaut ke sumbernya.' : existing ? 'Perubahan disimpan di perangkat ini.' : 'Tersimpan di perangkat ini.'
      await refreshData()
    } catch (error) {
      dialog.querySelector('.dialog-error').textContent = error.message || 'Gagal menyimpan. Coba lagi.'
    }
  })
}

async function handleClick(event) {
  const pageButton = event.target.closest('[data-page]')
  if (pageButton) {
    event.preventDefault()
    state.page = pageButton.dataset.page
    state.selectedCourseId = pageButton.dataset.courseId ?? ''
    state.isMoreOpen = false
    render()
    return
  }

  const button = event.target.closest('[data-action]')
  if (!button) return

  const { action, id, store } = button.dataset
  try {
    if (action === 'toggle-more') {
      state.isMoreOpen = !state.isMoreOpen
      render()
      if (state.isMoreOpen) {
        requestAnimationFrame(() => {
          document.querySelector('.more-sheet [data-page], .more-sheet-close')?.focus()
        })
      } else {
        requestAnimationFrame(() => {
          document.querySelector('[data-action="toggle-more"]')?.focus()
        })
      }
      return
    }
    if (action === 'close-more') {
      state.isMoreOpen = false
      render()
      requestAnimationFrame(() => {
        document.querySelector('[data-action="toggle-more"]')?.focus()
      })
      return
    }
    if (action === 'new-task') openDialog('task')
    if (action === 'new-course-task') openDialog('task', '', id)
    if (action === 'task-edit') openDialog('task', '', id)
    if (action === 'new-agenda') openDialog('agenda')
    if (action === 'new-course-agenda') openDialog('agenda', '', id)
    if (action === 'agenda-edit') openDialog('agenda', '', id)
    if (action === 'new-inbox') openDialog('inbox')
    if (action === 'task-filter') {
      state.taskFilter = button.dataset.filter
      render()
    }
    if (action === 'inbox-view') {
      state.inboxView = button.dataset.view
      render()
    }
    if (action === 'occurrence-edit') openOccurrenceDialog(id, button.dataset.date)
    if (action === 'calendar-view') {
      state.calendarView = button.dataset.view
      render()
    }
    if (action === 'calendar-today') {
      state.calendarDate = today()
      render()
    }
    if (action === 'calendar-step') {
      const direction = Number(button.dataset.direction)
      if (state.calendarView === 'day') state.calendarDate = dateOffset(state.calendarDate, direction)
      if (state.calendarView === 'week') state.calendarDate = dateOffset(state.calendarDate, direction * 7)
      if (state.calendarView === 'month') {
        const [year, month] = state.calendarDate.slice(0, 7).split('-').map(Number)
        const date = new Date(year, month - 1 + direction, 1)
        state.calendarDate = localDateKey(date)
      }
      render()
    }
    if (action === 'calendar-select-date') {
      state.calendarDate = button.dataset.date
      state.calendarView = 'day'
      render()
    }
    if (action === 'calendar-task') {
      state.page = 'tasks'
      render()
    }
    if (action === 'new-course') openDialog('course')
    if (action === 'course-edit') openDialog('course', '', id)
    if (action === 'course-open') {
      state.selectedCourseId = id
      render()
    }
    if (action === 'courses-back') {
      state.selectedCourseId = ''
      render()
    }
    if (action === 'toggle-archived-courses') {
      state.showArchivedCourses = !state.showArchivedCourses
      render()
    }
    if (action === 'course-archive' || action === 'course-restore') {
      const course = state.courses.find((item) => item.id === id)
      if (!course) throw new Error('Mata kuliah tidak ditemukan. Muat ulang halaman.')
      await saveRecord(state.database, 'courses', {
        ...course,
        archivedAt: action === 'course-archive' ? new Date().toISOString() : null,
      })
      state.message = action === 'course-archive' ? 'Mata kuliah diarsipkan. Riwayat dan relasinya tetap tersimpan.' : 'Mata kuliah dipulihkan.'
      state.selectedCourseId = ''
      state.showArchivedCourses = false
      await refreshData()
    }
    if (action === 'convert-task') openDialog('task', id)
    if (action === 'convert-agenda') openDialog('agenda', id)
    if (action === 'close-dialog') document.querySelector('#record-dialog').close()
    if (action === 'export-backup') {
      const backup = await createBackup(await readBackupRecords(state.database))
      const file = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const download = document.createElement('a')
      download.href = URL.createObjectURL(file)
      download.download = `ae-chrono-log-backup-${today()}.json`
      download.click()
      window.setTimeout(() => URL.revokeObjectURL(download.href), 0)
      showMessage('Backup berhasil diekspor. Simpan file tersebut di tempat yang aman.')
    }
    if (action === 'import-backup') document.querySelector('#backup-file').click()
    if (action === 'restore-snapshot') {
      const snapshot = state.recoverySnapshots.find((item) => item.id === id)
      if (!snapshot) throw new Error('Snapshot pemulihan tidak ditemukan. Muat ulang halaman.')
      if (window.confirm('Ganti seluruh data saat ini dengan snapshot sebelum pemulihan ini? Kondisi sekarang akan disimpan sebagai snapshot baru.')) {
        await restoreBackupRecords(state.database, snapshot.payload)
        state.message = 'Snapshot dipulihkan. Kondisi sebelumnya tetap tersedia di daftar snapshot.'
        await refreshData()
      }
    }
    if (action === 'delete' && window.confirm('Hapus item ini? Item akan disembunyikan dari daftar.')) {
      await softDeleteRecord(state.database, store, id)
      state.message = 'Item dihapus dari daftar pada perangkat ini.'
      await refreshData()
    }
  } catch (error) {
    showMessage(error.message || 'Operasi gagal. Coba lagi.')
  }
}

async function handleChange(event) {
  const target = event.target
  if (target.id === 'backup-file' && target.files?.[0]) {
    try {
      const payload = await parseBackup(await target.files[0].text())
      if (!window.confirm('File valid. Ganti seluruh data di perangkat ini dengan isi backup? Kondisi saat ini akan disimpan sebagai snapshot pemulihan.')) return
      await restoreBackupRecords(state.database, payload)
      state.message = 'Backup berhasil dipulihkan. Data sebelum pemulihan tersedia sebagai snapshot.'
      await refreshData()
    } catch (error) {
      showMessage(error.message || 'Backup gagal dipulihkan.')
    } finally {
      target.value = ''
    }
    return
  }
  if (target.id === 'task-filter') {
    state.taskFilter = target.value
    render()
    return
  }
  if (['search-type', 'search-from', 'search-to'].includes(target.id)) {
    if (target.id === 'search-type') state.searchType = target.value
    if (target.id === 'search-from') state.searchFrom = target.value
    if (target.id === 'search-to') state.searchTo = target.value
    render()
    return
  }
  if (!target.matches('[data-action="task-status"]')) return
  const task = state.tasks.find((record) => record.id === target.dataset.id)
  if (!task) {
    showMessage('Tugas tidak ditemukan. Muat ulang halaman.')
    return
  }

  try {
    await saveRecord(state.database, 'tasks', { ...task, status: target.value })
    state.message = 'Status tugas diperbarui.'
    await refreshData()
  } catch (error) {
    showMessage(error.message || 'Status tugas gagal diperbarui.')
  }
}

let searchTimer
function handleInput(event) {
  if (event.target.id !== 'global-search') return
  const { selectionStart, selectionEnd } = event.target
  state.query = event.target.value
  if (state.query.trim() && state.page !== 'search') {
    state.searchReturnPage = state.page
    state.page = 'search'
  } else if (!state.query.trim() && state.page === 'search') {
    state.page = state.searchReturnPage
  }
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    render()
    const input = document.querySelector('#global-search')
    input?.focus()
    input?.setSelectionRange(selectionStart, selectionEnd)
  }, 120)
}

app.addEventListener('click', (event) => { void handleClick(event) })
app.addEventListener('change', (event) => { void handleChange(event) })
app.addEventListener('input', handleInput)
window.addEventListener('keydown', (event) => {
  if (state.isMoreOpen) {
    if (event.key === 'Escape') {
      event.preventDefault()
      state.isMoreOpen = false
      render()
      requestAnimationFrame(() => {
        document.querySelector('[data-action="toggle-more"]')?.focus()
      })
      return
    }
    if (event.key === 'Tab') {
      const sheet = document.querySelector('.more-sheet')
      if (sheet) {
        const focusable = Array.from(sheet.querySelectorAll('button:not([disabled])'))
        if (focusable.length > 0) {
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }
    }
  }
})
window.addEventListener('online', () => showMessage('Koneksi internet kembali tersedia. Data tetap tersimpan lokal sampai sinkronisasi tersedia.'))
window.addEventListener('offline', () => showMessage('Kamu sedang offline. Data lokal tetap bisa digunakan.'))

async function start() {
  try {
    state.database = await openDatabase()
    await refreshData()
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      const buildId = [
        new URL(import.meta.url).pathname.split('/').pop(),
        ...[...document.querySelectorAll('link[rel="stylesheet"]')]
          .map((link) => new URL(link.href).pathname.split('/').pop()),
      ].join('-')
      await navigator.serviceWorker.register(`/sw.js?version=${SERVICE_WORKER_CACHE_VERSION}&build=${encodeURIComponent(buildId)}`)
    }
  } catch (error) {
    app.innerHTML = `<main class="startup-error"><p class="eyebrow">PENYIMPANAN LOKAL</p><h1>Aplikasi belum bisa dibuka.</h1><p>${escapeHTML(error.message || 'Periksa dukungan browser untuk penyimpanan lokal.')}</p><button class="button button-dark" type="button" onclick="location.reload()">Coba lagi</button></main>`
  }
}

void start()
