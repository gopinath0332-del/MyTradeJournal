import { createRouter, createWebHistory } from 'vue-router'

// Lazy loading components for better performance
const DashboardStats = () => import('../components/dashboard/DashboardStats.vue')
const TradeHistory = () => import('../components/trade/TradeHistory.vue')
const StatisticsView = () => import('../components/StatisticsView.vue')
const CalendarView = () => import('../components/CalendarView.vue')
const HeatmapView = () => import('../components/HeatmapView.vue')
const TradeForm = () => import('../components/trade/TradeForm.vue')
const FirebaseDebug = () => import('../components/debug/FirebaseDebug.vue')

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/debug',
    name: 'FirebaseDebug',
    component: FirebaseDebug,
    meta: {
      title: 'Firebase Debug'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardStats,
    meta: {
      title: 'Dashboard'
    }
  },
  {
    path: '/history',
    name: 'TradeHistory',
    component: TradeHistory,
    meta: {
      title: 'Trade History'
    }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: StatisticsView,
    meta: {
      title: 'Statistics'
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarView,
    meta: {
      title: 'Calendar'
    }
  },
  {
    path: '/heatmap',
    name: 'Heatmap',
    component: HeatmapView,
    meta: {
      title: 'Heatmap'
    }
  },
  {
    path: '/trade',
    name: 'LogTrade',
    component: TradeForm,
    meta: {
      title: 'Log Trade'
    }
  },
  {
    path: '/trade/edit/:id',
    name: 'EditTrade',
    component: TradeForm,
    meta: {
      title: 'Edit Trade'
    },
    props: true
  }
]

const router = createRouter({
  history: createWebHistory('/MyTradeJournal/'),
  routes
})

// Navigation guard to update document title
router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - Trade Journal`
  }
  next()
})

export default router
