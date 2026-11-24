import { reactive } from 'vue'

export const resources = reactive({
  mana: 0n,
  runes: { 土: 0n, 气: 0n, 水: 0n, 火: 0n },
  money: 0n,
})
