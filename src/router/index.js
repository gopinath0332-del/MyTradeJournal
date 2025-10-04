import { createRouter, createWebHistory } from 'vue-router'
import DashboardStats from '../components/dashboard/DashboardStats.vue'
import TradeHistory from '../components/trade/TradeHistory.vue'
import StatisticsView from '../components/StatisticsView.vue'
import CalendarView from '../components/CalendarView.vue'
import HeatmapView from '../components/HeatmapView.vue'
import TradeForm from '../components/trade/TradeForm.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
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
