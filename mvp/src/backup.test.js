import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { createBackup, parseBackup } from './backup.js'
import { normalizeAgenda, normalizeOccurrenceException } from './domain.js'

const emptyPayload = { tasks: [], agendas: [], inbox: [], courses: [] }

function recurringAgenda(exceptions) {
  return {
    ...normalizeAgenda({
      title: 'Kuliah mingguan',
      startsAt: '2026-11-02T08:00',
      endsAt: '2026-11-02T10:00',
      recurrence: 'weekly',
      repeatUntil: '2026-11-30',
      reminders: [30],
    }),
    id: 'agenda-weekly',
    exceptions,
  }
}

async function encodeBackupPayload(payload) {
  const checksum = [...new Uint8Array(await webcrypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(payload)),
  ))].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return JSON.stringify({ format: 'ae-chrono-log-mvp', version: 1, checksum, payload })
}

test('backup round-trips the four local stores with a verifiable checksum', async () => {
  const payload = {
    tasks: [{ id: 'task-1', title: 'Tugas uji', description: 'Deskripsi', dueDate: '2026-11-10', status: 'Belum dikerjakan', courseIds: ['course-1'] }],
    agendas: [{ id: 'agenda-1', title: 'Agenda uji', allDay: true, date: '2026-11-10', startsAt: null, endsAt: null, recurrence: null, courseId: '', category: 'Pribadi', categoryColor: '#bd5b43', location: '', onlineUrl: '', reminders: [1440] }],
    inbox: [{ id: 'inbox-1', content: 'Catatan uji', url: '', status: 'active' }],
    courses: [{ id: 'course-1', name: 'Mata kuliah uji', code: '', instructor: '', academicYear: '', period: '', startDate: '', endDate: '', color: '' }],
  }
  const backup = await createBackup(payload, webcrypto)
  const restored = await parseBackup(JSON.stringify(backup), webcrypto)

  assert.deepEqual(restored, payload)
})

test('backup validates and normalizes agenda occurrence exceptions', async () => {
  const exception = normalizeOccurrenceException({
    moved: true,
    date: '2026-11-04',
    startsAt: '2026-11-04T13:00',
    endsAt: '2026-11-04T15:00',
    onlineUrl: 'https://meet.example.com/room',
    materialUrl: 'https://example.com/slides',
    reminders: [30],
  })
  const payload = { ...emptyPayload, agendas: [recurringAgenda({ '2026-11-02': exception })] }
  const backup = await createBackup(payload, webcrypto)
  const restored = await parseBackup(JSON.stringify(backup), webcrypto)
  assert.deepEqual(restored.agendas[0].exceptions['2026-11-02'], exception)
})

test('backup import rejects unsafe exception URLs and invalid exception fields', async () => {
  for (const exception of [
    { status: 'updated', onlineUrl: 'javascript:alert(1)' },
    { status: 'updated', materialUrl: 'javascript:alert(1)' },
    { status: 'updated', reminders: '30' },
    { status: 'updated', categoryColor: 'not-a-color' },
    { status: 'moved', date: '2026-11-04', startsAt: '2026-11-04T15:00', endsAt: '2026-11-04T14:00' },
  ]) {
    const payload = { ...emptyPayload, agendas: [recurringAgenda({ '2026-11-02': exception })] }
    await assert.rejects(parseBackup(await encodeBackupPayload(payload)), /URL HTTP atau HTTPS|Daftar pengingat|Warna agenda|Waktu selesai/)
  }
})

test('backup import rejects exceptions outside their weekly recurrence', async () => {
  const payload = { ...emptyPayload, agendas: [recurringAgenda({ '2026-11-03': { status: 'cancelled' } })] }
  await assert.rejects(parseBackup(await encodeBackupPayload(payload)), /Tanggal perubahan pertemuan/)
})

test('backup rejects modified data and malformed record collections', async () => {
  const backup = await createBackup(emptyPayload, webcrypto)
  backup.payload.tasks.push({ id: 'changed', title: 'Tugas berubah', description: '', dueDate: '', courseIds: [] })
  await assert.rejects(parseBackup(JSON.stringify(backup), webcrypto), /berubah atau rusak/)
  await assert.rejects(createBackup({ ...emptyPayload, tasks: [{ title: 'Tanpa ID' }] }, webcrypto), /tanpa ID/)
  await assert.rejects(createBackup({ ...emptyPayload, tasks: [{ id: 'bad-task', title: 'Tugas', status: 'invalid' }] }, webcrypto), /Status tugas tidak valid/)
})

test('backup rejects unsupported versions and files above the size limit', async () => {
  await assert.rejects(parseBackup(JSON.stringify({ format: 'ae-chrono-log-mvp', version: 99 }), webcrypto), /tidak didukung/)
  await assert.rejects(parseBackup(' '.repeat(25 * 1024 * 1024 + 1), webcrypto), /25 MB/)
})
