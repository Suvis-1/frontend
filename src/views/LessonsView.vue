<template>
  <div class="d-flex flex-grow-1 overflow-hidden">
    <!-- Left Sidebar -->
    <div class="col-md-3 p-3 bg-light border-end" style="height: calc(100vh - 56px); overflow-y: auto;">
      <h5>Sort By</h5>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="sortBy" id="subject" value="topic"
               v-model="sortBy" @change="persistPreferences" aria-label="Sort lessons by subject">
        <label class="form-check-label" for="subject">Subject</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="sortBy" id="location" value="location"
               v-model="sortBy" @change="persistPreferences" aria-label="Sort lessons by location">
        <label class="form-check-label" for="location">Location</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="sortBy" id="price" value="price"
               v-model="sortBy" @change="persistPreferences" aria-label="Sort lessons by price">
        <label class="form-check-label" for="price">Price</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="sortBy" id="available" value="space"
               v-model="sortBy" @change="persistPreferences" aria-label="Sort lessons by availability">
        <label class="form-check-label" for="available">Available</label>
      </div>

      <h5 class="mt-3">Order</h5>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="order" id="asc" value="asc"
               v-model="sortOrder" @change="persistPreferences" aria-label="Sort ascending">
        <label class="form-check-label" for="asc">Ascending</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="order" id="desc" value="desc"
               v-model="sortOrder" @change="persistPreferences" aria-label="Sort descending">
        <label class="form-check-label" for="desc">Descending</label>
      </div>

      <h5 class="mt-3">View</h5>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="viewMode" id="card" value="card"
               v-model="viewMode" @change="persistPreferences" aria-label="Card view">
        <label class="form-check-label" for="card">Card</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" name="viewMode" id="list" value="list"
               v-model="viewMode" @change="persistPreferences" aria-label="List view">
        <label class="form-check-label" for="list">List</label>
      </div>
    </div>

    <!-- Products Section -->
    <div class="col-md-9 p-3 d-flex flex-column">
      <input v-model="searchQuery" @input="debouncedSearch" 
             placeholder="Search subjects or locations..." class="form-control mb-3">

      <div v-if="filteredLessons.length === 0" class="text-center text-muted mt-5">
        No lessons found.
      </div>

      <div v-else :class="viewModeClass" class="flex-grow-1 overflow-y-auto">
        <div v-for="lesson in filteredLessons" :key="lesson._id" 
             class="product-item mb-3 p-3 border rounded shadow-sm">
          <div class="d-flex align-items-center mb-2">
            <img :src="`${apiUrl}/images/${lesson.icon}`"
                 style="width: 50px; height: 50px; object-fit: cover; margin-right: 15px;"
                 :alt="`${lesson.topic} lesson icon`"
                 @error="onImgError">
            <div class="flex-grow-1">
              <h6 class="mb-1">{{ lesson.topic }} in {{ lesson.location }}</h6>
              <div class="fw-bold text-success">£{{ lesson.price }}/hour</div>
            </div>
          </div>

          <div class="text-muted">
            Availability: {{ lesson.totalSpace - (cart[lesson._id] || 0) }} slots
          </div>

          <!-- If not in cart yet -->
          <button v-if="!cart[lesson._id]" 
                  class="btn btn-primary w-100 mt-2 add-btn"
                  @click="addToBasket(lesson._id)" 
                  :disabled="lesson.totalSpace === 0">
            {{ lesson.totalSpace === 0 ? 'Out of Stock' : 'Add to Basket' }}
          </button>

          <!-- If already in cart: show quantity control -->
          <div v-else class="input-group mt-2">
            <button class="btn btn-primary"
                    :disabled="cart[lesson._id] <= 1"
                    @click="updateQty(lesson._id, -1)">−</button>

            <input type="number" class="form-control text-center qty-input"
                   v-model.number="cart[lesson._id]"
                   @blur="validateQty(lesson._id, lesson.totalSpace)" 
                   min="1" :max="lesson.totalSpace" />

            <button class="btn btn-primary"
                    :disabled="cart[lesson._id] >= lesson.totalSpace"
                    @click="updateQty(lesson._id, 1)">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, watch } from 'vue'
