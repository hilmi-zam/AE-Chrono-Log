import { app, state } from './state.js'
import { AGENDA_COLORS, COURSE_COLORS, expandAgendaOccurrences, isOverdue, localDateKey, TASK_STATUSES } from './domain.js'
import { byDateAndTitle, dateFormatter, dateOffset, escapeHTML, formatAgendaTime, formatDate, formatReminder, today } from './utils.js'

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

function calendarEntryDetails(item, time) {
  return [
    time,
    item.category,
    item.courseId ? state.courses.find((course) => course.id === item.courseId)?.name : '',
    item.location,
    item.status === 'cancelled' ? 'Dibatalkan' : '',
  ].filter(Boolean).join(' · ')
}

function renderCalendarDayEntry(item, time, color, details) {
  const taskAction = `<button class="button button-small" type="button" data-action="calendar-task" data-id="${escapeHTML(item.id)}">Lihat tugas</button>`
  const occurrenceAction = `<button class="button button-small" type="button" data-action="occurrence-edit" data-id="${escapeHTML(item.seriesId)}" data-date="${escapeHTML(item.originalDate)}">Ubah pertemuan</button>`
  const agendaActions = `<button class="button button-small" type="button" data-action="agenda-edit" data-id="${escapeHTML(item.id)}">Edit agenda</button><button class="icon-button" type="button" data-action="delete" data-store="agendas" data-id="${escapeHTML(item.id)}" aria-label="Hapus agenda ${escapeHTML(item.title)}">×</button>`
  const action = item.isTask ? taskAction : item.recurrence?.frequency === 'weekly' ? occurrenceAction : agendaActions
  return `<article class="calendar-day-entry${item.status === 'cancelled' ? ' is-cancelled' : ''}${item.isTask ? ' is-task-deadline' : ''}" ${item.isTask ? '' : `style="--event-color:${color}"`}>
    <div class="record-time">${escapeHTML(time)}</div>
    <div class="record-copy"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(details)}</p>${item.topic ? `<p><strong>${escapeHTML(item.topic)}</strong></p>` : ''}${item.summary ? `<p class="record-description">${escapeHTML(item.summary)}</p>` : ''}${item.materialUrl ? `<p><a href="${escapeHTML(item.materialUrl)}" target="_blank" rel="noopener noreferrer">Buka materi</a></p>` : ''}</div>
    ${action}
  </article>`
}

function renderCompactCalendarEntry(item, time, color, details) {
  const action = item.isTask ? 'calendar-task' : item.recurrence?.frequency === 'weekly' ? 'occurrence-edit' : 'calendar-select-date'
  return `<button class="calendar-event${item.isTask ? ' calendar-event-task' : ''}${item.status === 'cancelled' ? ' calendar-event-cancelled' : ''}" type="button" ${item.isTask ? '' : `style="--event-color:${color}"`} data-action="${action}" data-id="${escapeHTML(item.isTask ? item.id : item.seriesId ?? item.id)}" data-date="${escapeHTML(item.originalDate ?? item.date)}" title="${escapeHTML(`${item.title} · ${details}`)}">
    <span>${escapeHTML(item.isTask ? 'Tugas' : time)}</span><strong>${escapeHTML(item.title)}</strong>
  </button>`
}

