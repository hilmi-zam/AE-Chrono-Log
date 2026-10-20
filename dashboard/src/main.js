import './style.css'

const app = document.querySelector('#app')
const state = {
  authorization: '',
  month: new Date().toISOString().slice(0, 7),
  notes: [],
  page: 'finance',
  summary: null,
  transactions: [],
}

const today = () => new Date().toISOString().slice(0, 10)
const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function basicAuthorization(password) {
  const bytes = new TextEncoder().encode(`chrono:${password}`)
  return `Basic ${btoa(String.fromCharCode(...bytes))}`
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      Authorization: state.authorization,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) {
      state.authorization = ''
      renderLogin('Sesi berakhir. Masukkan password Worker lagi.')
    }
    throw new Error(payload.error || `Permintaan gagal (${response.status})`)
  }
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
          <span class="connection-dot"></span><span>Worker terhubung</span>
          <button class="icon-button logout-button" type="button" data-action="logout" aria-label="Keluar" title="Keluar">↗</button>
        </div>
      </aside>
      <main class="main-content">
        <header class="topbar">
          <div><p class="eyebrow">PERSONAL DESK <span>/</span> ${state.page === 'finance' ? 'KEUANGAN' : 'CATATAN'}</p><h1>${state.page === 'finance' ? 'Keuangan' : 'Catatan'}</h1></div>
          <button class="button button-quiet refresh-button" type="button" data-action="refresh"><span aria-hidden="true">↻</span> Perbarui</button>
        </header>
        <div id="notice" class="notice" role="status" hidden></div>
        <section class="page-content">${activePage}</section>
      </main>
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
        ${state.transactions.length ? `<div class="table-wrap"><table><thead><tr><th>Transaksi</th><th>Kategori</th><th>Tanggal</th><th class="amount-cell">Nominal</th></tr></thead><tbody>${state.transactions.map(transactionRow).join('')}</tbody></table></div>` : emptyState('Belum ada transaksi pada daftar.')}
      </section>
      <aside class="content-section category-section">
        <div class="section-heading"><div><span class="section-kicker">PEMETAAN</span><h2>Per kategori</h2></div></div>
        ${categories.length ? `<div class="category-list">${categories.map((item) => `<div class="category-item"><div class="category-meta"><span>${escapeHTML(item.category)}</span><strong>${currency.format(item.total)}</strong></div><div class="bar-track"><span class="bar-fill ${item.type === 'income' ? 'bar-income' : 'bar-expense'}" style="width:${Math.max(4, (item.total / maxCategory) * 100)}%"></span></div><span class="category-type">${item.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span></div>`).join('')}</div>` : emptyState('Ringkasan kategori akan muncul setelah ada transaksi.')}
      </aside>
    </div>
    <section class="content-section entry-section">
      <div class="section-heading"><div><span class="section-kicker">CATAT BARU</span><h2>Tambah transaksi</h2></div></div>
      <form id="transaction-form" class="entry-grid">
        <label>Jenis<select name="type"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label>
        <label>Nominal (Rp)<input name="amount" type="number" min="1" step="1" inputmode="numeric" placeholder="150000" required /></label>
        <label>Kategori<input name="category" maxlength="100" placeholder="Makan, transportasi…" required /></label>
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
  return `<tr><td><span class="transaction-name">${escapeHTML(transaction.note || (isIncome ? 'Pemasukan' : 'Pengeluaran'))}</span><span class="transaction-id">ID ${transaction.id}</span></td><td><span class="tag">${escapeHTML(transaction.category)}</span></td><td class="date-cell">${date}</td><td class="amount-cell ${isIncome ? 'positive' : 'negative'}">${isIncome ? '+' : '−'}${currency.format(transaction.amount)}</td></tr>`
}

function renderNotes() {
  return `
    <div class="notes-intro"><div><span class="section-kicker">ARSIP PRIBADI</span><p class="muted">Catatan kuliah, rapat, dan hal yang perlu diingat.</p></div><span class="count-label">${state.notes.length} catatan</span></div>
    <div class="notes-layout">
      <section class="content-section note-list-section"><div class="section-heading"><div><span class="section-kicker">TERBARU</span><h2>Daftar catatan</h2></div></div>
        ${state.notes.length ? `<div class="note-list">${state.notes.map((note) => `<article class="note-item"><div class="note-item-top"><span class="note-date">${new Date(`${note.note_date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span><span class="note-id">#${note.id}</span></div><h3>${escapeHTML(note.title)}</h3><p>${escapeHTML(note.content)}</p></article>`).join('')}</div>` : emptyState('Catatan yang disimpan akan muncul di sini.')}
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

async function loadData() {
  const [summary, transactions, notes] = await Promise.all([
    api(`/api/summary?month=${encodeURIComponent(state.month)}`),
    api('/api/transactions'),
    api('/api/notes'),
  ])
  state.summary = summary
  state.transactions = transactions
  state.notes = notes
  renderApp()
}

app.addEventListener('submit', async (event) => {
  event.preventDefault()
  const form = event.target

  if (form.id === 'login-form') {
    const password = new FormData(form).get('password')
    state.authorization = basicAuthorization(password)
    try {
      await loadData()
    } catch (error) {
      state.authorization = ''
      renderLogin(error.message.includes('401') ? 'Password tidak cocok.' : error.message)
    }
    return
  }

  if (form.id === 'transaction-form') {
    const values = Object.fromEntries(new FormData(form))
    values.amount = Number(values.amount)
    values.note = values.note.trim() || null
    try {
      await api('/api/transactions', { method: 'POST', body: JSON.stringify(values) })
      await loadData()
      showNotice('Transaksi berhasil disimpan.')
    } catch (error) {
      showNotice(error.message, true)
    }
  }

  if (form.id === 'note-form') {
    const values = Object.fromEntries(new FormData(form))
    try {
      await api('/api/notes', { method: 'POST', body: JSON.stringify(values) })
      await loadData()
      showNotice('Catatan berhasil disimpan.')
    } catch (error) {
      showNotice(error.message, true)
    }
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
    state.authorization = ''
    state.summary = null
    state.transactions = []
    state.notes = []
    renderLogin()
  }

  if (actionButton.dataset.action === 'refresh') {
    actionButton.disabled = true
    try {
      await loadData()
      showNotice('Data berhasil diperbarui.')
    } catch (error) {
      showNotice(error.message, true)
    }
  }
})

app.addEventListener('change', async (event) => {
  if (event.target.id !== 'month-picker') return
  state.month = event.target.value
  try {
    state.summary = await api(`/api/summary?month=${encodeURIComponent(state.month)}`)
    renderApp()
  } catch (error) {
    showNotice(error.message, true)
  }
})

renderLogin()
