import { localDateKey } from './domain.js'

export const app = document.querySelector('#app')
export const SERVICE_WORKER_CACHE_VERSION = 'v2'
export const state = {
  database: null,
  page: 'dashboard',
  tasks: [],
  agendas: [],
  inbox: [],
  courses: [],
  selectedCourseId: '',
  showArchivedCourses: false,
  calendarView: 'week',
  calendarDate: localDateKey(),
  message: '',
  query: '',
  searchType: 'all',
  searchFrom: '',
  searchTo: '',
  searchReturnPage: 'dashboard',
  taskFilter: 'Aktif',
  inboxView: 'active',
  recoverySnapshots: [],
  isMoreOpen: false,
}