import { inject } from 'vue'

export default {
  setup() {
    const lessons = inject('lessons')
    const cart = inject('cart')
    const searchQuery = inject('searchQuery')
    const sortBy = inject('sortBy')
    const sortOrder = inject('sortOrder')
    const viewMode = inject('viewMode')
    const debouncedSearch = inject('debouncedSearch')
    const addToBasket = inject('addToBasket')
    const updateQty = inject('updateQty')
    const apiUrl = inject('apiUrl')

    const persistPreferences = () => {
      localStorage.setItem('lessonPrefs', JSON.stringify({
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        viewMode: viewMode.value
      }))
    }

    onMounted(() => {
      const savedPrefs = localStorage.getItem('lessonPrefs')
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs)
        sortBy.value = prefs.sortBy || 'topic'
        sortOrder.value = prefs.sortOrder || 'asc'
        viewMode.value = prefs.viewMode || 'card'
      }

      const savedCart = localStorage.getItem('lessonCart')
      if (savedCart) {
        try {
          const { data, timestamp } = JSON.parse(savedCart)
          const now = Date.now()
          const oneHour = 60 * 60 * 1000
          if (now - timestamp < oneHour) {
            Object.assign(cart, data)
          } else {
            localStorage.removeItem('lessonCart')
          }
        } catch (err) {
          localStorage.removeItem('lessonCart')
        }
      }
    })

    // Save cart on change
    watch(cart, (newCart) => {
      const payload = {
        data: newCart,
        timestamp: Date.now()
      }
      localStorage.setItem('lessonCart', JSON.stringify(payload))
    }, { deep: true })

    const filteredLessons = computed(() => {
      return [...lessons.value].sort((a, b) => {
        let valA = a[sortBy.value], valB = b[sortBy.value]
        if (['price', 'space'].includes(sortBy.value)) {
          return sortOrder.value === 'asc' ? valA - valB : valB - valA
        }
        return sortOrder.value === 'asc'
          ? valA.toString().localeCompare(valB.toString())
          : valB.toString().localeCompare(valA.toString())
      })
    })

    const viewModeClass = computed(() =>
      viewMode.value === 'card' ? 'd-grid gap-3 products-grid' : 'd-flex flex-column'
    )

    const onImgError = (e) => {
      if (!e.target.dataset.fallback) {
        e.target.src = `${apiUrl}/images/default.png`
        e.target.dataset.fallback = true
      }
    }

        const validateQty = (id, totalSpace) => {
      let qty = cart[id]
      if (!qty || qty < 1) {
        cart[id] = 1
      } else if (qty > totalSpace) {
        cart[id] = totalSpace
      }
    }

    return {
      lessons,
      cart,
      searchQuery,
      sortBy,
      sortOrder,
      viewMode,
      debouncedSearch,
      addToBasket,
      updateQty,
      validateQty,
      filteredLessons,
      viewModeClass,
      onImgError,
      apiUrl,
      persistPreferences
    }
  }
}
</script>


<style>
.products-grid { 
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
}
.product-item { 
  display: flex; 
  flex-direction: column; 
}
.add-btn:disabled { 
  opacity: 0.6; 
  cursor: not-allowed; 
}

/* Quantity input styling */
.input-group .form-control {
  padding: 0.25rem;
  height: 38px;
}

/* Hide native number input arrows */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  appearance: textfield; 
  -moz-appearance: textfield;
}

/* Match +/− buttons to Add to Basket colour */
.input-group .btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
}
.input-group .btn-primary:disabled {
  background-color: #6c757d; /* greyed out */
  border-color: #6c757d;
}

/* Navbar background with subtle gradient */
.custom-navbar { 
  background: linear-gradient(90deg, #0d6efd, #0b5ed7);
}

/* Logo sizing */
.brand-logo { 
  height: 40px; 
  width: auto; 
}

/* Brand text styling */
.brand-text { 
  font-size: 1.4rem; 
  letter-spacing: 0.2px; 
}

/* Hover effect for brand */
.navbar-brand:hover .brand-text { 
  color: #ffc107; 
}
</style>