function renderCalendarEntry(item, compact = false) {
  const time = item.isTask ? 'Deadline' : formatAgendaTime(item)
  const color = /^#[\da-f]{6}$/i.test(item.categoryColor ?? '') ? item.categoryColor : AGENDA_COLORS[0]
  const details = calendarEntryDetails(item, time)
  return compact
    ? renderCompactCalendarEntry(item, time, color, details)
    : renderCalendarDayEntry(item, time, color, details)
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

function renderAgendaCopy(agenda, course, cancelled, repeated, reminderText) {
  return `<div class="record-copy"><h3>${escapeHTML(agenda.title)}</h3><p>${agenda.allDay ? 'Agenda sepanjang hari' : formatDate(agenda.date)}${course ? ` · ${escapeHTML(course.name)}` : ''}${agenda.category ? ` · ${escapeHTML(agenda.category)}` : ''}${cancelled ? ' · <strong class="overdue-label">Dibatalkan</strong>' : ''}${repeated ? ' · Mingguan' : ''}${agenda.sourceInboxId ? ' · Dari Inbox' : ''}</p>${agenda.location ? `<p>Lokasi: ${escapeHTML(agenda.location)}</p>` : ''}${agenda.onlineUrl ? `<p><a href="${escapeHTML(agenda.onlineUrl)}" target="_blank" rel="noopener noreferrer">Buka tautan online</a></p>` : ''}${reminderText ? `<p class="muted-copy">${escapeHTML(reminderText)}</p>` : ''}${agenda.topic ? `<p><strong>${escapeHTML(agenda.topic)}</strong></p>` : ''}${agenda.summary ? `<p class="record-description">${escapeHTML(agenda.summary)}</p>` : ''}${agenda.materialUrl ? `<p><a href="${escapeHTML(agenda.materialUrl)}" target="_blank" rel="noopener noreferrer">Buka materi</a></p>` : ''}</div>`
}

function renderAgendaActions(agenda, repeated, allowOccurrenceEdit) {
  const occurrenceButton = repeated && allowOccurrenceEdit
    ? `<button class="button button-small" type="button" data-action="occurrence-edit" data-id="${escapeHTML(agenda.seriesId)}" data-date="${escapeHTML(agenda.originalDate)}">Ubah pertemuan</button>`
    : ''
  const editButton = !agenda.archivedAt
    ? `<button class="button button-small" type="button" data-action="agenda-edit" data-id="${escapeHTML(repeated ? agenda.seriesId : agenda.id)}">Edit agenda</button>`
    : ''
  const deleteButton = !repeated
    ? `<button class="icon-button" type="button" data-action="delete" data-store="agendas" data-id="${escapeHTML(agenda.id)}" aria-label="Hapus agenda ${escapeHTML(agenda.title)}">×</button>`
    : ''
  return `${occurrenceButton}${editButton}${deleteButton}`
}

function renderAgendaCard(agenda, allowOccurrenceEdit = true) {
  const course = state.courses.find((item) => item.id === agenda.courseId)
  const repeated = agenda.recurrence?.frequency === 'weekly'
  const cancelled = agenda.status === 'cancelled'
  const color = /^#[\da-f]{6}$/i.test(agenda.categoryColor ?? '') ? agenda.categoryColor : AGENDA_COLORS[0]
  const reminderText = (agenda.reminders ?? []).length ? `Pengingat: ${agenda.reminders.map(formatReminder).join(', ')}` : ''
  return `
    <article class="record-row agenda-row${cancelled ? ' is-cancelled' : ''}" style="--event-color:${color}">
      <div class="record-time">${escapeHTML(formatAgendaTime(agenda))}</div>
      ${renderAgendaCopy(agenda, course, cancelled, repeated, reminderText)}
      ${renderAgendaActions(agenda, repeated, allowOccurrenceEdit)}
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

function renderCourseOverview(course, period) {
  const heading = course.archivedAt ? 'DIARSIPKAN' : 'MATA KULIAH'
  const code = course.code ? ` · ${escapeHTML(course.code)}` : ''
  const coursePeriod = [period, course.instructor].filter(Boolean).join(' · ') || 'Periode belum diisi'
  const dates = course.startDate || course.endDate
    ? `<p>${course.startDate ? formatDate(course.startDate) : 'Tanggal mulai belum diisi'} – ${course.endDate ? formatDate(course.endDate) : 'Tanggal akhir belum diisi'}</p>`
    : ''
  return `<div class="course-detail-heading"><span class="course-color course-color-large" style="--course-color:${courseColor(course)}"></span><div><p class="eyebrow">${heading}${code}</p><h2>${escapeHTML(course.name)}</h2><p>${escapeHTML(coursePeriod)}</p>${dates}</div></div>`
}

function renderCourseMeetings(course, meetings) {
  const addButton = course.archivedAt
    ? ''
    : `<button class="button button-dark" type="button" data-action="new-course-agenda" data-id="${escapeHTML(course.id)}">+ Tambah jadwal</button>`
  const content = meetings.length
    ? `<div class="record-list">${meetings.map((meeting) => `<div class="dated-row"><span class="date-chip">${formatDate(meeting.date)}</span>${renderAgendaCard(meeting, !course.archivedAt)}</div>`).join('')}</div>`
    : emptyState('Belum ada jadwal kuliah', 'Tambahkan jadwal mingguan untuk melihat dan mencatat tiap pertemuan.')
  return `<div class="panel-heading course-section-heading"><div><p class="eyebrow">JADWAL BERULANG & PERTEMUAN</p><h3>Pertemuan (${meetings.length})</h3></div>${addButton}</div>${content}`
}

function renderCourseTasks(course, tasks) {
  const addButton = course.archivedAt
    ? ''
    : `<button class="button button-dark" type="button" data-action="new-course-task" data-id="${escapeHTML(course.id)}">+ Tambah tugas</button>`
  const content = tasks.length
    ? `<div class="record-list">${tasks.map((task) => renderTaskCard(task)).join('')}</div>`
    : emptyState('Belum ada tugas', 'Tautkan tugas ke mata kuliah ini saat membuat tugas.')
  return `<div class="panel-heading course-section-heading"><div><p class="eyebrow">TERKAIT</p><h3>Tugas (${tasks.length})</h3></div>${addButton}</div>${content}`
}

function renderCourseArchiveAction(course) {
  const action = course.archivedAt ? 'course-restore' : 'course-archive'
  const label = course.archivedAt ? 'Pulihkan mata kuliah' : 'Arsipkan mata kuliah'
  return `<div class="course-archive-actions"><button class="button" type="button" data-action="${action}" data-id="${escapeHTML(course.id)}">${label}</button></div>`
}

function renderSelectedCourse(course) {
  const tasks = state.tasks.filter((task) => task.courseIds?.includes(course.id)).sort(byDateAndTitle)
  const lowerBound = dateOffset(today(), -30)
  const upperBound = dateOffset(today(), 90)
  const fromDate = course.startDate && course.startDate > lowerBound ? course.startDate : lowerBound
  const throughDate = course.endDate && course.endDate < upperBound ? course.endDate : upperBound
  const meetings = agendaOccurrences(fromDate, throughDate).filter((agenda) => agenda.courseId === course.id)
  const period = [course.period, course.academicYear].filter(Boolean).join(' · ')
  return `<section class="panel">
    <div class="panel-heading"><button class="text-button" type="button" data-action="courses-back">← Semua mata kuliah</button><button class="button" type="button" data-action="course-edit" data-id="${escapeHTML(course.id)}">Edit</button></div>
    ${renderCourseOverview(course, period)}
    ${renderCourseMeetings(course, meetings)}
    ${renderCourseTasks(course, tasks)}
    ${renderCourseArchiveAction(course)}
  </section>`
}

function renderCourseCatalog() {
  const courses = state.courses.filter((item) => Boolean(item.archivedAt) === state.showArchivedCourses)
    .sort((left, right) => left.name.localeCompare(right.name, 'id'))
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">${state.showArchivedCourses ? 'RIWAYAT' : 'KATALOG'}</p><h2>${state.showArchivedCourses ? 'Mata kuliah diarsipkan' : 'Mata kuliah aktif'}</h2></div><div class="course-list-actions"><button class="button" type="button" data-action="toggle-archived-courses">${state.showArchivedCourses ? 'Lihat yang aktif' : 'Lihat arsip'}</button>${!state.showArchivedCourses ? '<button class="button button-dark" type="button" data-action="new-course">+ Tambah</button>' : ''}</div></div>
    ${courses.length ? `<div class="course-list">${courses.map(renderCourseCard).join('')}</div>` : emptyState(state.showArchivedCourses ? 'Belum ada arsip' : 'Belum ada mata kuliah', state.showArchivedCourses ? 'Mata kuliah yang diarsipkan akan muncul di sini.' : 'Tambahkan penawaran mata kuliah untuk satu periode.')}</section>`
}

function renderCoursePage() {
  const course = state.courses.find((item) => item.id === state.selectedCourseId)
  return course ? renderSelectedCourse(course) : renderCourseCatalog()
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

function addReminderPreview(previews, now, fireAt, title, detail) {
  const horizon = new Date(now.getTime() + 90 * 86400000)
  if (fireAt > now && fireAt < horizon) previews.push({ at: fireAt, title, detail })
}

function appendTaskReminderPreviews(task, now, previews) {
  if (task.status === 'Selesai' || !task.dueDate) return
  const due = new Date(`${task.dueDate}T09:00:00`)
  for (const [label, offset] of [['H-3', 3], ['H-1', 1], ['Hari H', 0]]) {
    const fireAt = new Date(due.getTime() - offset * 86400000)
    const detail = `Tugas · ${label} deadline${offset ? ` · ${formatDate(task.dueDate)}` : ''}`
    addReminderPreview(previews, now, fireAt, task.title, detail)
  }
}

function appendAgendaReminderPreviews(agenda, now, previews) {
  if (agenda.status === 'cancelled') return
  const startsAt = agenda.allDay ? new Date(`${agenda.date}T09:00:00`) : new Date(agenda.startsAt)
  for (const minutes of agenda.reminders ?? []) {
    const fireAt = new Date(startsAt.getTime() - minutes * 60000)
    const detail = `Agenda · ${formatReminder(minutes)} · ${formatDate(agenda.date)}`
    addReminderPreview(previews, now, fireAt, agenda.title, detail)
  }
}

function reminderPreviews() {
  const now = new Date()
  const previews = []
  for (const task of state.tasks) appendTaskReminderPreviews(task, now, previews)
  const agendas = expandAgendaOccurrences(state.agendas, today(), dateOffset(today(), 90))
  for (const agenda of agendas) appendAgendaReminderPreviews(agenda, now, previews)
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
        ${agendas.length ? `<div class="record-list">${agendas.map((agenda) => renderAgendaCard(agenda)).join('')}</div>` : emptyState('Belum ada agenda', 'Tambahkan kegiatan yang ingin kamu ingat hari ini.')}
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

function quickAddAction() {
  if (state.page === 'courses') return state.selectedCourseId ? 'new-course-task' : 'new-course'
  if (state.page === 'tasks') return 'new-task'
  if (state.page === 'agenda') return 'new-agenda'
  return 'new-inbox'
}

function renderSidebar(activeInboxCount, isSecondaryPage) {
  return `<aside class="sidebar">
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
  </aside>`
}

function renderMoreSheet() {
  if (!state.isMoreOpen) return ''
  return `<div class="more-sheet-backdrop" data-action="close-more" aria-hidden="true"></div>
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
    </div>`
}

function renderTopbar(title, subtitle, selectedCourse) {
  const courseId = state.page === 'courses' && state.selectedCourseId
    ? `data-id="${escapeHTML(state.selectedCourseId)}"`
    : ''
  const hidden = ['notifications', 'settings'].includes(state.page) || selectedCourse?.archivedAt
    ? 'hidden'
    : ''
  return `<header class="topbar"><div class="mobile-brand"><span class="mobile-brand-mark">Æ</span><strong>Chrono Log</strong><span class="mobile-brand-state"><span class="local-dot"></span> Lokal</span></div><div class="topbar-title"><p class="eyebrow">${escapeHTML(subtitle.toUpperCase())} <span>/</span> PROTOTIPE LOKAL</p><h1>${escapeHTML(title)}</h1></div>
    <div class="topbar-actions"><label class="search-box"><span aria-hidden="true">⌕</span><span class="sr-only">Cari tugas, agenda, mata kuliah, atau Inbox</span><input id="global-search" type="search" placeholder="Cari di ruangmu…" value="${escapeHTML(state.query)}" autocomplete="off"></label><button class="button button-dark" data-action="${quickAddAction()}" ${courseId} ${hidden}>+ Tambah</button></div>
  </header>`
}

export function render() {
  const [title, subtitle] = pageTitle()
  const activeInboxCount = state.inbox.filter((item) => item.status === 'active').length
  const searchResults = state.page === 'search' ? '' : filteredSearch()
  const selectedCourse = state.courses.find((course) => course.id === state.selectedCourseId)
  const isSecondaryPage = ['courses', 'notifications', 'settings'].includes(state.page)
  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(activeInboxCount, isSecondaryPage)}
      ${renderMoreSheet()}
      <main class="main-content">
        ${renderTopbar(title, subtitle, selectedCourse)}
        <p class="prototype-note"><strong>Mode lokal tahap awal.</strong> Data tersimpan di browser ini; sinkronisasi antarperangkat dan autentikasi belum tersedia. Ekspor backup secara berkala dari Pengaturan.</p>
        <div id="notice" class="notice" role="status" aria-live="polite" ${state.message ? '' : 'hidden'}>${escapeHTML(state.message)}</div>
        <div class="search-slot">${searchResults}</div>
        <section class="page-content">${renderPageContent()}</section>
      </main>
      <dialog id="record-dialog" aria-labelledby="dialog-title"></dialog>
    </div>`
}
