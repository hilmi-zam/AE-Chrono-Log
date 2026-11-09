import test from 'node:test'
import assert from 'node:assert/strict'
import { expandAgendaOccurrences, isOverdue, localDateKey, normalizeAgenda, normalizeCourse, normalizeInbox, normalizeOccurrenceException, normalizeTask } from './domain.js'

test('task requires a title and keeps status within the defined set', () => {
  assert.throws(() => normalizeTask({ title: '  ' }), /Judul tugas wajib/)
  assert.throws(() => normalizeTask({ title: 'Baca', status: 'Prioritas tinggi' }), /Status tugas tidak valid/)
  assert.throws(() => normalizeTask({ title: 'Baca', dueDate: '2026-02-31' }), /Tanggal deadline tidak valid/)
  assert.deepEqual(normalizeTask({ title: '  Baca materi  ', dueDate: '2026-11-08' }), {
    title: 'Baca materi',
    description: '',
    dueDate: '2026-11-08',
    status: 'Belum dikerjakan',
    courseIds: [],
  })
})

test('agenda validates timed ranges and allows all-day dates', () => {
  assert.throws(() => normalizeAgenda({
    title: 'Kelas',
    startsAt: '2026-11-07T10:00',
    endsAt: '2026-11-07T09:00',
  }), /Waktu selesai harus setelah/)
  assert.deepEqual(normalizeAgenda({ title: 'Libur', allDay: true, date: '2026-11-10' }), {
    title: 'Libur',
    allDay: true,
    date: '2026-11-10',
    startsAt: null,
    endsAt: null,
    recurrence: null,
    courseId: '',
    category: 'Pribadi',
    categoryColor: '#bd5b43',
    location: '',
    onlineUrl: '',
    reminders: [1440],
  })
  assert.deepEqual(normalizeAgenda({
    title: 'Kelas',
    startsAt: '2026-11-07T10:00',
    endsAt: '2026-11-07T11:00',
  }).reminders, [30])
})

test('agenda validates category, color, location links, and reminder offsets', () => {
  const agenda = normalizeAgenda({
    title: 'Diskusi',
    startsAt: '2026-11-07T10:00',
    endsAt: '2026-11-07T11:00',
    category: 'Proyek',
    categoryColor: '#123abc',
    location: 'Ruang 4',
    onlineUrl: 'https://meet.example.com/room',
    reminders: [30, 1440, 30, 90],
  })
  assert.equal(agenda.category, 'Proyek')
  assert.equal(agenda.categoryColor, '#123abc')
  assert.equal(agenda.location, 'Ruang 4')
  assert.equal(agenda.onlineUrl, 'https://meet.example.com/room')
  assert.deepEqual(agenda.reminders, [1440, 90, 30])
  assert.throws(() => normalizeAgenda({
    title: 'Diskusi',
    startsAt: '2026-11-07T10:00',
    endsAt: '2026-11-07T11:00',
    onlineUrl: 'javascript:alert(1)',
  }), /URL HTTP atau HTTPS/)
  assert.throws(() => normalizeAgenda({
    title: 'Diskusi',
    startsAt: '2026-11-07T10:00',
    endsAt: '2026-11-07T11:00',
    categoryColor: 'red',
  }), /Warna agenda tidak valid/)
  assert.throws(() => normalizeAgenda({
    title: 'Diskusi',
    startsAt: '2026-11-07T10:00',
    endsAt: '2026-11-07T11:00',
    reminders: [0],
  }), /durasi 1 menit hingga 365 hari/)
})

test('weekly agenda expands within its date range and keeps occurrence changes isolated', () => {
  const agenda = normalizeAgenda({
    title: 'Kuliah',
    startsAt: '2026-11-02T08:00',
    endsAt: '2026-11-02T10:00',
    recurrence: 'weekly',
    repeatUntil: '2026-11-30',
  })
  const exception = normalizeOccurrenceException({
    title: 'Kuliah online',
    moved: true,
    date: '2026-11-04',
    startsAt: '2026-11-04T13:00',
    endsAt: '2026-11-04T15:00',
    topic: 'Pengujian',
    summary: 'Pertemuan daring',
    materialUrl: 'https://example.com/slides',
  })
  agenda.id = 'course-series'
  agenda.exceptions = { '2026-11-09': { status: 'cancelled' }, '2026-11-16': exception }

  const occurrences = expandAgendaOccurrences([agenda], '2026-11-02', '2026-11-20')
  assert.deepEqual(occurrences.map((item) => [item.originalDate, item.date, item.status]), [
    ['2026-11-02', '2026-11-02', undefined],
    ['2026-11-16', '2026-11-04', 'moved'],
    ['2026-11-09', '2026-11-09', 'cancelled'],
  ])
  assert.equal(localDateKey(new Date(occurrences[0].startsAt)), '2026-11-02')
  assert.equal(occurrences[1].topic, 'Pengujian')
  assert.equal(agenda.date, '2026-11-02')
  assert.equal(localDateKey(new Date(agenda.startsAt)), '2026-11-02')
  assert.deepEqual(occurrences[0].reminders, [30])
  assert.deepEqual(occurrences[1].reminders, [30])
  const updatedTime = normalizeOccurrenceException({
    moved: true,
    date: '2026-11-02',
    startsAt: '2026-11-02T09:00',
    endsAt: '2026-11-02T11:00',
  })

  const sameDayOverride = expandAgendaOccurrences([{
    ...agenda,
    exceptions: { '2026-11-02': updatedTime },
  }], '2026-11-02', '2026-11-02')[0]
  assert.equal(new Date(sameDayOverride.startsAt).getHours(), 9)
  assert.throws(() => normalizeAgenda({
    title: 'Kuliah',
    startsAt: '2026-11-02T08:00',
    endsAt: '2026-11-02T10:00',
    recurrence: 'weekly',
  }), /Tanggal akhir pengulangan mingguan wajib/)
})

