<template>
  <div class="p-3 d-flex flex-column h-100">
    <h2 class="mb-4">Shopping Basket</h2>

    <!-- Empty basket -->
    <div v-if="Object.keys(cart).length === 0" class="alert alert-info">
      Your basket is empty.
      <button class="btn btn-primary btn-sm" @click="$router.push('/')">Back to Lessons</button>
    </div>

    <!-- Basket items -->
    <div class="basket-items flex-grow-1 overflow-y-auto mb-3" style="max-height: calc(100vh - 250px);">
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

    <!-- Checkout section -->
    <div v-if="Object.keys(cart).length > 0" class="checkout-section p-3 bg-light rounded position-sticky bottom-0" style="z-index: 1;">
      <div class="row">
        <div class="col-6">
          <input v-model="orderName" placeholder="Name (letters only)" class="form-control mb-2">
          <small v-if="orderName && !/^[A-Za-z\s]+$/.test(orderName)" class="text-danger">Name must contain letters only</small>

          <input v-model="orderPhone" placeholder="Phone (UK format: 0XXXXXXXXXX)" class="form-control mb-2">
          <small v-if="orderPhone && !/^0\d{10}$/.test(orderPhone)" class="text-danger">Phone must start with 0 and be 11 digits</small>

          <textarea v-model="orderNotes" placeholder="Any notes (max 250 chars)" maxlength="250" class="form-control mb-2"></textarea>
          <small v-if="orderNotes && orderNotes.length > 250" class="text-danger">Notes must be 250 characters or fewer</small>
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
    const orderNotes = inject('orderNotes')
    const updateQty = inject('updateQty')
    const removeFromBasket = inject('removeFromBasket')
    const checkout = inject('checkout')
    const getLessonName = inject('getLessonName')
    const getLessonPrice = inject('getLessonPrice')
    const cartTotalPrice = inject('cartTotalPrice')

    const isValidOrder = computed(() => {
      const nameValid = /^[A-Za-z\s]+$/.test(orderName.value)
      const phoneValid = /^0\d{10}$/.test(orderPhone.value)
      const notesValid = !orderNotes.value || orderNotes.value.length <= 250
      return nameValid && phoneValid && notesValid
    })

    return {
      cart, orderName, orderPhone, orderNotes,
      updateQty, removeFromBasket, checkout,
      getLessonName, getLessonPrice, cartTotalPrice,
      isValidOrder
    }
  }
}
</script>

<style>
.basket-items { padding-right: 15px; }  
.checkout-section { border-top: 1px solid #ddd; }
</style>
