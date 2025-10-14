<template>
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
    <div class="col-md-9 p-3 d-flex flex-column">
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
</template>

<script>
import { inject } from 'vue'

export default {
  setup() {
    const lessons = inject('lessons')
    const cart = inject('cart')
    const searchQuery = inject('searchQuery')
    const sortBy = inject('sortBy')
    const sortOrder = inject('sortOrder')
    const filteredLessons = inject('filteredLessons')
    const debouncedSearch = inject('debouncedSearch')
    const sortLessons = inject('sortLessons')
    const addToBasket = inject('addToBasket')
    const getIcon = inject('getIcon')

    return {
      lessons, cart, searchQuery, sortBy, sortOrder, filteredLessons, debouncedSearch, sortLessons, addToBasket, getIcon
    }
  }
}
</script>

<style>
.product-card { height: 200px; display: flex; flex-direction: column; justify-content: space-between; }
.add-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>