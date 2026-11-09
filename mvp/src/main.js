import './style.css'
import { listRecords, listRecoverySnapshots, openDatabase, readBackupRecords, restoreBackupRecords, saveRecord, softDeleteRecord } from './db.js'
import { localDateKey } from './domain.js'
import { createBackup, parseBackup } from './backup.js'
import { state, app, SERVICE_WORKER_CACHE_VERSION } from './state.js'
import { createDialogController } from './dialogs.js'
import { dateOffset, escapeHTML, today } from './utils.js'
import { render } from './view.js'

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


const dialogs = createDialogController(refreshData)

function focusMoreSheetTrigger() {
  requestAnimationFrame(() => {
    document.querySelector('[data-action="toggle-more"]')?.focus()
  })
}

function handleMoreSheetAction(action) {
  if (!['toggle-more', 'close-more'].includes(action)) return false
  state.isMoreOpen = action === 'toggle-more' ? !state.isMoreOpen : false
  render()
  if (state.isMoreOpen) {
    requestAnimationFrame(() => {
      document.querySelector('.more-sheet [data-page], .more-sheet-close')?.focus()
    })
  } else {
    focusMoreSheetTrigger()
  }
  return true
}

function handleDialogAction(action, id) {
  switch (action) {
    case 'new-task':
    case 'new-course-task':
    case 'task-edit':
      dialogs.openDialog('task', '', ['new-course-task', 'task-edit'].includes(action) ? id : '')
      return true
    case 'new-agenda':
    case 'new-course-agenda':
    case 'agenda-edit':
      dialogs.openDialog('agenda', '', ['new-course-agenda', 'agenda-edit'].includes(action) ? id : '')
      return true
    case 'new-inbox':
      dialogs.openDialog('inbox')
      return true
    case 'new-course':
      dialogs.openDialog('course')
      return true
    case 'course-edit':
      dialogs.openDialog('course', '', id)
      return true
    case 'convert-task':
      dialogs.openDialog('task', id)
      return true
    case 'convert-agenda':
      dialogs.openDialog('agenda', id)
      return true
    case 'close-dialog':
      document.querySelector('#record-dialog').close()
      return true
    default:
      return false
  }
}

function handleViewAction(action, button) {
  if (action === 'task-filter') state.taskFilter = button.dataset.filter
  else if (action === 'inbox-view') state.inboxView = button.dataset.view
  else return false
  render()
  return true
}

function stepCalendar(direction) {
  if (state.calendarView === 'day') {
    state.calendarDate = dateOffset(state.calendarDate, direction)
  } else if (state.calendarView === 'week') {
    state.calendarDate = dateOffset(state.calendarDate, direction * 7)
  } else if (state.calendarView === 'month') {
    const [year, month] = state.calendarDate.slice(0, 7).split('-').map(Number)
    state.calendarDate = localDateKey(new Date(year, month - 1 + direction, 1))
  }
}

function handleCalendarAction(action, button, id) {
  if (action === 'occurrence-edit') dialogs.openOccurrenceDialog(id, button.dataset.date)
  else if (action === 'calendar-view') state.calendarView = button.dataset.view
  else if (action === 'calendar-today') state.calendarDate = today()
  else if (action === 'calendar-step') stepCalendar(Number(button.dataset.direction))
  else if (action === 'calendar-select-date') {
    state.calendarDate = button.dataset.date
    state.calendarView = 'day'
  } else if (action === 'calendar-task') state.page = 'tasks'
  else return false
  if (action !== 'occurrence-edit') render()
  return true
}

async function archiveCourse(action, id) {
  const course = state.courses.find((item) => item.id === id)
  if (!course) throw new Error('Mata kuliah tidak ditemukan. Muat ulang halaman.')
  await saveRecord(state.database, 'courses', {
    ...course,
    archivedAt: action === 'course-archive' ? new Date().toISOString() : null,
  })
  state.message = action === 'course-archive'
    ? 'Mata kuliah diarsipkan. Riwayat dan relasinya tetap tersimpan.'
    : 'Mata kuliah dipulihkan.'
  state.selectedCourseId = ''
  state.showArchivedCourses = false
  await refreshData()
}

async function handleCourseAction(action, id) {
  if (action === 'course-open') state.selectedCourseId = id
  else if (action === 'courses-back') state.selectedCourseId = ''
  else if (action === 'toggle-archived-courses') state.showArchivedCourses = !state.showArchivedCourses
  else if (action === 'course-archive' || action === 'course-restore') {
    await archiveCourse(action, id)
    return true
  } else return false
  render()
  return true
}

async function exportBackup() {
  const backup = await createBackup(await readBackupRecords(state.database))
  const file = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const download = document.createElement('a')
  download.href = URL.createObjectURL(file)
  download.download = `ae-chrono-log-backup-${today()}.json`
  download.click()
  window.setTimeout(() => URL.revokeObjectURL(download.href), 0)
  showMessage('Backup berhasil diekspor. Simpan file tersebut di tempat yang aman.')
}

