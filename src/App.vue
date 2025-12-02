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
          <!-- Cart button on lessons page — disabled when empty -->
          <button 
            v-if="route.path === '/'" 
            @click="toggleCart"
            class="btn btn-outline-light position-relative"
            :disabled="cartTotal === 0"
            :class="{ 'opacity-75': cartTotal === 0 }"
          >
            <i class="fas fa-shopping-cart me-1"></i>
            <span v-if="cartTotal === 0">
              Cart (empty)
            </span>
            <span v-else>
              Cart ({{ cartTotal }})
            </span>
          </button>

          <!-- Lessons button on cart page -->
          <button 
            v-else-if="route.path === '/cart'" 
            @click="toggleCart"
            class="btn btn-outline-light">
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
    const apiUrl = import.meta.env.VITE_API_URL

    // === GLOBAL STATE ===
    const allLessons = ref([])      // All lessons from server (master data)
    const filteredLessons = ref([]) // Lessons to display (references to allLessons objects)
    const cart = reactive({})
    const searchQuery = ref('')
    const sortBy = ref('topic')
    const sortOrder = ref('asc')
    const orderName = ref('')
    const orderPhone = ref('')
    const orderNotes = ref('')
    const viewMode = ref('card')
    const isSubmitting = ref(false)

    // Toast system
    const toasts = ref([])
    const showToast = (message, type = 'success') => {
      const id = Date.now()
      toasts.value.push({ id, message, type })
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 3000)
    }

    // Update all lessons from server data
    const updateAllLessons = (newData) => {
      const newMap = new Map(newData.map(l => [l._id, l]))

      // Update existing lessons in allLessons
      allLessons.value.forEach(lesson => {
        const updated = newMap.get(lesson._id)
        if (updated) {
          // Preserve cart quantity and existing totalSpace
          const cartQty = cart[lesson._id] || 0
          // Update all properties from server
          Object.assign(lesson, updated)
          // Keep the original totalSpace if it exists, otherwise use server space
          lesson.totalSpace = lesson.totalSpace || updated.space
          // Calculate available space: server space minus cart quantity
          lesson.space = Math.max(0, updated.space - cartQty)
          newMap.delete(lesson._id)
        }
      })

      // Add new lessons that aren't already in our list
      newMap.forEach(newLesson => {
        const cartQty = cart[newLesson._id] || 0
        allLessons.value.push({
          ...newLesson,
          totalSpace: newLesson.space,
          space: Math.max(0, newLesson.space - cartQty)
        })
      })
    }

    // Update filtered lessons based on search results
    const updateFilteredLessons = (searchResults) => {
      if (searchResults && searchResults.length > 0) {
        const resultIds = new Set(searchResults.map(l => l._id))
        // Get references to the same objects in allLessons
        filteredLessons.value = allLessons.value.filter(lesson => 
          resultIds.has(lesson._id)
        )
      } else {
        // If no search results (or empty search), show all lessons
        filteredLessons.value = [...allLessons.value]
      }
    }

    // Fetch all lessons
    const fetchLessons = async () => {
      try {
        const res = await fetch(`${apiUrl}/lessons`)
        const data = await res.json()
        updateAllLessons(data)
        // Show all lessons initially
        filteredLessons.value = [...allLessons.value]
      } catch (err) {
        showToast('Error fetching lessons', 'error')
      }
    }

    // Debounced search
    let searchTimeout
    const debouncedSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(async () => {
        try {
          if (searchQuery.value.trim()) {
            const res = await fetch(`${apiUrl}/search?q=${encodeURIComponent(searchQuery.value)}`)
            const data = await res.json()
            // Update all lessons with fresh data from server
            updateAllLessons(data)
            // Update filtered view with search results
            updateFilteredLessons(data)
          } else {
            // If search is cleared, show all lessons
            fetchLessons()
          }
        } catch (err) {
          showToast('Search failed', 'error')
        }
      }, 300)
    }

    // === CART LOGIC ===
    const addToBasket = (id) => {
      const lesson = allLessons.value.find(l => l._id === id)
      if (lesson && lesson.space > 0) {
        cart[id] = (cart[id] || 0) + 1
        lesson.space -= 1
        // Since filteredLessons contains references to the same objects,
        // the space update automatically reflects in filteredLessons
      }
    }

    const updateQty = (id, change) => {
      const lesson = allLessons.value.find(l => l._id === id)
      const currentQty = cart[id] || 0
      const newQty = currentQty + change
      
      // Validate the change
      if (newQty < 0) return // Can't go below 0
      if (change > 0 && change > lesson.space) return // Not enough available
      
      cart[id] = newQty
      lesson.space -= change
      
      if (newQty === 0) {
        delete cart[id]
      }
    }

    const removeFromBasket = (id) => {
      const lesson = allLessons.value.find(l => l._id === id)
      if (cart[id]) {
        const qty = cart[id]
        lesson.space += qty
        delete cart[id]
      }
    }

    // === ORDER & COMPUTED ===
    const isValidOrder = computed(() => {
      const nameValid = /^[A-Za-z\s]+$/.test(orderName.value)
      const phoneValid = /^0\d{10}$/.test(orderPhone.value)
      return nameValid && phoneValid
    })

    const cartTotal = computed(() => Object.values(cart).reduce((a, b) => a + b, 0))
    const cartTotalPrice = computed(() =>
      Object.entries(cart).reduce((sum, [id, qty]) => sum + qty * getLessonPrice(id), 0)
    )
    
    const getLessonName = (id) => {
      const l = allLessons.value.find(l => l._id === id)
      return l ? `${l.topic} in ${l.location}` : 'Loading...'
    }
    
    const getLessonPrice = (id) => {
      const l = allLessons.value.find(l => l._id === id)
      return l ? l.price : 0
    }

    // === CHECKOUT ===
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
        const res = await fetch(`${apiUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        })

        if (!res.ok) throw new Error((await res.json()).error || 'Order failed')

        // Refresh lessons to get updated availability
        await fetchLessons()
        showToast('Order submitted successfully!', 'success')
        
        // Clear cart and form
        Object.keys(cart).forEach(k => delete cart[k])
        orderName.value = orderPhone.value = orderNotes.value = ''
        
        // Navigate back to lessons
        router.push('/')
      } catch (err) {
        showToast(`Checkout failed: ${err.message}`, 'error')
      } finally {
        isSubmitting.value = false
      }
    }

    const toggleCart = () => {
      router.push(route.path === '/' ? '/cart' : '/')
    }

    // Initial load
    fetchLessons()

    // === PROVIDE TO CHILDREN ===
    // Provide filteredLessons for display in LessonsView
    provide('lessons', filteredLessons)
    // Provide allLessons for cart operations
    provide('allLessons', allLessons)
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