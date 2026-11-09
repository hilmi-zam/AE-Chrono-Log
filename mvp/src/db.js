const DATABASE_NAME = 'ae-chrono-log-mvp'
const DATABASE_VERSION = 3
const STORE_NAMES = ['tasks', 'agendas', 'inbox', 'courses']
const DATABASE_STORE_NAMES = [...STORE_NAMES, 'backups']

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener('success', () => resolve(request.result), { once: true })
    request.addEventListener('error', () => reject(request.error ?? new Error('Gagal membaca penyimpanan lokal.')), { once: true })
  })
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener('complete', resolve, { once: true })
    transaction.addEventListener('abort', () => reject(transaction.error ?? new Error('Perubahan lokal dibatalkan.')), { once: true })
    transaction.addEventListener('error', () => reject(transaction.error ?? new Error('Gagal menyimpan perubahan lokal.')), { once: true })
  })
}

export function openDatabase() {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('Browser ini tidak mendukung penyimpanan lokal IndexedDB.'))
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.addEventListener('upgradeneeded', () => {
      const database = request.result
      for (const name of DATABASE_STORE_NAMES) {
        if (!database.objectStoreNames.contains(name)) {
          const store = database.createObjectStore(name, { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt')
          store.createIndex('deletedAt', 'deletedAt')
        }
      }
    })
    request.addEventListener('success', () => resolve(request.result), { once: true })
    request.addEventListener('error', () => reject(request.error ?? new Error('Gagal membuka penyimpanan lokal.')), { once: true })
    request.addEventListener('blocked', () => reject(new Error('Penyimpanan lokal sedang dipakai oleh tab lama. Tutup tab Chrono Log lain lalu muat ulang.')), { once: true })
  })
}

export async function listRecords(database, storeName) {
  const transaction = database.transaction(storeName, 'readonly')
  const records = await requestResult(transaction.objectStore(storeName).getAll())
  await transactionDone(transaction)
  return records.filter((record) => !record.deletedAt)
}

export async function readBackupRecords(database) {
  const transaction = database.transaction(STORE_NAMES, 'readonly')
  const records = await Promise.all(STORE_NAMES.map((name) => requestResult(transaction.objectStore(name).getAll())))
  await transactionDone(transaction)
  return Object.fromEntries(STORE_NAMES.map((name, index) => [name, records[index]]))
}

export async function listRecoverySnapshots(database) {
  const transaction = database.transaction('backups', 'readonly')
  const records = await requestResult(transaction.objectStore('backups').getAll())
  await transactionDone(transaction)
  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export async function restoreBackupRecords(database, payload) {
  const transaction = database.transaction(DATABASE_STORE_NAMES, 'readwrite')
  const currentRequests = STORE_NAMES.map((name) => requestResult(transaction.objectStore(name).getAll()))
  const currentRecords = await Promise.all(currentRequests)
  const now = new Date().toISOString()
  const backupStore = transaction.objectStore('backups')
  backupStore.put({
    id: `before-restore-${crypto.randomUUID()}`,
    createdAt: now,
    reason: 'before-restore',
    payload: Object.fromEntries(STORE_NAMES.map((name, index) => [name, currentRecords[index]])),
  })

  for (const name of STORE_NAMES) {
    const store = transaction.objectStore(name)
    store.clear()
    for (const record of payload[name]) store.put(record)
  }

  const backups = await requestResult(backupStore.getAll())
  backups.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  for (const backup of backups.slice(30)) backupStore.delete(backup.id)
  await transactionDone(transaction)
}

export async function saveRecord(database, storeName, input) {
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  const existing = input.id ? await requestResult(store.get(input.id)) : null
  const now = new Date().toISOString()
  const record = {
    ...existing,
    ...input,
    id: input.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    deletedAt: null,
  }
  store.put(record)
  await transactionDone(transaction)
  return record
}

export async function saveConvertedRecord(database, storeName, input, sourceInboxId) {
  if (!['tasks', 'agendas'].includes(storeName)) throw new Error('Tipe konversi Inbox tidak didukung.')

  const transaction = database.transaction([storeName, 'inbox'], 'readwrite')
  const targetStore = transaction.objectStore(storeName)
  const inboxStore = transaction.objectStore('inbox')
  const source = await requestResult(inboxStore.get(sourceInboxId))
  if (!source || source.deletedAt || source.status !== 'active') {
    transaction.abort()
    throw new Error('Item Inbox sudah tidak aktif atau telah dikonversi.')
  }

  const now = new Date().toISOString()
  const record = {
    ...input,
    id: crypto.randomUUID(),
    sourceInboxId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  inboxStore.put({ ...source, status: 'converted', convertedTo: { type: storeName, id: record.id }, updatedAt: now })
  targetStore.put(record)
  await transactionDone(transaction)
  return record
}

export async function saveOccurrenceException(database, agendaId, originalDate, exception) {
  const transaction = database.transaction('agendas', 'readwrite')
  const store = transaction.objectStore('agendas')
  const agenda = await requestResult(store.get(agendaId))
  if (!agenda || agenda.deletedAt || agenda.recurrence?.frequency !== 'weekly') {
    transaction.abort()
    throw new Error('Jadwal berulang tidak ditemukan.')
  }
  if (originalDate < agenda.date || originalDate > agenda.recurrence.until) {
    transaction.abort()
    throw new Error('Tanggal pertemuan berada di luar jadwal berulang.')
  }

  const now = new Date().toISOString()
  store.put({
    ...agenda,
    exceptions: { ...agenda.exceptions, [originalDate]: exception },
    updatedAt: now,
  })
  await transactionDone(transaction)
}

export async function softDeleteRecord(database, storeName, id) {
  const transaction = database.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)
  const record = await requestResult(store.get(id))
  if (!record || record.deletedAt) {
    transaction.abort()
    throw new Error('Data tidak ditemukan atau sudah dihapus.')
  }
  store.put({ ...record, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  await transactionDone(transaction)
}
