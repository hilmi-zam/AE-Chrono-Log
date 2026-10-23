import './style.css'

const app = document.querySelector('#app')

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const state = {
  authorization: '',
  connection: 'online',
  month: localDateKey().slice(0, 7),
  noteHasMore: false,
  noteQuery: '',
  notes: [],
  page: 'finance',
  summary: null,
  transactions: [],
}

const today = () => localDateKey()
const NOTE_PAGE_SIZE = 100
let noteSearchTimer = null
let notesRequestId = 0
let financeRequestId = 0
const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})
const transactionCategories = {
  income: ['Gaji', 'Bonus', 'Usaha', 'Investasi', 'Hadiah', 'Lainnya'],
  expense: ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Hiburan', 'Rumah Tangga', 'Lainnya'],
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function categoryOptions(type, selected = '') {
  const categories = [...transactionCategories[type]]
  const hasExistingCategory = selected && !categories.includes(selected)
  if (hasExistingCategory) categories.unshift(selected)

  return categories.map((category) => `
    <option value="${escapeHTML(category)}" ${category === selected ? 'selected' : ''}>
      ${escapeHTML(category)}${hasExistingCategory && category === selected ? ' (kategori lama)' : ''}
    </option>`).join('')
}

function basicAuthorization(password) {
  const bytes = new TextEncoder().encode(`chrono:${password}`)
  return `Basic ${btoa(String.fromCharCode(...bytes))}`
}

class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function friendlyError(status) {
  if (status === 400) return 'Data yang dikirim tidak valid. Periksa isian lalu coba lagi.'
  if (status === 401) return 'Password tidak cocok atau sesi berakhir.'
  if (status === 404) return 'Data tidak ditemukan. Mungkin sudah dihapus.'
  if (status >= 500) return 'Worker gagal memproses permintaan. Coba lagi sebentar lagi.'
  return 'Permintaan gagal. Coba lagi.'
}

function setConnection(offline) {
  state.connection = offline ? 'offline' : 'online'
  const dot = document.querySelector('.connection-dot')
  const label = document.querySelector('#connection-label')
  if (dot) dot.classList.toggle('connection-offline', offline)
  if (label) label.textContent = offline ? 'Worker tidak terjangkau' : 'Worker terhubung'
}

async function api(path, options = {}) {
  let response

  try {
    response = await fetch(path, {
      ...options,
      headers: {
        Authorization: state.authorization,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    setConnection(true)
    throw new ApiError('Tidak dapat menghubungi Worker. Periksa koneksi atau server.')
  }

  if (!response.ok) {
    if (response.status === 401) {
      state.authorization = ''
      clearTimeout(noteSearchTimer)
      notesRequestId += 1
      renderLogin('Sesi berakhir. Masukkan password Worker lagi.')
    }
    throw new ApiError(friendlyError(response.status), response.status)
  }

  const payload = await response.json().catch(() => null)
  if (payload === null) {
    throw new ApiError('Worker mengembalikan format data yang tidak dikenali.')
  }

  setConnection(false)
  return payload
}

function renderLogin(message = '') {
  app.innerHTML = `
    <main class="login-shell">
      <section class="login-panel" aria-labelledby="login-title">
        <div class="brand-mark">Æ</div>
        <p class="eyebrow">RUANG PRIBADI</p>
        <h1 id="login-title">Chrono Log</h1>
        <p class="login-copy">Masuk untuk membuka catatan keuangan dan aktivitasmu.</p>
        <form id="login-form" class="stack-form">
          <label for="worker-password">Password Worker</label>
          <input id="worker-password" name="password" type="password" autocomplete="current-password" required autofocus />
          <button class="button button-dark button-wide" type="submit">Masuk <span aria-hidden="true">→</span></button>
        </form>
        <p class="form-message" role="status">${escapeHTML(message)}</p>
        <p class="privacy-note">Password hanya disimpan sementara di memori halaman ini.</p>
      </section>
      <aside class="login-aside" aria-hidden="true">
        <span class="aside-index">01 / PERSONAL DESK</span>
        <div class="aside-line"></div>
        <p>Keuangan lebih jernih.<br />Catatan tetap tertata.</p>
      </aside>
    </main>`
}

function renderApp() {
  const activePage = state.page === 'finance' ? renderFinance() : renderNotes()
  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#finance" data-page="finance" aria-label="Æ Chrono Log beranda">
          <span class="brand-mark">Æ</span><span>chrono<span class="brand-light">log</span></span>
        </a>
        <p class="nav-label">RUANG KERJA</p>
        <nav class="main-nav" aria-label="Navigasi utama">
          <button class="nav-item ${state.page === 'finance' ? 'active' : ''}" data-page="finance"><span class="nav-symbol">◫</span>Keuangan</button>
          <button class="nav-item ${state.page === 'notes' ? 'active' : ''}" data-page="notes"><span class="nav-symbol">▤</span>Catatan</button>
        </nav>
        <div class="sidebar-bottom">
          <span class="connection-dot${state.connection === 'offline' ? ' connection-offline' : ''}"></span><span id="connection-label">${state.connection === 'offline' ? 'Worker tidak terjangkau' : 'Worker terhubung'}</span>
          <button class="icon-button logout-button" type="button" data-action="logout" aria-label="Keluar" title="Keluar">↗</button>
        </div>
      </aside>
      <main class="main-content">
        <header class="topbar">
          <div><p class="eyebrow">PERSONAL DESK <span>/</span> ${state.page === 'finance' ? 'KEUANGAN' : 'CATATAN'}</p><h1>${state.page === 'finance' ? 'Keuangan' : 'Catatan'}</h1></div>
            <div class="topbar-actions">
              <button class="button button-quiet export-button" type="button" data-action="export" data-scope="view" data-kind="${state.page === 'finance' ? 'transactions' : 'notes'}"><span aria-hidden="true">↓</span> Ekspor tampilan</button>
              <button class="button button-quiet export-button" type="button" data-action="export" data-scope="all" data-kind="${state.page === 'finance' ? 'transactions' : 'notes'}"><span aria-hidden="true">↓</span> Ekspor semua</button>
              <button class="button button-quiet refresh-button" type="button" data-action="refresh"><span aria-hidden="true">↻</span> Perbarui</button>
            </div>
        </header>
        <div id="notice" class="notice" role="status" hidden></div>
        <section class="page-content">${activePage}</section>
      </main>
      <dialog id="edit-dialog" class="edit-dialog" aria-labelledby="edit-dialog-title">
        <div class="dialog-heading"><h2 id="edit-dialog-title">Ubah data</h2><button class="icon-button dialog-close" type="button" data-action="close-dialog" aria-label="Tutup">×</button></div>
        <form id="edit-form" class="stack-form"></form>
      </dialog>
    </div>`
}

function renderFinance() {
  const summary = state.summary || { income: 0, expense: 0, balance: 0, by_category: [] }
  const categories = summary.by_category || []
  const maxCategory = Math.max(1, ...categories.map((item) => item.total))

  return `
    <div class="period-row">
      <div><span class="section-kicker">RINGKASAN PERIODE</span><p class="muted">Total berdasarkan bulan transaksi</p></div>
      <label class="month-picker">Bulan<input id="month-picker" type="month" value="${escapeHTML(state.month)}" /></label>
    </div>
    <div class="summary-grid">
      ${summaryCard('Pemasukan', summary.income, 'income', '↗')}
      ${summaryCard('Pengeluaran', summary.expense, 'expense', '↘')}
      ${summaryCard('Selisih', summary.balance, 'balance', '＝')}
    </div>
    <div class="finance-layout">
      <section class="content-section transaction-section">
        <div class="section-heading"><div><span class="section-kicker">AKTIVITAS</span><h2>Transaksi terbaru</h2></div><span class="count-label">${state.transactions.length} tercatat</span></div>
        ${state.transactions.length ? `<div class="table-wrap"><table><thead><tr><th>Transaksi</th><th>Kategori</th><th>Tanggal</th><th class="amount-cell">Nominal</th><th><span class="visually-hidden">Aksi</span></th></tr></thead><tbody>${state.transactions.map(transactionRow).join('')}</tbody></table></div>` : emptyState('Belum ada transaksi pada daftar.')}
      </section>
      <aside class="content-section category-section">
        <div class="section-heading"><div><span class="section-kicker">PEMETAAN</span><h2>Per kategori</h2></div></div>
        ${categories.length ? `<div class="category-list">${categories.map((item) => `<div class="category-item"><div class="category-meta"><span>${escapeHTML(item.category)}</span><strong>${currency.format(item.total)}</strong></div><div class="bar-track"><span class="bar-fill ${item.type === 'income' ? 'bar-income' : 'bar-expense'}" style="width:${Math.max(4, (item.total / maxCategory) * 100)}%"></span></div><span class="category-type">${item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span></div>`).join('')}</div>` : emptyState('Ringkasan kategori akan muncul setelah ada transaksi.')}
      </aside>
    </div>
    <section class="content-section entry-section">
      <div class="section-heading"><div><span class="section-kicker">CATAT BARU</span><h2>Tambah transaksi</h2></div></div>
      <form id="transaction-form" class="entry-grid">
        <label>Jenis<select id="transaction-type" name="type"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label>
        <label>Nominal (Rp)<input name="amount" type="number" min="1" step="1" inputmode="numeric" placeholder="150000" required /></label>
        <label>Kategori<select id="transaction-category" name="category" required>${categoryOptions('expense')}</select></label>
        <label>Tanggal<input name="transaction_date" type="date" value="${today()}" required /></label>
        <label class="wide-field">Catatan singkat<input name="note" maxlength="2000" placeholder="Opsional" /></label>
        <div class="form-actions"><button class="button button-dark" type="submit">Simpan transaksi <span aria-hidden="true">＋</span></button></div>
      </form>
    </section>`
}

function summaryCard(label, amount, tone, symbol) {
  return `<article class="summary-card ${tone}"><div class="summary-card-top"><span>${label}</span><span class="summary-symbol" aria-hidden="true">${symbol}</span></div><strong>${currency.format(amount || 0)}</strong><span class="summary-caption">Bulan ${escapeHTML(state.month)}</span></article>`
}

function transactionRow(transaction) {
  const isIncome = transaction.type === 'income'
  const date = new Date(`${transaction.transaction_date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  return `<tr><td><span class="transaction-name">${escapeHTML(transaction.note || (isIncome ? 'Pemasukan' : 'Pengeluaran'))}</span><span class="transaction-id">ID ${transaction.id}</span></td><td><span class="tag">${escapeHTML(transaction.category)}</span></td><td class="date-cell">${date}</td><td class="amount-cell ${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : '−'}${currency.format(transaction.amount)}</td><td class="row-actions"><button class="text-action" type="button" data-action="edit" data-kind="transaction" data-id="${transaction.id}">Ubah</button><button class="text-action delete-action" type="button" data-action="delete" data-kind="transaction" data-id="${transaction.id}">Hapus</button></td></tr>`
}

function noteCountText() {
  if (state.noteQuery) return `${state.notes.length} hasil`
  return `${state.notes.length} catatan dimuat`
}

function noteResultsHTML() {
  if (!state.notes.length) {
    return emptyState(
      state.noteQuery
        ? `Tidak ada catatan yang cocok dengan "${escapeHTML(state.noteQuery)}".`
        : 'Catatan yang disimpan akan muncul di sini.'
    )
  }

  const list = `<div class="note-list">${state.notes.map((note) => `<article class="note-item"><div class="note-item-top"><span class="note-date">${new Date(`${note.note_date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span><span class="note-id">#${note.id}</span></div><h3>${escapeHTML(note.title)}</h3><p>${escapeHTML(note.content)}</p><div class="note-actions"><button class="text-action" type="button" data-action="edit" data-kind="note" data-id="${note.id}">Ubah</button><button class="text-action delete-action" type="button" data-action="delete" data-kind="note" data-id="${note.id}">Hapus</button></div></article>`).join('')}</div>`
  const more = !state.noteQuery && state.noteHasMore
    ? `<div class="note-more"><button class="button button-quiet" type="button" data-action="load-more-notes">Muat ${NOTE_PAGE_SIZE} catatan lagi</button></div>`
    : ''

  return `${list}${more}`
}

function renderNotes() {
  return `
    <div class="notes-intro"><div><span class="section-kicker">ARSIP PRIBADI</span><p class="muted">Catatan kuliah, rapat, dan hal yang perlu diingat.</p></div>
      <div class="notes-tools">
        <label class="note-search">Cari<input id="note-search" type="search" maxlength="100" value="${escapeHTML(state.noteQuery)}" placeholder="Judul atau isi catatan…" autocomplete="off" /></label>
        <span id="note-count" class="count-label" aria-live="polite">${noteCountText()}</span>
      </div>
    </div>
    <div class="notes-layout">
      <section class="content-section note-list-section"><div class="section-heading"><div><span class="section-kicker">TERBARU</span><h2>Daftar catatan</h2></div></div>
        <div id="note-results">${noteResultsHTML()}</div>
      </section>
      <section class="content-section note-form-section"><div class="section-heading"><div><span class="section-kicker">CATAT BARU</span><h2>Tulis catatan</h2></div></div>
        <form id="note-form" class="stack-form note-form">
          <label>Judul<input name="title" maxlength="200" placeholder="Contoh: Rapat mingguan" required /></label>
          <label>Tanggal<input name="note_date" type="date" value="${today()}" required /></label>
          <label>Isi catatan<textarea name="content" rows="9" maxlength="50000" placeholder="Tulis poin penting di sini…" required></textarea></label>
          <button class="button button-dark" type="submit">Simpan catatan <span aria-hidden="true">＋</span></button>
        </form>
      </section>
    </div>`
}

function emptyState(message) {
  return `<div class="empty-state"><span class="empty-mark" aria-hidden="true">—</span><p>${message}</p></div>`
}

function showNotice(message, isError = false) {
  const notice = document.querySelector('#notice')
  if (!notice) return
  notice.hidden = false
  notice.className = `notice ${isError ? 'notice-error' : 'notice-success'}`
  notice.textContent = message
}

async function loadAllData() {
  notesRequestId += 1
  const [summary, transactions, notesPage] = await Promise.all([
    api(`/api/summary?month=${encodeURIComponent(state.month)}`),
    loadAllPages('transactions', { month: state.month }),
    fetchNotes(),
  ])
  state.summary = summary
  state.transactions = transactions
  state.notes = notesPage.notes
  state.noteHasMore = notesPage.hasMore
  renderApp()
}

async function loadFinanceData({ render = true } = {}) {
  const requestId = ++financeRequestId
  const [summary, transactions] = await Promise.all([
    api(`/api/summary?month=${encodeURIComponent(state.month)}`),
    loadAllPages('transactions', { month: state.month }),
  ])
  if (requestId !== financeRequestId) return false

  state.summary = summary
  state.transactions = transactions
  if (render) renderApp()
  return true
}

async function fetchNotes({ append = false } = {}) {
  if (state.noteQuery) {
    const notes = await loadAllPages('notes', { q: state.noteQuery })
    return { notes, hasMore: false }
  }

  const query = new URLSearchParams({
    limit: String(NOTE_PAGE_SIZE),
    offset: String(append ? state.notes.length : 0),
  })
  const page = await api(`/api/notes?${query}`)
  if (!Array.isArray(page)) {
    throw new ApiError('Format data catatan tidak dikenali.')
  }

  return {
    notes: append ? [...state.notes, ...page] : page,
    hasMore: page.length === NOTE_PAGE_SIZE,
  }
}

async function loadNotesData({ append = false, render = true, rethrow = false } = {}) {
  const requestId = ++notesRequestId

  try {
    const { notes, hasMore } = await fetchNotes({ append })
    if (requestId !== notesRequestId) return false

    state.notes = notes
    state.noteHasMore = hasMore
    if (render) {
      renderApp()
    } else {
      renderNoteResults()
    }
    return true
  } catch (error) {
    if (requestId !== notesRequestId) return false
    if (rethrow) throw error
    showNotice(error.message, true)
    return false
  }
}

function renderNoteResults() {
  const results = document.querySelector('#note-results')
  const count = document.querySelector('#note-count')
  if (results) results.innerHTML = noteResultsHTML()
  if (count) count.textContent = noteCountText()
}

function noteVisibleMessage(id, message) {
  if (!state.noteQuery) return message
  return state.notes.some((note) => note.id === id)
    ? message
    : `${message} Namun catatan ini tidak cocok dengan pencarian aktif.`
}

function lockForm(form) {
  if (form.dataset.busy === 'true') return false
  form.dataset.busy = 'true'
  form.querySelectorAll('button[type="submit"]').forEach((button) => {
    button.disabled = true
  })
  return true
}

function unlockForm(form) {
  if (!form.isConnected) return
  delete form.dataset.busy
  form.querySelectorAll('button[type="submit"]').forEach((button) => {
    button.disabled = false
  })
}

function openEditDialog(kind, id) {
  const collection = kind === 'transaction' ? state.transactions : state.notes
  const item = collection.find((entry) => entry.id === id)
  if (!item) return

  const dialog = document.querySelector('#edit-dialog')
  const form = document.querySelector('#edit-form')
  form.dataset.kind = kind
  form.dataset.id = String(id)

  if (kind === 'transaction') {
    document.querySelector('#edit-dialog-title').textContent = 'Ubah transaksi'
    form.innerHTML = `
      <label>Jenis<select id="edit-transaction-type" name="type"><option value="expense" ${item.type === 'expense' ? 'selected' : ''}>Pengeluaran</option><option value="income" ${item.type === 'income' ? 'selected' : ''}>Pemasukan</option></select></label>
      <label>Nominal (Rp)<input name="amount" type="number" min="1" step="1" value="${item.amount}" required /></label>
      <label>Kategori<select id="edit-transaction-category" name="category" required>${categoryOptions(item.type, item.category)}</select></label>
      <label>Tanggal<input name="transaction_date" type="date" value="${escapeHTML(item.transaction_date)}" required /></label>
      <label>Catatan singkat<input name="note" maxlength="2000" value="${escapeHTML(item.note || '')}" /></label>
      <div class="dialog-actions"><button class="button button-quiet" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">Simpan perubahan</button></div>`
  } else {
    document.querySelector('#edit-dialog-title').textContent = 'Ubah catatan'
    form.innerHTML = `
      <label>Judul<input name="title" maxlength="200" value="${escapeHTML(item.title)}" required /></label>
      <label>Tanggal<input name="note_date" type="date" value="${escapeHTML(item.note_date)}" required /></label>
      <label>Isi catatan<textarea name="content" rows="8" maxlength="50000" required>${escapeHTML(item.content)}</textarea></label>
      <div class="dialog-actions"><button class="button button-quiet" type="button" data-action="close-dialog">Batal</button><button class="button button-dark" type="submit">Simpan perubahan</button></div>`
  }

  dialog.showModal()
}

async function loadAllPages(resource, filters = {}) {
  const pageSize = 100
  const records = []
  const seenPages = new Set()
  let offset = 0

  while (true) {
    const query = new URLSearchParams({
      ...filters,
      limit: String(pageSize),
      offset: String(offset),
    })
    const page = await api(`/api/${resource}?${query}`)
    if (!Array.isArray(page)) {
      throw new ApiError('Worker mengembalikan format data yang tidak dikenali.')
    }
    const pageKey = page.map((record) => record.id).join(',')
    if (page.length > 0 && seenPages.has(pageKey)) {
      throw new ApiError('Worker tidak mengembalikan halaman berikutnya. Perbarui Worker terlebih dahulu.')
    }
    seenPages.add(pageKey)
    records.push(...page)
    if (page.length < pageSize) return records
    offset += page.length
  }
}

function csvCell(value) {
  let text = value == null ? '' : String(value)
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function downloadCsv(kind, records, scope = 'all') {
  const columns = kind === 'transactions'
    ? [
        ['ID', 'id'],
        ['Jenis', 'type'],
        ['Nominal (Rp)', 'amount'],
        ['Kategori', 'category'],
        ['Tanggal', 'transaction_date'],
        ['Catatan', 'note'],
        ['Dibuat pada', 'created_at'],
      ]
    : [
        ['ID', 'id'],
        ['Judul', 'title'],
        ['Isi', 'content'],
        ['Tanggal', 'note_date'],
        ['Dibuat pada', 'created_at'],
      ]
  const rows = [
    columns.map(([label]) => csvCell(label)),
    ...records.map((record) => columns.map(([, key]) => csvCell(record[key]))),
  ]
  const csv = `\uFEFF${rows.map((row) => row.join(',')).join('\r\n')}`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const date = today()
  link.href = downloadUrl
  link.download = `ae-chrono-log-${kind}-${scope === 'all' ? 'semua' : 'tampilan'}-${date}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

app.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.target
  if (!lockForm(form)) return

  try {
    if (form.id === 'login-form') {
      const password = new FormData(form).get('password')
      state.authorization = basicAuthorization(password)
      try {
        await loadAllData()
      } catch (error) {
        state.authorization = ''
        renderLogin(error.status === 401 ? 'Password tidak cocok.' : error.message)
      }
      return
    }

    if (form.id === 'edit-form') {
      const kind = form.dataset.kind
      const id = Number(form.dataset.id)
      const resource = kind === 'transaction' ? 'transactions' : 'notes'
      const values = Object.fromEntries(new FormData(form))
      if (kind === 'transaction') {
        values.amount = Number(values.amount)
        values.note = values.note.trim() || null
      }

      try {
        await api(`/api/${resource}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(values),
        })
        document.querySelector('#edit-dialog').close()

        if (kind === 'transaction') {
          state.month = values.transaction_date.slice(0, 7)
          await loadFinanceData()
          showNotice('Transaksi berhasil diubah.')
        } else {
          await loadNotesData({ rethrow: true })
          showNotice(noteVisibleMessage(id, 'Catatan berhasil diubah.'))
        }
      } catch (error) {
        showNotice(error.message, true)
      }
      return
    }

    if (form.id === 'transaction-form') {
      const values = Object.fromEntries(new FormData(form))
      values.amount = Number(values.amount)
      values.note = values.note.trim() || null
      try {
        await api('/api/transactions', { method: 'POST', body: JSON.stringify(values) })
        state.month = values.transaction_date.slice(0, 7)
        await loadFinanceData()
        showNotice('Transaksi berhasil disimpan.')
      } catch (error) {
        showNotice(error.message, true)
      }
      return
    }

    if (form.id === 'note-form') {
      const values = Object.fromEntries(new FormData(form))
      try {
        const result = await api('/api/notes', { method: 'POST', body: JSON.stringify(values) })
        await loadNotesData({ rethrow: true })
        showNotice(noteVisibleMessage(result.id, 'Catatan berhasil disimpan.'))
      } catch (error) {
        showNotice(error.message, true)
      }
    }
  } finally {
    unlockForm(form)
  }
})

