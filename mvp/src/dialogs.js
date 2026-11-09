import { state } from './state.js'
import { AGENDA_COLORS, COURSE_COLORS, localDateKey, normalizeAgenda, normalizeCourse, normalizeInbox, normalizeOccurrenceException, normalizeTask, TASK_STATUSES } from './domain.js'
import { saveConvertedRecord, saveOccurrenceException, saveRecord } from './db.js'
import { dateOffset, escapeHTML, formatDate, readReminderValues, renderReminderFields, setDefaultReminder, today } from './utils.js'

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

function bindOccurrenceControls(dialog, series, originalDate, existing, refreshData) {
  const remindersTouched = { value: false }
  const reminderOverrideExists = Array.isArray(existing.reminders)
  dialog.querySelectorAll('input[name="reminderOffsets"]').forEach((input) => {
    input.addEventListener('change', () => { remindersTouched.value = true })
  })
  dialog.querySelector('#occurrence-custom-reminder').addEventListener('input', () => { remindersTouched.value = true })
  dialog.querySelector('#occurrence-all-day').addEventListener('change', (event) => {
    const isAllDay = event.currentTarget.checked
    dialog.querySelector('#occurrence-timed-fields').hidden = isAllDay
    dialog.querySelector('#occurrence-all-day-field').hidden = !isAllDay
    dialog.querySelector('#occurrence-start').required = !isAllDay
    dialog.querySelector('#occurrence-end').required = !isAllDay
    dialog.querySelector('#occurrence-date').required = isAllDay
    if (!reminderOverrideExists && !remindersTouched.value) {
      setDefaultReminder(dialog, 'occurrence', isAllDay ? 1440 : 30)
    }
  })
  dialog.querySelector('#occurrence-form').addEventListener('submit', (event) => {
    void submitOccurrence(event, series, originalDate, dialog, refreshData)
  })
}

