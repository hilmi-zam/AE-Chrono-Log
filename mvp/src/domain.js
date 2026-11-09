export const TASK_STATUSES = [
  'Belum dikerjakan',
  'Sedang dikerjakan',
  'Revisi',
  'Selesai',
]

export const COURSE_COLORS = ['#bd5b43', '#567362', '#537091', '#8a6d9d', '#b28a38']
export const AGENDA_COLORS = ['#bd5b43', '#567362', '#537091', '#8a6d9d', '#b28a38', '#8b6651', '#6f7d8c']
export const REMINDER_PRESETS = [5, 15, 30, 60, 1440, 4320]

function normalizeReminders(input, allDay) {
  if (input !== undefined && !Array.isArray(input)) throw new Error('Daftar pengingat tidak valid.')
  const reminders = input === undefined ? [allDay ? 1440 : 30] : input.map(Number)
  if (reminders.some((minutes) => !Number.isInteger(minutes) || minutes < 1 || minutes > 525600)) {
    throw new Error('Pengingat harus berupa durasi 1 menit hingga 365 hari.')
  }
  return [...new Set(reminders)].sort((left, right) => right - left)
}

function normalizeHttpUrl(value, label) {
  const url = String(value ?? '').trim()
  if (!url) return ''
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw new Error()
  } catch {
    throw new Error(`${label} harus berupa URL HTTP atau HTTPS yang valid.`)
  }
  return url
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidDateKey(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export function normalizeTask(input) {
  const title = String(input.title ?? '').trim()
  if (!title) throw new Error('Judul tugas wajib diisi.')

  const status = input.status || TASK_STATUSES[0]
  if (!TASK_STATUSES.includes(status)) throw new Error('Status tugas tidak valid.')

  const dueDate = String(input.dueDate ?? '')
  if (dueDate && !isValidDateKey(dueDate)) {
    throw new Error('Tanggal deadline tidak valid.')
  }

  return {
    title,
    description: String(input.description ?? '').trim(),
    dueDate,
    status,
    courseIds: Array.isArray(input.courseIds)
      ? [...new Set(input.courseIds.filter((id) => typeof id === 'string' && id.trim()))]
      : [],
  }
}

export function normalizeCourse(input) {
  const name = String(input.name ?? '').trim()
  if (!name) throw new Error('Nama mata kuliah wajib diisi.')

  const startDate = String(input.startDate ?? '')
  const endDate = String(input.endDate ?? '')
  if (startDate && !isValidDateKey(startDate)) throw new Error('Tanggal mulai periode tidak valid.')
  if (endDate && !isValidDateKey(endDate)) throw new Error('Tanggal akhir periode tidak valid.')
  if (startDate && endDate && endDate < startDate) {
    throw new Error('Tanggal akhir periode harus sama atau setelah tanggal mulai.')
  }

  const color = String(input.color ?? '')
  if (color && !COURSE_COLORS.includes(color)) throw new Error('Warna mata kuliah tidak valid.')

  return {
    name,
    code: String(input.code ?? '').trim(),
    instructor: String(input.instructor ?? '').trim(),
    academicYear: String(input.academicYear ?? '').trim(),
    period: String(input.period ?? '').trim(),
    startDate,
    endDate,
    color,
  }
}

export function normalizeAgenda(input) {
  const title = String(input.title ?? '').trim()
  if (!title) throw new Error('Judul agenda wajib diisi.')
  const category = String(input.category ?? 'Pribadi').trim() || 'Pribadi'
  if (category.length > 80) throw new Error('Kategori agenda maksimal 80 karakter.')
  const categoryColor = String(input.categoryColor ?? AGENDA_COLORS[0])
  if (!/^#[\da-f]{6}$/i.test(categoryColor)) throw new Error('Warna agenda tidak valid.')
  const location = String(input.location ?? '').trim()
  if (location.length > 200) throw new Error('Lokasi agenda maksimal 200 karakter.')
  const onlineUrl = normalizeHttpUrl(input.onlineUrl, 'Tautan online')
  const reminders = normalizeReminders(input.reminders, Boolean(input.allDay))

  const recurrence = input.recurrence === 'weekly'
    ? { frequency: 'weekly', until: String(input.repeatUntil ?? '') }
    : null
  if (recurrence && !isValidDateKey(recurrence.until)) {
    throw new Error('Tanggal akhir pengulangan mingguan wajib diisi.')
  }

  if (input.allDay) {
    const date = String(input.date ?? '')
    if (!isValidDateKey(date)) throw new Error('Tanggal agenda wajib diisi.')
    if (recurrence && recurrence.until < date) throw new Error('Tanggal akhir pengulangan harus setelah tanggal mulai.')
    return { title, allDay: true, date, startsAt: null, endsAt: null, recurrence, courseId: String(input.courseId ?? ''), category, categoryColor, location, onlineUrl, reminders }
  }

  const start = new Date(input.startsAt)
  const end = new Date(input.endsAt)
  if (!input.startsAt || Number.isNaN(start.valueOf())) throw new Error('Waktu mulai tidak valid.')
  if (!input.endsAt || Number.isNaN(end.valueOf())) throw new Error('Waktu selesai tidak valid.')
  if (end <= start) throw new Error('Waktu selesai harus setelah waktu mulai.')
  const date = localDateKey(start)
  if (recurrence && recurrence.until < date) throw new Error('Tanggal akhir pengulangan harus setelah tanggal mulai.')

  return {
    title,
    allDay: false,
    date,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    recurrence,
    courseId: String(input.courseId ?? ''),
    category,
    categoryColor,
    location,
    onlineUrl,
    reminders,
  }
}

export function normalizeOccurrenceException(input) {
  const title = String(input.title ?? '').trim()
  const topic = String(input.topic ?? '').trim()
  const summary = String(input.summary ?? '').trim()
  const materialUrl = String(input.materialUrl ?? '').trim()
  const cancelled = Boolean(input.cancelled)
  const moved = Boolean(input.moved)
  const onlineUrl = normalizeHttpUrl(input.onlineUrl, 'Tautan online')
  normalizeHttpUrl(materialUrl, 'Tautan materi')
  const category = String(input.category ?? '').trim()
  const categoryColor = String(input.categoryColor ?? '')
  if (category.length > 80) throw new Error('Kategori agenda maksimal 80 karakter.')
  if (categoryColor && !/^#[\da-f]{6}$/i.test(categoryColor)) throw new Error('Warna agenda tidak valid.')
  const location = String(input.location ?? '').trim()
  if (location.length > 200) throw new Error('Lokasi agenda maksimal 200 karakter.')

  const exception = {
    status: cancelled ? 'cancelled' : moved ? 'moved' : 'updated',
    title,
    topic,
    summary,
    materialUrl,
  }
  if (input.onlineUrl !== undefined) exception.onlineUrl = onlineUrl
  if (input.location !== undefined) exception.location = location
  if (input.category !== undefined) exception.category = category
  if (input.categoryColor !== undefined) exception.categoryColor = categoryColor
  if (Array.isArray(input.reminders)) exception.reminders = cancelled ? [] : normalizeReminders(input.reminders, Boolean(input.allDay))
  if (moved) {
    const date = String(input.date ?? '')
    if (!isValidDateKey(date)) throw new Error('Tanggal pertemuan tidak valid.')
    exception.date = date
    exception.allDay = Boolean(input.allDay)
    if (exception.allDay) {
      exception.startsAt = null
      exception.endsAt = null
    } else {
      const start = new Date(input.startsAt)
      const end = new Date(input.endsAt)
      if (!input.startsAt || Number.isNaN(start.valueOf())) throw new Error('Waktu mulai tidak valid.')
      if (!input.endsAt || Number.isNaN(end.valueOf())) throw new Error('Waktu selesai tidak valid.')
      if (end <= start) throw new Error('Waktu selesai harus setelah waktu mulai.')
      exception.date = localDateKey(start)
      exception.startsAt = start.toISOString()
      exception.endsAt = end.toISOString()
    }
  }
  return exception
}

function dateFromKey(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfWeekdayOnOrAfter(value, weekday) {
  const date = dateFromKey(value)
  const offset = (weekday - date.getDay() + 7) % 7
  date.setDate(date.getDate() + offset)
  return localDateKey(date)
}

export function expandAgendaOccurrences(agendas, fromDate, throughDate) {
  const results = []
  for (const agenda of agendas) {
    if (agenda.deletedAt) continue
    if (agenda.recurrence?.frequency !== 'weekly') {
      if (agenda.date >= fromDate && agenda.date <= throughDate) {
        results.push({ ...agenda, occurrenceId: `${agenda.id}:${agenda.date}`, originalDate: agenda.date, seriesId: agenda.id })
      }
      continue
    }

    const baseDate = agenda.date
    const until = agenda.recurrence.until
    const startDate = startOfWeekdayOnOrAfter(fromDate > baseDate ? fromDate : baseDate, dateFromKey(baseDate).getDay())
    let occurrenceDate = startDate
    const emitted = new Set()
    while (occurrenceDate <= throughDate && occurrenceDate <= until) {
      const exception = agenda.exceptions?.[occurrenceDate]
      emitted.add(occurrenceDate)
      if (exception?.date && exception.date !== occurrenceDate) {
        if (exception.date >= fromDate && exception.date <= throughDate) {
          results.push({ ...agenda, ...exception, date: exception.date, occurrenceId: `${agenda.id}:${occurrenceDate}`, originalDate: occurrenceDate, seriesId: agenda.id, exception })
        }
      } else {
        const occurrenceStart = agenda.allDay ? null : exception?.startsAt ?? occurrenceDateTime(occurrenceDate, agenda.startsAt)
        const duration = agenda.allDay ? 0 : new Date(agenda.endsAt).valueOf() - new Date(agenda.startsAt).valueOf()
        const occurrenceEnd = agenda.allDay ? null : exception?.endsAt ?? new Date(new Date(occurrenceStart).valueOf() + duration).toISOString()
        results.push({
          ...agenda,
          ...exception,
          title: exception?.title || agenda.title,
          date: occurrenceDate,
          startsAt: occurrenceStart,
          endsAt: occurrenceEnd,
          occurrenceId: `${agenda.id}:${occurrenceDate}`,
          originalDate: occurrenceDate,
          seriesId: agenda.id,
          exception: exception ?? null,
        })
      }
      const nextDate = dateFromKey(occurrenceDate)
      nextDate.setDate(nextDate.getDate() + 7)
      occurrenceDate = localDateKey(nextDate)
    }
    for (const [originalDate, exception] of Object.entries(agenda.exceptions ?? {})) {
      if (emitted.has(originalDate) || !exception.date || exception.date < fromDate || exception.date > throughDate) continue
      results.push({ ...agenda, ...exception, title: exception.title || agenda.title, date: exception.date, occurrenceId: `${agenda.id}:${originalDate}`, originalDate, seriesId: agenda.id, exception })
    }
  }
  return results.sort((left, right) => byAgendaDate(left, right))
}

function occurrenceDateTime(date, originalDateTime) {
  const original = new Date(originalDateTime)
  const occurrence = dateFromKey(date)
  occurrence.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), original.getMilliseconds())
  return occurrence.toISOString()
}

function byAgendaDate(left, right) {
  return (left.startsAt ?? `${left.date}T00:00:00`).localeCompare(right.startsAt ?? `${right.date}T00:00:00`)
    || left.title.localeCompare(right.title, 'id')
}

export function normalizeInbox(input) {
  const content = String(input.content ?? '').trim()
  if (!content) throw new Error('Tulis sesuatu untuk disimpan ke Inbox.')

  let url = ''
  if (/^https?:\/\//i.test(content)) {
    try {
      const parsed = new URL(content)
      if (!parsed.hostname) throw new Error()
      url = parsed.href
    } catch {
      throw new Error('URL tidak valid.')
    }
  }

  return { content, url, status: 'active' }
}

export function isOverdue(task, today = localDateKey()) {
  return Boolean(task.dueDate && task.dueDate < today && task.status !== 'Selesai')
}