test('reminder overrides affect only one occurrence and canceled occurrences have none', () => {
  const series = normalizeAgenda({
    title: 'Kuliah',
    startsAt: '2026-11-02T08:00',
    endsAt: '2026-11-02T10:00',
    recurrence: 'weekly',
    repeatUntil: '2026-11-30',
    reminders: [30, 1440],
  })
  series.id = 'series'
  series.exceptions = {
    '2026-11-09': normalizeOccurrenceException({
      reminders: [15],
      moved: true,
      date: '2026-11-11',
      startsAt: '2026-11-11T13:00',
      endsAt: '2026-11-11T15:00',
    }),
    '2026-11-16': normalizeOccurrenceException({ reminders: [30], cancelled: true }),
  }
  const occurrences = expandAgendaOccurrences([series], '2026-11-02', '2026-11-16')
  assert.deepEqual(occurrences.map((item) => item.reminders), [[1440, 30], [15], []])
  assert.equal(occurrences[1].status, 'moved')
  assert.equal(occurrences[1].date, '2026-11-11')
  assert.equal(new Date(occurrences[1].startsAt).getHours(), 13)
  assert.equal(occurrences[2].status, 'cancelled')
})

test('occurrence exceptions validate moved time and material links', () => {
  assert.throws(() => normalizeOccurrenceException({
    moved: true,
    date: '2026-11-04',
    startsAt: '2026-11-04T15:00',
    endsAt: '2026-11-04T14:00',
  }), /Waktu selesai harus setelah/)
  assert.throws(() => normalizeOccurrenceException({ materialUrl: 'javascript:alert(1)' }), /URL HTTP atau HTTPS/)
  assert.equal(normalizeOccurrenceException({ cancelled: true }).status, 'cancelled')
})

test('course requires a name and validates an optional academic period', () => {
  assert.throws(() => normalizeCourse({ name: '  ' }), /Nama mata kuliah wajib/)
  assert.throws(() => normalizeCourse({ name: 'Basis Data', startDate: '2026-09-31' }), /Tanggal mulai periode tidak valid/)
  assert.throws(() => normalizeCourse({ name: 'Basis Data', startDate: '2026-11-10', endDate: '2026-11-09' }), /Tanggal akhir periode harus/)
  assert.deepEqual(normalizeCourse({
    name: '  Basis Data ',
    code: ' IF201 ',
    period: 'Ganjil',
    academicYear: '2026/2027',
    startDate: '2026-08-01',
    color: '#567362',
  }), {
    name: 'Basis Data',
    code: 'IF201',
    instructor: '',
    academicYear: '2026/2027',
    period: 'Ganjil',
    startDate: '2026-08-01',
    endDate: '',
    color: '#567362',
  })
})

test('Inbox accepts text and valid HTTP URLs only', () => {
  assert.equal(normalizeInbox({ content: '  Ingat beli buku  ' }).content, 'Ingat beli buku')
  assert.equal(normalizeInbox({ content: 'https://example.com/path' }).url, 'https://example.com/path')
  assert.throws(() => normalizeInbox({ content: 'https://%' }), /URL tidak valid/)
})

test('overdue status is derived without changing task status', () => {
  const task = { dueDate: '2026-11-06', status: 'Sedang dikerjakan' }
  assert.equal(isOverdue(task, '2026-11-07'), true)
  assert.equal(task.status, 'Sedang dikerjakan')
  assert.equal(isOverdue({ dueDate: '2026-11-07', status: 'Belum dikerjakan' }, '2026-11-07'), false)
  assert.equal(isOverdue({ dueDate: '2026-11-06', status: 'Selesai' }, '2026-11-07'), false)
})

test('local date keys stay in ISO order regardless of browser locale', () => {
  assert.equal(localDateKey(new Date(2026, 10, 7)), '2026-11-07')
})
