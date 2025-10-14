<!-- src/views/CartView.vue -->
<template>
  <div class="p-3 d-flex flex-column h-100">
    <h2 class="mb-4">Shopping Basket</h2>
    <div v-if="Object.keys(cart).length === 0" class="alert alert-info">Your basket is empty. <button class="btn btn-primary btn-sm" @click="$router.push('/')">Back to Lessons</button></div>
    <div class="basket-items flex-grow-1 overflow-y-auto mb-3" style="max-height: calc(100vh - 200px);">
      <div v-for="(qty, id) in cart" :key="id" class="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
        <span class="fw-bold">{{ getLessonName(id) }} - £{{ getLessonPrice(id) }}/hour</span>
        <div class="d-flex align-items-center">
          <button class="btn btn-sm btn-outline-secondary me-2" @click="updateQty(id, -1)">-</button>
          <span class="me-2">Qty: {{ qty }}</span>
          <button class="btn btn-sm btn-outline-secondary me-2" @click="updateQty(id, 1)">+</button>
          <button class="btn btn-sm btn-danger" @click="removeFromBasket(id)">Remove</button>
        </div>
      </div>
    </div>
    <div v-if="Object.keys(cart).length > 0" class="checkout-section p-3 bg-light rounded position-sticky bottom-0" style="z-index: 1;">
      <div class="row align-items-end">
        <div class="col-6">
          <input v-model="orderName" placeholder="Name (letters only)" class="form-control mb-2">
          <input v-model="orderPhone" placeholder="Phone (numbers only)" class="form-control mb-2">
        </div>
        <div class="col-6 text-end">
          <div class="total mb-2 fw-bold fs-4 text-success">Total: £{{ cartTotalPrice.toFixed(2) }}</div>
          <button class="btn btn-success w-100" :disabled="!isValidOrder" @click="checkout">Checkout</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { inject } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const cart = inject('cart')
    const orderName = inject('orderName')
    const orderPhone = inject('orderPhone')
    const updateQty = inject('updateQty')
    const removeFromBasket = inject('removeFromBasket')
    const checkout = inject('checkout')
    const getLessonName = inject('getLessonName')
    const getLessonPrice = inject('getLessonPrice')
    const cartTotalPrice = inject('cartTotalPrice')

    const isValidOrder = computed(() => /^[a-zA-Z\s]+$/.test(orderName.value) && /^\d+$/.test(orderPhone.value))

    return {
      cart, orderName, orderPhone, updateQty, removeFromBasket, checkout, getLessonName, getLessonPrice, cartTotalPrice, isValidOrder
    }
  }
}
</script>

<style>
.basket-items { padding-right: 15px; }  
.checkout-section { border-top: 1px solid #ddd; }
</style>