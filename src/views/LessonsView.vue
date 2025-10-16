<!-- src/views/LessonsView.vue -->
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
                 alt="Lesson icon" @error="onImgError">
            <div class="flex-grow-1">
              <h6 class="mb-1">{{ lesson.topic }} in {{ lesson.location }}</h6>
              <div class="fw-bold text-success">£{{ lesson.price }}/hour</div>
            </div>
          </div>
          <div class="text-muted">Availability: {{ lesson.space }} slots</div>
          <div v-if="cart[lesson._id] > 0" class="text-info">In basket: {{ cart[lesson._id] }}</div>
          <button class="btn btn-primary w-100 mt-2" 
                  @click="addToBasket(lesson._id)" 
                  :disabled="lesson.space === 0">
            {{ lesson.space === 0 ? 'Out of Stock' : 'Add to Basket' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue'
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
    const apiUrl = inject('apiUrl')

    // --- Persist preferences in localStorage ---
    const persistPreferences = () => {
      localStorage.setItem('lessonPrefs', JSON.stringify({
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        viewMode: viewMode.value
      }))
    }

    onMounted(() => {
      const saved = localStorage.getItem('lessonPrefs')
      if (saved) {
        const prefs = JSON.parse(saved)
        sortBy.value = prefs.sortBy || 'topic'
        sortOrder.value = prefs.sortOrder || 'asc'
        viewMode.value = prefs.viewMode || 'card'
      }
    })

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

    // --- Safe fallback image handler ---
    const onImgError = (e) => {
      if (!e.target.dataset.fallback) {
        e.target.src = `${apiUrl}/images/default.png`
        e.target.dataset.fallback = true
      }
    }

    return {
      lessons, cart, searchQuery, sortBy, sortOrder, viewMode,
      debouncedSearch, addToBasket, filteredLessons, viewModeClass,
      onImgError, apiUrl, persistPreferences
    }
  }
}
</script>

<style>
.products-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.product-item { display: flex; flex-direction: column; }
.add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
