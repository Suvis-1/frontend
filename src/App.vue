<template>
  <div class="container-fluid vh-100 d-flex flex-column overflow-hidden">
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" href="#"><i class="fas fa-book me-2"></i>The Best After-School Club</a>
        <div class="navbar-nav ms-auto">
          <a class="nav-link" href="#"><i class="fas fa-user"></i></a>
          <button class="btn btn-outline-light" @click="showCart = !showCart">
            <i class="fas fa-shopping-cart me-1"></i>Cart ({{ cartTotal }})
          </button>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="d-flex flex-grow-1 overflow-hidden">
      <!-- Left Sidebar -->
      <div class="col-md-3 p-3 bg-light border-end" style="height: calc(100vh - 56px); overflow-y: auto;">
        <h5>Sort By</h5>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="sortBy" id="subject" value="topic" v-model="sortBy" @change="sortLessons">
          <label class="form-check-label" for="subject">Subject</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="sortBy" id="location" value="location" v-model="sortBy" @change="sortLessons">
          <label class="form-check-label" for="location">Location</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="sortBy" id="price" value="price" v-model="sortBy" @change="sortLessons">
          <label class="form-check-label" for="price">Price</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="sortBy" id="available" value="space" v-model="sortBy" @change="sortLessons">
          <label class="form-check-label" for="available">Available</label>
        </div>
        <h5 class="mt-3">Order</h5>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="order" id="asc" value="asc" v-model="sortOrder" @change="sortLessons">
          <label class="form-check-label" for="asc">Ascending</label>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="radio" name="order" id="desc" value="desc" v-model="sortOrder" @change="sortLessons">
          <label class="form-check-label" for="desc">Descending</label>
        </div>
      </div>

      <!-- Products Section -->
      <div class="col-md-9 p-3 d-flex flex-column" style="height: calc(100vh - 56px); overflow: hidden;">
        <input v-model="searchQuery" @input="debouncedSearch" placeholder="Search subjects or locations..." class="form-control mb-3">
        <div class="products-grid flex-grow-1 overflow-y-auto" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
          <div v-for="lesson in filteredLessons" :key="lesson._id" class="product-card bg-white p-3 border rounded shadow-sm">
            <div class="text-center mb-2">
              <i :class="getIcon(lesson.topic)" style="font-size: 2em; color: #007bff;"></i>
            </div>
            <h6 class="product-name mb-2">{{ lesson.topic }} in {{ lesson.location }}</h6>
            <div class="product-price mb-2 fw-bold text-success">£{{ lesson.price }}/hour</div>
            <div class="availability mb-2 text-muted">Availability: {{ lesson.space }} slots</div>
            <div v-if="cart[lesson._id] > 0" class="mb-2 text-info">In basket: {{ cart[lesson._id] }}</div>
            <button class="add-btn btn btn-primary w-100" @click="addToBasket(lesson._id)" :disabled="lesson.space === 0">
              {{ lesson.space === 0 ? 'Out of Stock' : 'Add to Basket' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Modal -->
    <div v-if="showCart" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Shopping Basket</h5>
            <button type="button" class="btn-close" @click="showCart = false"></button>
          </div>
          <div class="modal-body">
            <div v-if="Object.keys(cart).length === 0" class="alert alert-info">Your basket is empty.</div>
            <div v-for="(qty, id) in cart" :key="id" class="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
              <span>{{ getLessonName(id) }} - £{{ getLessonPrice(id) }}/hour</span>
              <div>
                <button class="btn btn-sm btn-outline-secondary me-1" @click="updateQty(id, -1)">-</button>
                <span class="mx-2">Qty: {{ qty }}</span>
                <button class="btn btn-sm btn-outline-secondary me-2" @click="updateQty(id, 1)">+</button>
                <button class="btn btn-sm btn-danger" @click="removeFromBasket(id)">Remove</button>
              </div>
            </div>
            <div v-if="Object.keys(cart).length > 0" class="mt-3">
              <div class="row">
                <div class="col-6">
                  <input v-model="orderName" placeholder="Name (letters only)" class="form-control mb-2">
                  <input v-model="orderPhone" placeholder="Phone (numbers only)" class="form-control mb-2">
                </div>
                <div class="col-6 d-flex align-items-end">
                  <div class="total me-2 fw-bold fs-5">Total: £{{ cartTotalPrice }}</div>
                  <button class="btn btn-success ms-auto" :disabled="!isValidOrder" @click="checkout">Checkout</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'

export default {
  setup() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'  // Env var for Render

    const lessons = ref([])
    const cart = reactive({})
    const searchQuery = ref('')
    const sortBy = ref('topic')
    const sortOrder = ref('asc')
    const showCart = ref(false)
    const orderName = ref('')
    const orderPhone = ref('')

    // Fetch lessons
    const fetchLessons = async () => {
      try {
        const res = await fetch(`${apiUrl}/lessons`)
        lessons.value = await res.json()
      } catch (err) {
        console.error('Fetch lessons error:', err)
      }
    }

    // Debounced search (as you type, back-end)
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
      // Trigger re-sort
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
          // Update spaces
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
          showCart.value = false
          fetchLessons()  // Refresh
        }
      } catch (err) {
        console.error('Checkout error:', err)
      }
    }

    onMounted(fetchLessons)

    return {
      lessons, cart, searchQuery, sortBy, sortOrder, showCart, orderName, orderPhone,
      filteredLessons, debouncedSearch, sortLessons, addToBasket, updateQty, removeFromBasket,
      isValidOrder, cartTotal, cartTotalPrice, getLessonName, getLessonPrice, getIcon, checkout
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