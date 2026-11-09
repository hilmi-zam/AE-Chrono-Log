import { normalizeAgenda, normalizeCourse, normalizeInbox, normalizeOccurrenceException, normalizeTask } from './domain.js'

export const BACKUP_STORES = ['tasks', 'agendas', 'inbox', 'courses']
const BACKUP_FORMAT = 'ae-chrono-log-mvp'
const BACKUP_VERSION = 1
const MAX_BACKUP_SIZE = 25 * 1024 * 1024
const EXCEPTION_STATUSES = ['updated', 'moved', 'cancelled']
const EXCEPTION_STRING_FIELDS = ['title', 'topic', 'summary', 'materialUrl', 'onlineUrl', 'location', 'category', 'categoryColor']

function isValidDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
}

function normalizeAgendaExceptions(record, agenda) {
  if (record.exceptions === undefined) return undefined
  if (!record.exceptions || typeof record.exceptions !== 'object' || Array.isArray(record.exceptions)) {
    throw new Error('Daftar perubahan pertemuan pada backup tidak valid.')
  }
  if (agenda.recurrence?.frequency !== 'weekly') {
    throw new Error('Perubahan pertemuan hanya dapat dimiliki agenda mingguan.')
  }

  const exceptions = {}
  for (const [originalDate, input] of Object.entries(record.exceptions)) {
    if (!isValidDateKey(originalDate)
      || originalDate < agenda.date
      || originalDate > agenda.recurrence.until
      || new Date(`${originalDate}T00:00:00.000Z`).getUTCDay() !== new Date(`${agenda.date}T00:00:00.000Z`).getUTCDay()) {
      throw new Error('Tanggal perubahan pertemuan tidak sesuai jadwal mingguan.')
    }
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Data perubahan pertemuan pada backup tidak valid.')
    }
    for (const field of EXCEPTION_STRING_FIELDS) {
      if (input[field] !== undefined && typeof input[field] !== 'string') {
        throw new Error(`Kolom ${field} pada perubahan pertemuan tidak valid.`)
      }
    }
    if (input.status !== undefined && !EXCEPTION_STATUSES.includes(input.status)) {
      throw new Error('Status perubahan pertemuan pada backup tidak valid.')
    }
    if (input.cancelled !== undefined && typeof input.cancelled !== 'boolean') {
      throw new Error('Status pembatalan pertemuan pada backup tidak valid.')
    }
    if (input.moved !== undefined && typeof input.moved !== 'boolean') {
      throw new Error('Status perubahan tanggal pertemuan pada backup tidak valid.')
    }
    if (input.allDay !== undefined && typeof input.allDay !== 'boolean') {
      throw new Error('Jenis tanggal pertemuan pada backup tidak valid.')
    }
    if (input.reminders !== undefined && !Array.isArray(input.reminders)) {
      throw new Error('Daftar pengingat pertemuan pada backup tidak valid.')
    }
    for (const field of ['date', 'startsAt', 'endsAt']) {
      if (input[field] !== undefined && input[field] !== null && typeof input[field] !== 'string') {
        throw new Error(`Kolom ${field} pada perubahan pertemuan tidak valid.`)
      }
    }

    const status = input.status ?? 'updated'
    if (status !== 'moved'
      && status !== 'cancelled'
      && input.moved !== true
      && (input.date !== undefined || input.startsAt !== undefined || input.endsAt !== undefined)) {
      throw new Error('Tanggal atau waktu perubahan pertemuan tidak konsisten dengan statusnya.')
    }
    const moved = status === 'moved' || input.moved === true
    exceptions[originalDate] = normalizeOccurrenceException({
      ...input,
      cancelled: status === 'cancelled' || input.cancelled === true,
      moved: moved || (status === 'cancelled' && (input.date !== undefined || input.startsAt !== undefined || input.endsAt !== undefined)),
    })
  }
  return exceptions
}

function serializedPayload(payload) {
  return JSON.stringify(payload)
}

async function checksum(payload, cryptoApi) {
  if (!cryptoApi?.subtle) throw new Error('Browser ini tidak mendukung pemeriksaan integritas backup.')
  const bytes = new TextEncoder().encode(serializedPayload(payload))
  const digest = await cryptoApi.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function createBackup(payload, cryptoApi = globalThis.crypto) {
  const validPayload = validatePayload(payload)
  const backup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    checksum: await checksum(validPayload, cryptoApi),
    payload: validPayload,
  }
  if (JSON.stringify(backup).length > MAX_BACKUP_SIZE) {
    throw new Error('Ukuran file backup melebihi batas 25 MB.')
  }
  return backup
}

export async function parseBackup(text, cryptoApi = globalThis.crypto) {
  if (typeof text !== 'string' || text.length > MAX_BACKUP_SIZE) {
    throw new Error('Ukuran file backup melebihi batas 25 MB.')
  }

  let backup
  try {
    backup = JSON.parse(text)
  } catch {
    throw new Error('File backup bukan JSON yang valid.')
  }

  if (!backup || backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) {
    throw new Error('Format atau versi file backup tidak didukung.')
  }
  const validPayload = validatePayload(backup.payload)
  if (!/^[\da-f]{64}$/i.test(backup.checksum ?? '')) {
    throw new Error('Checksum file backup tidak valid.')
  }
  const actualChecksum = await checksum(backup.payload, cryptoApi)
  if (actualChecksum !== backup.checksum.toLowerCase()) {
    throw new Error('Isi file backup berubah atau rusak; data tidak dipulihkan.')
  }
  return validPayload
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Isi backup tidak memiliki struktur yang valid.')
  }

  const normalizedPayload = {}
  for (const store of BACKUP_STORES) {
    const records = payload[store]
    if (!Array.isArray(records)) throw new Error(`Daftar ${store} pada backup tidak valid.`)
    const ids = new Set()
    normalizedPayload[store] = []
    for (const record of records) {
      if (!record || typeof record !== 'object' || Array.isArray(record) || typeof record.id !== 'string' || !record.id.trim()) {
        throw new Error(`Ada data ${store} tanpa ID yang valid.`)
      }
      if (ids.has(record.id)) throw new Error(`Ada ID ${store} duplikat pada backup.`)
      ids.add(record.id)
      const normalized = store === 'tasks'
        ? normalizeTask(record)
        : store === 'agendas'
          ? (() => {
              const agenda = normalizeAgenda({
                ...record,
                recurrence: record.recurrence?.frequency ?? '',
                repeatUntil: record.recurrence?.until ?? '',
              })
              const exceptions = normalizeAgendaExceptions(record, agenda)
              return exceptions === undefined ? agenda : { ...agenda, exceptions }
            })()
          : store === 'inbox'
            ? normalizeInbox(record)
            : normalizeCourse(record)
      normalizedPayload[store].push({ ...record, ...normalized })
    }
  }
  return normalizedPayload
}
