import { computed } from 'vue'
import { resources } from './resources.js'

import { fleet, newGolem } from './golems.js'

export const golems = computed(() => fleet.length)
export const golemCost = { mana: 20n, earth: 10n, water: 5n }

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
  newGolem()
}
