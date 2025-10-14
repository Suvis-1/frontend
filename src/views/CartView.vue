<template>
  <div class="p-3">
    <h2 class="mb-4">Shopping Basket</h2>
    <div v-if="Object.keys(cart).length === 0" class="alert alert-info">Your basket is empty. <button class="btn btn-primary btn-sm" @click="$router.push('/')">Back to Lessons</button></div>
    <div v-for="(qty, id) in cart" :key="id" class="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
      <span class="fw-bold">{{ getLessonName(id) }} - £{{ getLessonPrice(id) }}/hour</span>
      <div class="d-flex align-items-center">
        <button class="btn btn-sm btn-outline-secondary me-2" @click="updateQty(id, -1)">-</button>
        <span class="me-2">Qty: {{ qty }}</span>
        <button class="btn btn-sm btn-outline-secondary me-2" @click="updateQty(id, 1)">+</button>
        <button class="btn btn-sm btn-danger" @click="removeFromBasket(id)">Remove</button>
      </div>
    </div>
    <div v-if="Object.keys(cart).length > 0" class="mt-4 p-3 bg-light rounded">
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
import { inject } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const cart = inject('cart')
    const orderName = inject('orderName')
    const orderPhone = inject('orderPhone')
    const isValidOrder = inject('isValidOrder')
    const cartTotalPrice = inject('cartTotalPrice')
    const getLessonName = inject('getLessonName')
    const getLessonPrice = inject('getLessonPrice')
    const updateQty = inject('updateQty')
    const removeFromBasket = inject('removeFromBasket')
    const checkout = inject('checkout')

    return {
      cart, orderName, orderPhone, isValidOrder, cartTotalPrice, getLessonName, getLessonPrice, updateQty, removeFromBasket, checkout
    }
  }
}
</script>