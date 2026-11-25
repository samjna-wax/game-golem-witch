<script setup>
import { canForge, forgeGolem, golemCost, golems } from './forge.js'
import {
  resources, manaPerSecond, meditate, runeCapacity, runeSpace, bag, bagCapacity, unloadBag, collectRune,
  ropeway, ropewayOpen, troughGoal, fillTrough,
} from './resources.js'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { placeById, canTravel } from './map.js'
import NearbyMap from './NearbyMap.vue'

import { plots, tickFurnaces } from './buildings.js'
import WorkshopPlot from './WorkshopPlot.vue'
import ManaMeter from './ManaMeter.vue'
import RuneBoard from './RuneBoard.vue'
import { fleet, step } from './golems.js'

const props = defineProps({ openEditor: Boolean, workshopDemo: Boolean })
const tab = ref(props.openEditor ? '哥雷姆' : '地图')
function openTab(name) {
  tab.value = name
  window.scrollTo(0, 0)
}
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
    if (meditating.value) meditate()
    tickFurnaces()
    // Rotate the first turn so that a low reserve is shared across the fleet.
    for (let i = 0; i < fleet.length; i++) {
      const g = fleet[(firstMachine + i) % fleet.length]
      if (g.running) step(g)
    }
    if (fleet.length) firstMachine = (firstMachine + 1) % fleet.length
  }, 1000)
})
onUnmounted(() => clearInterval(clock))

const location = ref(props.openEditor || props.workshopDemo ? 'workshop' : 'room')
const current = computed(() => placeById[location.value])

function travel(destination) {
  if (!canTravel(location.value, destination)) return
  meditating.value = false
  location.value = destination
}

function crossDoor() {
  if (current.value.door) location.value = current.value.door
}

function gather() {
  if (current.value.rune && bag.length < bagCapacity) collectRune(bag, current.value.rune)
}

</script>

<template>
  <nav class="top-nav" aria-label="游戏导航">
    <button v-for="name in ['资源', '地图', '哥雷姆']" :key="name"
      :aria-current="tab === name ? 'page' : undefined" @click="openTab(name)">{{ name }}</button>
  </nav>
  <main v-show="tab === '资源'" class="room stores" aria-label="资源">
    <h1>资源</h1>
    <ManaMeter />
    <section class="stock" aria-label="工坊库存">
      <h2>工坊库存</h2>
      <dl>
        <div v-for="(count, rune) in resources.runes" :key="rune">
          <dt>{{ rune }}符文</dt>
          <dd>{{ count }} <small>/ {{ runeCapacity }}</small></dd>
        </div>
      </dl>
    </section>
    <div class="ledger"><span>随身背包 {{ bag.length }}/{{ bagCapacity }}</span><strong>{{ bagContents || '空' }}</strong></div>
    <div class="ledger"><span>金钱</span><strong>{{ resources.money }}</strong></div>
  </main>
  <main v-show="tab === '哥雷姆'" class="room" aria-label="哥雷姆">
    <RuneBoard v-if="golems" />
    <section v-else class="board"><h1>哥雷姆</h1><p>前往工坊，用 {{ golemCost.earth }} 土、{{ golemCost.water }} 水和 {{ golemCost.mana }} 魔力锻造第一具哥雷姆。</p></section>
  </main>
  <main v-show="tab === '地图'" class="room" aria-labelledby="room-title">
    <div class="scene">
      <img :src="current.image" alt="">
      <div class="scene-caption">
        <h1 id="room-title">{{ current.label }}</h1>
        <p>{{ current.feature || '交互点 0 · 穿门' }}</p>
      </div>
    </div>
    <NearbyMap :location="location" @travel="travel" @cross="crossDoor" />
    <div class="workbench">
      <div class="pack">
        <strong>随身背包 {{ bag.length }}/{{ bagCapacity }}</strong>
        <span>{{ bagContents || '空' }}</span>
        <button v-if="plots[location]?.type === 'warehouse' && bag.length" class="gather"
          :disabled="!bag.some(rune => runeSpace(rune) > 0n)" @click="unloadBag">存入工坊</button>
        <small v-if="plots[location]?.type === 'warehouse' && bag.some(rune => runeSpace(rune) === 0n)">满仓的符文会留在背包中。</small>
      </div>
      <WorkshopPlot v-if="current.layer === 'interior' && current.number > 0" :key="location" :id="location" />
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
        <ManaMeter />
        <small>每秒 +{{ manaPerSecond }} 魔力 · 离开房间结束冥想</small>
      </div>
      <button v-if="current.action" :disabled="bag.length >= bagCapacity" type="button" class="gather" @click="gather">
        <span>{{ current.action }}</span>
        <span class="yield">{{ bag.length >= bagCapacity ? '背包已满' : '+1' }}</span>
      </button>
      <small v-if="current.rune && bag.length">带回工坊仓库可将随身符文存入库存。</small>
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
