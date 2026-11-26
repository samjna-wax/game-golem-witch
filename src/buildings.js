import { computed, reactive } from 'vue'
import { resources, manaCapacity } from './resources.js'

export const plots = reactive({
  plot1: { type: 'forge' }, plot2: { type: 'warehouse' }, plot3: null, plot4: null,
})
export const buildingLimit = 4
export const buildingCount = computed(() => Object.values(plots).filter(Boolean).length)
export const furnaceCost = { 土: 50n, 火: 10n, 水: 10n }
export const burnSeconds = 3
export const burnMana = 10n
export const canBuild = computed(() => buildingCount.value < buildingLimit &&
  Object.entries(furnaceCost).every(([rune, cost]) => resources.runes[rune] >= cost))

export function buildFurnace(id) {
  if (plots[id] !== null || !canBuild.value) return
  for (const [rune, cost] of Object.entries(furnaceCost)) resources.runes[rune] -= cost
  plots[id] = { type: 'furnace', fuel: 0, elapsed: 0 }
}

export function moveBuilding(from, to) {
  if (!plots[from] || plots[to] !== null) return
  plots[to] = plots[from]
  plots[from] = null
}

export function feedFurnace(id, cargo) {
  const index = cargo.indexOf('火')
  if (plots[id]?.type !== 'furnace' || index < 0) return false
  cargo.splice(index, 1)
  plots[id].fuel++
  return true
}

export function tickFurnaces() {
  for (const building of Object.values(plots)) {
    if (building?.type !== 'furnace' || !building.fuel) continue
    if (manaCapacity - resources.mana < burnMana) continue
    building.elapsed++
    if (building.elapsed === burnSeconds) {
      building.elapsed = 0
      building.fuel--
      resources.mana += burnMana
    }
  }
}
