<!-- src/App.vue -->
<template>
  <div class="container-fluid vh-100 d-flex flex-column overflow-hidden">
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" href="/frontend/"><i class="fas fa-book me-2"></i>The Best After-School Club</a>
        <div class="navbar-nav ms-auto">
          <button class="btn btn-outline-light" @click="toggleCart">
            <i class="fas fa-shopping-cart me-1"></i>{{ cartButtonText }} ({{ cartTotal }})
          </button>
        </div>
      </div>
    </nav>

    <!-- Router View for Lessons or Cart -->
    <router-view />
  </div>
</template>

<script>
import { ref, reactive, provide, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const route = useRoute()
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

    const lessons = ref([])
    const cart = reactive({})
    const searchQuery = ref('')
    const sortBy = ref('topic')
    const sortOrder = ref('asc')
    const orderName = ref('')
    const orderPhone = ref('')
    const viewMode = ref('card')  // New: 'card' or 'list'

    // Fetch lessons
    const fetchLessons = async () => {
      try {
        const res = await fetch(`${apiUrl}/lessons`)
        lessons.value = await res.json()
      } catch (err) {
        console.error('Fetch lessons error:', err)
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

    // Sort lessons
    const filteredLessons = computed(() => {
      return [...lessons.value].sort((a, b) => {
        let valA = a[sortBy.value], valB = b[sortBy.value]
        if (['price', 'space'].includes(sortBy.value)) {
          return sortOrder.value === 'asc' ? valA - valB : valB - valA
        }
        return sortOrder.value === 'asc' ? valA.toString().localeCompare(valB.toString()) : valB.toString().localeCompare(valA.toString())
      })
    })

    const sortLessons = () => {
      // Re-compute
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

    // Checkout
    const isValidOrder = computed(() => /^[a-zA-Z\s]+$/.test(orderName.value) && /^\d+$/.test(orderPhone.value))
    const cartTotal = computed(() => Object.values(cart).reduce((a, b) => a + b, 0))
    const cartTotalPrice = computed(() => Object.entries(cart).reduce((sum, [id, qty]) => sum + qty * getLessonPrice(id), 0))
    const getLessonName = (id) => lessons.value.find(l => l._id === id)?.topic + ' in ' + lessons.value.find(l => l._id === id)?.location
    const getLessonPrice = (id) => lessons.value.find(l => l._id === id)?.price
    const getIcon = (topic) => {
      const icons = { Maths: 'fa-calculator', English: 'fa-book', Science: 'fa-flask' }
      return `fas ${icons[topic] || 'fa-question'}`
    }

    const checkout = async () => {
      const order = { name: orderName.value, phone: orderPhone.value, lessons: Object.entries(cart).map(([id, qty]) => ({ id, qty })) }
      try {
        const postRes = await fetch(`${apiUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        })
        if (postRes.ok) {
          for (const [id, qty] of Object.entries(cart)) {
            const lesson = lessons.value.find(l => l._id === id)
            await fetch(`${apiUrl}/lessons/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ space: lesson.space })
            })
          }
          alert('Order submitted successfully!')
          Object.keys(cart).forEach(key => delete cart[key])
          orderName.value = ''
          orderPhone.value = ''
          router.push('/')  // Back to lessons
          fetchLessons()
        }
      } catch (err) {
        console.error('Checkout error:', err)
      }
    }

    const cartButtonText = computed(() => route.path === '/cart' ? 'Lessons' : 'Cart')
    const toggleCart = () => {
      router.push(route.path === '/' ? '/cart' : '/')
    }

    fetchLessons()

    // Provide shared state to child views
    provide('lessons', lessons)
    provide('cart', cart)
    provide('searchQuery', searchQuery)
    provide('sortBy', sortBy)
    provide('sortOrder', sortOrder)
    provide('orderName', orderName)
    provide('orderPhone', orderPhone)
    provide('viewMode', viewMode)  // New
    provide('addToBasket', addToBasket)
    provide('updateQty', updateQty)
    provide('removeFromBasket', removeFromBasket)
    provide('debouncedSearch', debouncedSearch)
    provide('sortLessons', sortLessons)
    provide('checkout', checkout)
    provide('isValidOrder', isValidOrder)
    provide('cartTotal', cartTotal)
    provide('cartTotalPrice', cartTotalPrice)
    provide('getLessonName', getLessonName)
    provide('getLessonPrice', getLessonPrice)
    provide('getIcon', getIcon)
    provide('apiUrl', apiUrl)

    return {
      cartTotal,
      cartButtonText,
      toggleCart
    }
  }
}
</script>

<style>
.vh-100 { height: 100vh; }
.overflow-hidden { overflow: hidden; }
.product-card { height: 200px; display: flex; flex-direction: column; justify-content: space-between; }
.add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.modal { z-index: 1050; }
</style>