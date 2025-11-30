// src/main.js
// Entry point of the Vue 3 application
// Sets up Vue instance, router, and mounts the app

import { createApp } from 'vue'                         
import { createRouter, createWebHistory } from 'vue-router'    
import App from './App.vue'                                 
import LessonsView from './views/LessonsView.vue'              
import CartView from './views/CartView.vue'                    

// Define application routes
const routes = [
  { path: '/', component: LessonsView },       // Home → displays all lessons
  { path: '/cart', component: CartView }       // Cart → view basket & checkout
]

// Create router instance with HTML5 history mode
// Base path '/frontend/' ensures correct routing when deployed in subfolder
const router = createRouter({
  history: createWebHistory('/frontend/'),
  routes
})

// Create Vue app instance, use router, and mount to DOM
createApp(App)
  .use(router)                     // Enable routing
  .mount('#app')                   // Mount to <div id="app"> in index.html