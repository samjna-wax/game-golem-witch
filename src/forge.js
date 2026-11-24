import { computed, ref } from 'vue'
import { resources } from './resources.js'

export const golems = ref(0n)
export const golemCost = { mana: 1n, earth: 10n, water: 5n }

export const canForge = computed(() =>
  resources.mana >= golemCost.mana &&
  resources.runes.土 >= golemCost.earth &&
  resources.runes.水 >= golemCost.water
)

export function forgeGolem() {
  if (!canForge.value) return
  resources.mana -= golemCost.mana
  resources.runes.土 -= golemCost.earth
  resources.runes.水 -= golemCost.water
  golems.value++
}