async function restoreSnapshot(id) {
  const snapshot = state.recoverySnapshots.find((item) => item.id === id)
  if (!snapshot) throw new Error('Snapshot pemulihan tidak ditemukan. Muat ulang halaman.')
  if (!window.confirm('Ganti seluruh data saat ini dengan snapshot sebelum pemulihan ini? Kondisi sekarang akan disimpan sebagai snapshot baru.')) return
  await restoreBackupRecords(state.database, snapshot.payload)
  state.message = 'Snapshot dipulihkan. Kondisi sebelumnya tetap tersedia di daftar snapshot.'
  await refreshData()
}

async function handleBackupAction(action, id) {
  if (action === 'export-backup') await exportBackup()
  else if (action === 'import-backup') document.querySelector('#backup-file').click()
  else if (action === 'restore-snapshot') await restoreSnapshot(id)
  else return false
  return true
}

async function deleteRecord(store, id) {
  if (!window.confirm('Hapus item ini? Item akan disembunyikan dari daftar.')) return
  await softDeleteRecord(state.database, store, id)
  state.message = 'Item dihapus dari daftar pada perangkat ini.'
  await refreshData()
}

function navigateToPage(event, pageButton) {
  event.preventDefault()
  state.page = pageButton.dataset.page
  state.selectedCourseId = pageButton.dataset.courseId ?? ''
  state.isMoreOpen = false
  render()
}

async function handleClick(event) {
  const pageButton = event.target.closest('[data-page]')
  if (pageButton) {
    navigateToPage(event, pageButton)
    return
  }
  const button = event.target.closest('[data-action]')
  if (!button) return
  const { action, id, store } = button.dataset
  try {
    if (handleMoreSheetAction(action)) return
    if (handleDialogAction(action, id)) return
    if (handleViewAction(action, button)) return
    if (handleCalendarAction(action, button, id)) return
    if (await handleCourseAction(action, id)) return
    if (await handleBackupAction(action, id)) return
    if (action === 'delete') await deleteRecord(store, id)
  } catch (error) {
    showMessage(error.message || 'Operasi gagal. Coba lagi.')
  }
}

async function restoreFromBackupFile(target) {
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
}

function updateSearchFilters(target) {
  const searchFields = {
    'search-type': 'searchType',
    'search-from': 'searchFrom',
    'search-to': 'searchTo',
  }
  const stateField = searchFields[target.id]
  if (!stateField) return false
  state[stateField] = target.value
  render()
  return true
}

async function updateTaskStatus(target) {
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

async function handleChange(event) {
  const target = event.target
  if (target.id === 'backup-file') {
    if (target.files?.[0]) await restoreFromBackupFile(target)
    return
  }
  if (target.id === 'task-filter') {
    state.taskFilter = target.value
    render()
    return
  }
  if (updateSearchFilters(target)) return
  if (target.matches('[data-action="task-status"]')) await updateTaskStatus(target)
}

let searchTimer
function updateSearchState(query) {
  state.query = query
  if (query.trim() && state.page !== 'search') {
    state.searchReturnPage = state.page
    state.page = 'search'
  } else if (!query.trim() && state.page === 'search') {
    state.page = state.searchReturnPage
  }
}

function renderSearchWithSelection(selectionStart, selectionEnd) {
  render()
  const input = document.querySelector('#global-search')
  input?.focus()
  input?.setSelectionRange(selectionStart, selectionEnd)
}

function handleInput(event) {
  if (event.target.id !== 'global-search') return
  const { selectionStart, selectionEnd } = event.target
  updateSearchState(event.target.value)
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => renderSearchWithSelection(selectionStart, selectionEnd), 120)
}

app.addEventListener('click', (event) => { void handleClick(event) })
app.addEventListener('change', (event) => { void handleChange(event) })
app.addEventListener('input', handleInput)

function dismissMoreSheet() {
  state.isMoreOpen = false
  render()
  focusMoreSheetTrigger()
}

function trapMoreSheetTab(event) {
  const sheet = document.querySelector('.more-sheet')
  if (!sheet) return
  const focusable = Array.from(sheet.querySelectorAll('button:not([disabled])'))
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const atBoundary = event.shiftKey
    ? document.activeElement === first
    : document.activeElement === last
  if (!atBoundary) return
  event.preventDefault()
  const destination = event.shiftKey ? last : first
  destination.focus()
}

function handleMoreSheetKeydown(event) {
  if (!state.isMoreOpen) return
  if (event.key === 'Escape') {
    event.preventDefault()
    dismissMoreSheet()
    return
  }
  if (event.key === 'Tab') trapMoreSheetTab(event)
}

window.addEventListener('keydown', handleMoreSheetKeydown)
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
