<script setup>
import { canForge, forgeGolem, golemCost, golems } from './forge.js'
import {
  resources, manaPerSecond, bag, bagCapacity, unloadBag, collectRune,
  ropeway, ropewayOpen, troughGoal, fillTrough,
} from './resources.js'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { places, arrival, canTravel } from './map.js'
import NearbyMap from './NearbyMap.vue'

import RuneBoard from './RuneBoard.vue'
import { fleet, step } from './golems.js'

const props = defineProps({ openEditor: Boolean })
const editing = ref(props.openEditor)
const meditating = ref(false)
const bagContents = computed(() => Object.keys(resources.runes)
  .map(rune => [rune, bag.filter(item => item === rune).length])
  .filter(([, count]) => count)
  .map(([rune, count]) => rune + ' ' + count).join('　'))
const troughPayment = computed(() => Math.min(
  bag.filter(rune => rune === '水').length, troughGoal - ropeway.water,
))
const troughHint = computed(() => {
  if (ropewayOpen.value) return '水轮推着矿斗越过山谷，索道已通往旧窑场。'
  if (ropeway.water >= 113) return '最后一段索绳绷紧了，对岸窑壁里透出红光。'
  if (ropeway.water >= 75) return '水流回到旧河道，矿斗滑过了半程。'
  if (ropeway.water >= 38) return '水轮缓缓转动，第一只矿斗已经离站。'
  if (ropeway.water > 0) return '水轮转过一齿。继续从庭院运水，冲开淤塞的引水槽。'
  return '对岸的窑壁泛着红光。从庭院运来水符文注入引水槽，就能让索道重新运转。'
})
let firstMachine = 0
let clock
onMounted(() => {
  clock = setInterval(() => {
    if (meditating.value) resources.mana += manaPerSecond
    // Rotate the first turn so that a low reserve is shared across the fleet.
    for (let i = 0; i < fleet.length; i++) {
      const g = fleet[(firstMachine + i) % fleet.length]
      if (g.running) step(g)
    }
    if (fleet.length) firstMachine = (firstMachine + 1) % fleet.length
  }, 1000)
})
onUnmounted(() => clearInterval(clock))

const location = ref(props.openEditor ? 'workshop' : 'room')
const current = computed(() => places.find(place => place.id === location.value))

function travel(destination) {
  if (!canTravel(location.value, destination)) return
  meditating.value = false
  location.value = arrival(destination)
}

function gather() {
  if (current.value.rune && bag.length < bagCapacity) collectRune(bag, current.value.rune)
}

</script>

<template>
  <main v-if="editing" class="room"><RuneBoard :return-label="location === 'workshop' ? '返回工坊' : '返回房间'" @close="editing = false" /></main>
  <main v-else class="room" aria-labelledby="room-title">
    <div class="scene">
      <img :src="current.image" alt="">
      <div class="scene-caption">
        <h1 id="room-title">{{ current.title }}</h1>
        <p>{{ current.feature }}</p>
      </div>
    </div>
    <NearbyMap :location="location" @travel="travel" />
    <div class="workbench">
      <section class="resources" aria-label="全局资源">
        <div class="balance">
          <span id="mana-label">魔力</span>
          <output aria-labelledby="mana-label">{{ resources.mana }}</output>
        </div>
        <div class="runes" role="group" aria-labelledby="rune-label">
          <span id="rune-label">工坊库存</span>
          <dl>
            <div v-for="(count, element) in resources.runes" :key="element">
              <dt>{{ element }}</dt>
              <dd>{{ count }}</dd>
            </div>
          </dl>
        </div>
        <div class="balance">
          <span id="money-label">金钱</span>
          <output aria-labelledby="money-label">{{ resources.money }}</output>
        </div>
      </section>
      <div class="pack">
        <strong>随身背包 {{ bag.length }}/{{ bagCapacity }}</strong>
        <span>{{ bagContents || '空' }}</span>
        <button v-if="location === 'workshop' && bag.length" @click="unloadBag">全部存入工坊</button>
      </div>
      <section v-if="location === 'workshop'" class="forge" aria-label="魔力锻炉">
        <div class="recipe">
          <p id="forge-cost">每具消耗：魔力 {{ golemCost.mana }} · 土符文 {{ golemCost.earth }} · 水符文 {{ golemCost.water }}</p>
          <output aria-label="已有哥雷姆">已有 {{ golems }} 具哥雷姆</output>
        </div>
        <button type="button" class="gather" :disabled="!canForge" aria-describedby="forge-cost" @click="forgeGolem">
          锻造哥雷姆
        </button>

      </section>
      <div v-if="location === 'room'" class="station">
        <button class="gather" @click="meditating = !meditating">{{ meditating ? '结束冥想' : '开始冥想' }}</button>
        <small>每秒 +{{ manaPerSecond }} 魔力 · 离开房间结束冥想</small>
      </div>
      <button v-if="golems && (location === 'workshop' || location === 'room')" @click="editing = true">打开符文板</button>
      <button v-if="current.action" :disabled="bag.length >= bagCapacity" type="button" class="gather" @click="gather">
        <span>{{ current.action }}</span>
        <span class="yield">{{ bag.length >= bagCapacity ? '背包已满' : '+1' }}</span>
      </button>
      <small v-if="current.rune && bag.length">带回工坊可将随身符文存入库存。</small>
      <section v-if="location === 'mine'" class="station trough">
        <div class="board-head"><h2>索道水槽</h2><output>{{ ropeway.water }} / {{ troughGoal }}</output></div>
        <progress aria-label="水槽进度" :value="ropeway.water" :max="troughGoal"></progress>
        <p>{{ troughHint }}</p>
        <small v-if="!ropewayOpen">哥雷姆在此使用交互点 2，每次投入一枚水。</small>
        <button v-if="!ropewayOpen" class="gather" :disabled="!troughPayment" @click="fillTrough(bag, troughPayment)">
          投入背包中的水<span v-if="troughPayment">× {{ troughPayment }}</span>
        </button>
      </section>
      <p v-if="location === 'kiln' && ropeway.fireFound" class="discovery" role="status">已解锁火符文 · 旧窑场可持续采集</p>
    </div>
  </main>
</template>