function occurrenceExceptionFromForm(form, series, originalDate) {
  const isAllDay = form.get('allDay') === 'on'
  const date = isAllDay ? String(form.get('date')) : localDateKey(new Date(String(form.get('startsAt'))))
  const startValue = isAllDay ? '' : String(form.get('startsAt'))
  const endValue = isAllDay ? '' : String(form.get('endsAt'))
  const baseStart = series.allDay ? '' : localDateTimeValue(occurrenceDateTime(series, originalDate))
  const baseEnd = series.allDay ? '' : localDateTimeValue(occurrenceDateTime(series, originalDate, true))
  const moved = isAllDay
    ? date !== originalDate || !series.allDay
    : date !== originalDate || startValue !== baseStart || endValue !== baseEnd || series.allDay
  return normalizeOccurrenceException({
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
}

async function submitOccurrence(event, series, originalDate, dialog, refreshData) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  try {
    const exception = occurrenceExceptionFromForm(form, series, originalDate)
    await saveOccurrenceException(state.database, series.id, originalDate, exception)
    dialog.close()
    state.message = exception.status === 'cancelled'
      ? 'Pertemuan dibatalkan; jadwal mingguan tetap.'
      : 'Perubahan pertemuan disimpan tanpa mengubah jadwal mingguan.'
    await refreshData()
  } catch (error) {
    dialog.querySelector('.dialog-error').textContent = error.message || 'Gagal menyimpan pertemuan.'
  }
}

function openOccurrenceDialog(seriesId, originalDate, refreshData) {
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
  bindOccurrenceControls(dialog, series, originalDate, existing, refreshData)
}

function existingRecord(kind, recordId) {
  if (kind === 'course') return state.courses.find((course) => course.id === recordId)
  if (kind === 'task') return state.tasks.find((task) => task.id === recordId)
  if (kind === 'agenda') return state.agendas.find((agenda) => agenda.id === recordId)
  return null
}

function renderCourseForm(existing) {
  return `<form id="record-form" class="dialog-form">
    <div class="dialog-heading"><p class="eyebrow">${existing ? 'UBAH PENAWARAN' : 'KATALOG KULIAH'}</p><h2 id="dialog-title">${existing ? 'Edit mata kuliah' : 'Mata kuliah baru'}</h2></div>
    <label for="course-name">Nama mata kuliah</label><input id="course-name" name="name" maxlength="160" required value="${escapeHTML(existing?.name ?? '')}">
    <div class="form-grid"><div><label for="course-code">Kode <span>(opsional)</span></label><input id="course-code" name="code" maxlength="40" value="${escapeHTML(existing?.code ?? '')}"></div><div><label for="course-instructor">Pengajar <span>(opsional)</span></label><input id="course-instructor" name="instructor" maxlength="120" value="${escapeHTML(existing?.instructor ?? '')}"></div></div>
    <div class="form-grid"><div><label for="course-period">Periode/semester <span>(opsional)</span></label><input id="course-period" name="period" maxlength="60" value="${escapeHTML(existing?.period ?? '')}"></div><div><label for="course-year">Tahun akademik <span>(opsional)</span></label><input id="course-year" name="academicYear" maxlength="30" value="${escapeHTML(existing?.academicYear ?? '')}"></div></div>
    <div class="form-grid"><div><label for="course-start">Tanggal mulai <span>(opsional)</span></label><input id="course-start" name="startDate" type="date" value="${escapeHTML(existing?.startDate ?? '')}"></div><div><label for="course-end">Tanggal akhir <span>(opsional)</span></label><input id="course-end" name="endDate" type="date" value="${escapeHTML(existing?.endDate ?? '')}"></div></div>
    <label for="course-color">Warna <span>(opsional)</span></label><select id="course-color" name="color"><option value="">Tanpa warna</option>${COURSE_COLORS.map((color) => `<option value="${color}" ${color === existing?.color ? 'selected' : ''}>Warna ${color}</option>`).join('')}</select>
    <p class="dialog-error" role="alert"></p>
    <div class="dialog-actions"><button class="button" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">Simpan</button></div>
  </form>`
}

function renderTaskFields(existing, content, isConversion, recordId) {
  const activeCourses = state.courses.filter((course) => !course.archivedAt)
  const courseOptions = activeCourses.length
    ? activeCourses.map((course) => `<label class="checkbox-label"><input type="checkbox" name="courseIds" value="${escapeHTML(course.id)}" ${existing?.courseIds?.includes(course.id) || (!existing && course.id === recordId) ? 'checked' : ''}> ${escapeHTML(course.name)}</label>`).join('')
    : '<p class="muted-copy">Tambahkan mata kuliah terlebih dahulu.</p>'
  return `<label for="task-description">Deskripsi <span>(opsional)</span></label><textarea id="task-description" name="description" rows="3" maxlength="2000">${escapeHTML(existing?.description ?? (isConversion ? content : ''))}</textarea>
    <label for="task-due">Deadline <span>(opsional)</span></label><input id="task-due" name="dueDate" type="date" value="${escapeHTML(existing?.dueDate ?? '')}">
    <label for="task-status">Status</label><select id="task-status" name="status">${TASK_STATUSES.map((status) => `<option value="${escapeHTML(status)}" ${status === (existing?.status ?? TASK_STATUSES[0]) ? 'selected' : ''}>${escapeHTML(status)}</option>`).join('')}</select>
    <fieldset class="course-options"><legend>Mata kuliah <span>(opsional, bisa lebih dari satu)</span></legend>${courseOptions}</fieldset>`
}

function renderAgendaTimeFields(existing) {
  const timeRequired = existing?.allDay ? '' : 'required'
  const dateRequired = existing?.allDay ? 'required' : ''
  return `<div id="agenda-timed-fields" class="form-grid" ${existing?.allDay ? '' : 'hidden'}><div><label for="agenda-start">Mulai</label><input id="agenda-start" name="startsAt" type="datetime-local" value="${existing?.startsAt ? localDateTimeValue(new Date(existing.startsAt)) : localDateTimeValue()}" ${timeRequired}></div><div><label for="agenda-end">Selesai</label><input id="agenda-end" name="endsAt" type="datetime-local" value="${existing?.endsAt ? localDateTimeValue(new Date(existing.endsAt)) : localDateTimeValue(new Date(Date.now() + 60 * 60 * 1000))}" ${timeRequired}></div></div>
    <div id="agenda-all-day-field" ${existing?.allDay ? '' : 'hidden'}><label for="agenda-date">Tanggal</label><input id="agenda-date" name="date" type="date" value="${escapeHTML(existing?.date ?? today())}" ${dateRequired}></div>`
}

function renderAgendaDetailsFields(existing) {
  return `<div class="form-grid"><div><label for="agenda-category">Kategori</label><input id="agenda-category" name="category" maxlength="80" list="agenda-category-options" value="${escapeHTML(existing?.category ?? 'Pribadi')}"><datalist id="agenda-category-options"><option value="Kuliah"><option value="Organisasi"><option value="Pribadi"><option value="Proyek"></datalist></div><div><label for="agenda-category-color">Warna kategori</label><input id="agenda-category-color" name="categoryColor" type="color" value="${escapeHTML(existing?.categoryColor ?? AGENDA_COLORS[0])}"></div></div>
    <label for="agenda-location">Lokasi fisik <span>(opsional)</span></label><input id="agenda-location" name="location" maxlength="200" placeholder="Gedung, ruang, atau alamat" value="${escapeHTML(existing?.location ?? '')}">
    <label for="agenda-online-url">Tautan online <span>(opsional)</span></label><input id="agenda-online-url" name="onlineUrl" type="url" maxlength="2048" placeholder="https://…" value="${escapeHTML(existing?.onlineUrl ?? '')}">`
}

function renderAgendaRecurrenceFields(existing, recordId) {
  const repeatUntil = existing?.recurrence?.until
    ?? state.courses.find((course) => course.id === recordId)?.endDate
    ?? dateOffset(today(), 90)
  const isWeekly = existing?.recurrence?.frequency === 'weekly'
  const repeatRequired = isWeekly ? 'required' : ''
  return `<label class="checkbox-label"><input id="agenda-repeat-weekly" name="repeatWeekly" type="checkbox" ${isWeekly ? 'checked' : ''}> Ulangi setiap minggu</label>
    <div id="agenda-repeat-fields" ${isWeekly ? '' : 'hidden'}><label for="agenda-repeat-until">Ulangi sampai</label><input id="agenda-repeat-until" name="repeatUntil" type="date" value="${escapeHTML(repeatUntil)}" ${repeatRequired}></div>`
}

function renderAgendaCourseField(existing, recordId) {
  const activeCourses = state.courses.filter((course) => !course.archivedAt)
  const courseOptions = activeCourses.map((course) => `<option value="${escapeHTML(course.id)}" ${course.id === (existing?.courseId ?? recordId) ? 'selected' : ''}>${escapeHTML(course.name)}</option>`).join('')
  return `<label for="agenda-course">Mata kuliah <span>(opsional)</span></label><select id="agenda-course" name="courseId"><option value="">Tanpa mata kuliah</option>${courseOptions}</select>`
}

function renderAgendaFields(existing, recordId) {
  const reminders = existing?.reminders ?? [existing?.allDay ? 1440 : 30]
  return `<label class="checkbox-label"><input id="agenda-all-day" name="allDay" type="checkbox" ${existing?.allDay ? 'checked' : ''}> Sepanjang hari</label>
    ${renderAgendaTimeFields(existing)}
    ${renderAgendaDetailsFields(existing)}
    ${renderAgendaRecurrenceFields(existing, recordId)}
    ${renderAgendaCourseField(existing, recordId)}
    ${renderReminderFields(reminders, Boolean(existing?.allDay), 'agenda')}`
}

function renderTaskOrAgendaForm(kind, existing, sourceInboxId, content, isConversion, recordId) {
  const heading = existing ? 'UBAH CATATAN' : isConversion ? 'KONVERSI INBOX' : 'CATATAN BARU'
  const title = existing
    ? `Edit ${kind === 'task' ? 'tugas' : 'agenda'}`
    : kind === 'task' ? 'Tugas baru' : 'Agenda baru'
  const value = existing?.title ?? content
  const fields = kind === 'task'
    ? renderTaskFields(existing, content, isConversion, recordId)
    : renderAgendaFields(existing, recordId)
  const saveLabel = isConversion ? 'Konversi & simpan' : 'Simpan'
  return `<form id="record-form" class="dialog-form">
    <div class="dialog-heading"><p class="eyebrow">${heading}</p><h2 id="dialog-title">${title}</h2></div>
    <input type="hidden" name="sourceInboxId" value="${escapeHTML(sourceInboxId)}">
    <label for="record-title">Judul</label><input id="record-title" name="title" maxlength="160" required value="${escapeHTML(value)}" autofocus>
    ${fields}
    <p class="dialog-error" role="alert"></p>
    <div class="dialog-actions"><button class="button" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">${saveLabel}</button></div>
  </form>`
}

function renderInboxForm(content) {
  return `<form id="record-form" class="dialog-form">
    <div class="dialog-heading"><p class="eyebrow">QUICK CAPTURE</p><h2 id="dialog-title">Simpan ke Inbox</h2></div>
    <label for="inbox-content">Teks atau URL</label><textarea id="inbox-content" name="content" rows="5" maxlength="4000" required autofocus placeholder="Simpan ide, pengingat, atau tautan…">${escapeHTML(content)}</textarea>
    <p class="dialog-error" role="alert"></p>
    <div class="dialog-actions"><button class="button" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">Simpan</button></div>
  </form>`
}

function renderRecordForm(kind, existing, sourceInboxId, content, isConversion, recordId) {
  if (kind === 'course') return renderCourseForm(existing)
  if (kind === 'task' || kind === 'agenda') {
    return renderTaskOrAgendaForm(kind, existing, sourceInboxId, content, isConversion, recordId)
  }
  return renderInboxForm(content)
}

function bindAgendaFormControls(dialog) {
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
}

function normalizeCourseForm(form) {
  return normalizeCourse({
    name: form.get('name'),
    code: form.get('code'),
    instructor: form.get('instructor'),
    period: form.get('period'),
    academicYear: form.get('academicYear'),
    startDate: form.get('startDate'),
    endDate: form.get('endDate'),
    color: form.get('color'),
  })
}

function normalizeTaskForm(form) {
  return normalizeTask({
    title: form.get('title'),
    description: form.get('description'),
    dueDate: form.get('dueDate'),
    status: form.get('status'),
    courseIds: form.getAll('courseIds'),
  })
}

function normalizeAgendaForm(form) {
  return normalizeAgenda({
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
}

async function saveCourseForm(form, existing) {
  const record = normalizeCourseForm(form)
  if (existing) {
    record.id = existing.id
    record.archivedAt = existing.archivedAt ?? null
  }
  const savedCourse = await saveRecord(state.database, 'courses', record)
  state.selectedCourseId = savedCourse.id
  state.page = 'courses'
}

async function saveTaskOrAgendaForm(kind, form, sourceId, existing) {
  const isTask = kind === 'task'
  const store = isTask ? 'tasks' : 'agendas'
  const record = isTask ? normalizeTaskForm(form) : normalizeAgendaForm(form)
  if (sourceId) {
    await saveConvertedRecord(state.database, store, record, sourceId)
    return
  }
  const savedRecord = existing
    ? { ...record, id: existing.id, sourceInboxId: existing.sourceInboxId }
    : record
  await saveRecord(state.database, store, savedRecord)
}

async function saveRecordForm(kind, form, sourceId, existing) {
  if (kind === 'course') return saveCourseForm(form, existing)
  if (kind === 'task' || kind === 'agenda') return saveTaskOrAgendaForm(kind, form, sourceId, existing)
  return saveRecord(state.database, 'inbox', normalizeInbox({ content: form.get('content') }))
}

async function submitRecordForm(event, dialog, kind, existing, refreshData) {
  event.preventDefault()
  const form = new FormData(event.currentTarget)
  const sourceId = String(form.get('sourceInboxId') ?? '')
  try {
    await saveRecordForm(kind, form, sourceId, existing)
    dialog.close()
    state.message = sourceId
      ? 'Item Inbox dikonversi dan tetap tertaut ke sumbernya.'
      : existing ? 'Perubahan disimpan di perangkat ini.' : 'Tersimpan di perangkat ini.'
    await refreshData()
  } catch (error) {
    dialog.querySelector('.dialog-error').textContent = error.message || 'Gagal menyimpan. Coba lagi.'
  }
}

function openDialog(kind, sourceInboxId = '', recordId = '', refreshData) {
  const dialog = document.querySelector('#record-dialog')
  const source = state.inbox.find((item) => item.id === sourceInboxId)
  const content = source?.content ?? ''
  const isConversion = Boolean(sourceInboxId)
  const existing = existingRecord(kind, recordId)
  dialog.innerHTML = renderRecordForm(kind, existing, sourceInboxId, content, isConversion, recordId)
  dialog.showModal()
  dialog.querySelector('input:not([type="hidden"]), textarea')?.focus()
  if (kind === 'agenda') bindAgendaFormControls(dialog)
  dialog.querySelector('#record-form').addEventListener('submit', (event) => {
    void submitRecordForm(event, dialog, kind, existing, refreshData)
  })
}

export function createDialogController(refreshData) {
  return {
    openDialog: (kind, sourceInboxId = '', recordId = '') => openDialog(kind, sourceInboxId, recordId, refreshData),
    openOccurrenceDialog: (seriesId, originalDate) => openOccurrenceDialog(seriesId, originalDate, refreshData),
  }
}
