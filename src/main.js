import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import LessonsView from './views/LessonsView.vue'
import CartView from './views/CartView.vue'

const routes = [
  { path: '/', component: LessonsView },
  { path: '/cart', component: CartView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')