app.addEventListener('click', async (event) => {
  const pageButton = event.target.closest('[data-page]')
  if (pageButton) {
    event.preventDefault()
    state.page = pageButton.dataset.page
    renderApp()
  }

  const actionButton = event.target.closest('[data-action]')
  if (!actionButton) return

  if (actionButton.dataset.action === 'logout') {
    clearTimeout(noteSearchTimer)
    notesRequestId += 1
    state.authorization = ''
    state.noteHasMore = false
    state.noteQuery = ''
    state.summary = null
    state.transactions = []
    state.notes = []
    renderLogin()
  }

  if (actionButton.dataset.action === 'close-dialog') {
    document.querySelector('#edit-dialog')?.close()
  }

  if (actionButton.dataset.action === 'edit') {
    openEditDialog(actionButton.dataset.kind, Number(actionButton.dataset.id))
  }

  if (actionButton.dataset.action === 'delete') {
    const kind = actionButton.dataset.kind
    const id = Number(actionButton.dataset.id)
    const resource = kind === 'transaction' ? 'transactions' : 'notes'
    const collection = kind === 'transaction' ? state.transactions : state.notes
    const item = collection.find((entry) => entry.id === id)
    const description = kind === 'transaction'
      ? `${item?.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${currency.format(item?.amount || 0)} (${item?.category || ''})`
      : `catatan "${item?.title || ''}"`

    if (item && window.confirm(`Hapus ${description}? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        await api(`/api/${resource}/${id}`, { method: 'DELETE' })
        if (kind === 'transaction') {
          await loadFinanceData()
        } else {
          await loadNotesData({ rethrow: true })
        }
        showNotice(kind === 'transaction' ? 'Transaksi berhasil dihapus.' : 'Catatan berhasil dihapus.')
      } catch (error) {
        showNotice(error.message, true)
      }
    }
  }

  if (actionButton.dataset.action === 'refresh') {
    actionButton.disabled = true
    try {
      if (state.page === 'finance') {
        await loadFinanceData()
      } else {
        await loadNotesData({ rethrow: true })
      }
      showNotice('Data berhasil diperbarui.')
    } catch (error) {
      showNotice(error.message, true)
    } finally {
      actionButton.disabled = false
    }
  }

  if (actionButton.dataset.action === 'load-more-notes') {
    actionButton.disabled = true
    try {
      await loadNotesData({ append: true, render: false, rethrow: true })
    } catch (error) {
      showNotice(error.message, true)
    } finally {
      actionButton.disabled = false
    }
  }

  if (actionButton.dataset.action === 'export') {
    const kind = actionButton.dataset.kind
    const scope = actionButton.dataset.scope === 'all' ? 'all' : 'view'
    const filters = {}

    if (scope === 'view') {
      if (kind === 'transactions') {
        filters.month = state.month
      } else if (state.noteQuery) {
        filters.q = state.noteQuery
      }
    }

    actionButton.disabled = true
    try {
      const records = await loadAllPages(kind, filters)
      downloadCsv(kind, records, scope)
      showNotice(`CSV ${scope === 'all' ? 'semua data' : 'tampilan'} berhasil dibuat: ${records.length} baris.`)
    } catch (error) {
      showNotice(error.message, true)
    } finally {
      actionButton.disabled = false
    }
  }
})

app.addEventListener('input', (event) => {
  if (event.target.id !== 'note-search') return
  state.noteQuery = event.target.value.trim()
  clearTimeout(noteSearchTimer)
  noteSearchTimer = setTimeout(() => {
    loadNotesData({ render: false })
  }, 300)
})

app.addEventListener('change', async (event) => {
  if (event.target.id === 'transaction-type') {
    document.querySelector('#transaction-category').innerHTML = categoryOptions(event.target.value)
    return
  }

  if (event.target.id === 'edit-transaction-type') {
    document.querySelector('#edit-transaction-category').innerHTML = categoryOptions(event.target.value)
    return
  }

  if (event.target.id !== 'month-picker') return
  if (!event.target.value) return
  state.month = event.target.value
  try {
    await loadFinanceData()
  } catch (error) {
    showNotice(error.message, true)
  }
})

renderLogin()
