import { computed, reactive } from 'vue'

export const resources = reactive({
  mana: 0n,
  runes: { 土: 0n, 气: 0n, 水: 0n, 火: 0n },
  money: 0n,
  airReturned: false,
})

export const manaCapacity = 300n
export const runeCapacity = 100n
export const manaPerSecond = 15n
export const bagCapacity = 10
export const bag = reactive([])
export const troughGoal = 150
export const ropeway = reactive({ water: 0, fireFound: false })
export const ropewayOpen = computed(() => ropeway.water === troughGoal)

export function meditate() {
  const space = manaCapacity - resources.mana
  resources.mana += space < manaPerSecond ? space : manaPerSecond
}

export function runeSpace(rune) {
  return runeCapacity - (resources.runes[rune] ?? 0n)
}

export function unloadBag() {
  const remaining = []
  for (const rune of bag) {
    if (runeSpace(rune) > 0n) resources.runes[rune]++
    else remaining.push(rune)
  }
  bag.splice(0, bag.length, ...remaining)
}

export function fillTrough(cargo, limit) {
  let moved = 0
  while (moved < limit && !ropewayOpen.value) {
    const at = cargo.indexOf('水')
    if (at === -1) break
    cargo.splice(at, 1)
    ropeway.water++
    moved++
  }
  return moved
}

export function collectRune(cargo, rune) {
  cargo.push(rune)
  if (rune === '火') ropeway.fireFound = true
}
