<template>
  <div class="container-fluid vh-100 d-flex flex-column overflow-hidden">
    <!-- Global Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-dark custom-navbar shadow-sm">
      <div class="container">
        <!-- Brand / Logo -->
        <a class="navbar-brand d-flex align-items-center" href="/frontend/">
          <img src="/logo.png" alt="Logo" class="brand-logo me-2">
          <span class="brand-text">
            <span class="fw-bold text-warning">The Best</span>
            <span class="fw-light"> After‑School Club</span>
          </span>
        </a>
        <!-- Dynamic navigation: Cart button on lessons page, Lessons button on cart page -->
        <div class="navbar-nav ms-auto">
          <!-- Show Cart button only on lessons page using v-if -->
          <button v-if="route.path === '/'" class="btn btn-outline-light" @click="toggleCart">
            <i class="fas fa-shopping-cart me-1"></i> Cart ({{ cartTotal }})
          </button>

          <!-- Show Lessons button only on cart page using v-else-if-->
          <button v-else-if="route.path === '/cart'" class="btn btn-outline-light" @click="toggleCart">
            <i class="fas fa-book me-1"></i> Lessons
          </button>
        </div>

      </div>
    </nav>

    <!-- Main content area — rendered by Vue Router -->
    <router-view />

    <!-- Global toast notification system -->
    <div class="toast-container position-fixed top-0 end-0 p-3">
      <div v-for="toast in toasts" :key="toast.id"
           class="toast show align-items-center text-white border-0 mb-2 animate-toast"
           :class="toast.type === 'success' ? 'bg-success' : 'bg-danger'">
        <div class="d-flex">
          <div class="toast-body">{{ toast.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// src/App.vue
// Root component — acts as the application shell and global state provider
// Uses provide/inject pattern to share state across deeply nested components

import { ref, reactive, provide, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()

    // Base API URL from Vite environment variables
    const apiUrl = import.meta.env.VITE_API_URL 

// === GLOBAL REACTIVE STATE ===
    const lessons = ref([])                    // All available lessons from server
    const cart = reactive({})                  // Shopping cart: { lessonId: quantity }
    const searchQuery = ref('')                // Search input value
    const sortBy = ref('topic')                // Sorting field
    const sortOrder = ref('asc')               // Sort direction
    const orderName = ref('')                  // Customer name during checkout
    const orderPhone = ref('')                 // Customer phone
    const orderNotes = ref('')                 // Optional notes
    const viewMode = ref('card')               // UI mode: 'card' or 'list'
    const isSubmitting = ref(false)            // Prevent double submission

    // Toast Notification System
    const toasts = ref([])
    const showToast = (message, type = 'success') => {
      const id = Date.now()
      toasts.value.push({ id, message, type })
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 3000)
    }

    // Fetch lessons from server
    const fetchLessons = async () => {
      try {
        const res = await fetch(`${apiUrl}/lessons`)
        const data = await res.json()

        lessons.value = data.map(l => ({
          ...l,
          totalSpace: l.space
        }))
      } catch (err) {
        showToast('Error fetching lessons', 'error')
      }
    }


    // Debounced search
    let searchTimeout
    const debouncedSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(async () => {
        if (searchQuery.value) {
          const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(searchQuery.value)}`)
          lessons.value = await res.json()
        } else {
          fetchLessons()
        }
      }, 300)
    }

    // Cart functions
    const addToBasket = (id) => {
      const lesson = lessons.value.find(l => l._id === id)
      if (lesson.space > 0) {
        cart[id] = (cart[id] || 0) + 1
        lesson.space -= 1
      }
    }

    const updateQty = (id, change) => {
      const lesson = lessons.value.find(l => l._id === id)
      const newQty = (cart[id] || 0) + change
      if (newQty < 0) return
      if (change > 0 && change > lesson.space) return
      cart[id] = newQty
      lesson.space -= change
      if (newQty === 0) delete cart[id]
    }

    const removeFromBasket = (id) => {
      const lesson = lessons.value.find(l => l._id === id)
      if (cart[id]) {
        lesson.space += cart[id]
        delete cart[id]
      }
    }

    // Order Validation
    const isValidOrder = computed(() => {
      const nameValid = /^[A-Za-z\s]+$/.test(orderName.value)
      const phoneValid = /^0\d{10}$/.test(orderPhone.value)
      const notesValid = !orderNotes.value || orderNotes.value.length <= 250
      return nameValid && phoneValid && notesValid
    })

    const cartTotal = computed(() => Object.values(cart).reduce((a, b) => a + b, 0))
    const cartTotalPrice = computed(() =>
      Object.entries(cart).reduce((sum, [id, qty]) => sum + qty * getLessonPrice(id), 0)
    )
    const getLessonName = (id) =>
      lessons.value.find(l => l._id === id)?.topic + ' in ' + lessons.value.find(l => l._id === id)?.location
    const getLessonPrice = (id) => lessons.value.find(l => l._id === id)?.price

    // Checkout logic
    const checkout = async () => {
      if (isSubmitting.value) return
      isSubmitting.value = true

      const order = {
        name: orderName.value,
        phone: orderPhone.value,
        lessons: Object.entries(cart).map(([id, qty]) => ({ id, qty })),
        notes: orderNotes.value
      }
      try {
        const postRes = await fetch(`${apiUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        })
        const data = await postRes.json()
        if (!postRes.ok) {
          showToast(`Order failed: ${data.error}`, 'error')
          return
        }

        await fetchLessons()

        showToast('Order submitted successfully!', 'success')
        // Clear cart and form
        Object.keys(cart).forEach(key => delete cart[key])
        orderName.value = ''
        orderPhone.value = ''
        orderNotes.value = ''
        router.push('/')
        fetchLessons()
      } catch (err) {
        showToast('Checkout error: ' + err.message, 'error')
      } finally {
        isSubmitting.value = false
      }
    }
    // Navigation toggle between Lessons and Cart
    const cartButtonText = computed(() => route.path === '/cart' ? 'Lessons' : 'Cart')
    const toggleCart = () => {
      router.push(route.path === '/' ? '/cart' : '/')
    }

    // Initial data fetch
    fetchLessons()

    // PROVIDE GLOBAL STATE TO ALL CHILD COMPONENTS
    provide('lessons', lessons)
    provide('cart', cart)
    provide('searchQuery', searchQuery)
    provide('sortBy', sortBy)
    provide('sortOrder', sortOrder)
    provide('orderName', orderName)
    provide('orderPhone', orderPhone)
    provide('orderNotes', orderNotes)
    provide('viewMode', viewMode)
    provide('addToBasket', addToBasket)
    provide('updateQty', updateQty)
    provide('removeFromBasket', removeFromBasket)
    provide('debouncedSearch', debouncedSearch)
    provide('checkout', checkout)
    provide('isValidOrder', isValidOrder)
    provide('cartTotal', cartTotal)
    provide('cartTotalPrice', cartTotalPrice)
    provide('getLessonName', getLessonName)
    provide('getLessonPrice', getLessonPrice)
    provide('apiUrl', apiUrl)
    provide('isSubmitting', isSubmitting)
    provide('showToast', showToast)

    return { cartTotal, toggleCart, toasts, route }
  }
}
</script>

<style>
/* Full viewport height with no overflow */
.vh-100 { height: 100vh; }
.overflow-hidden { overflow: hidden; }

/* Brand styling */
.brand-logo { height: 40px; width: auto; }
.custom-navbar { background: linear-gradient(90deg, #0d6efd, #0b5ed7); }
.brand-text { font-size: 1.25rem; letter-spacing: 0.5px; }

/* Toast notifications */
.toast-container { z-index: 2000; }
.animate-toast { animation: slideIn 0.3s ease-out; }
@keyframes slideIn {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
