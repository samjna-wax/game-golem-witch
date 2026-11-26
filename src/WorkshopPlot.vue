<script setup>
import { computed, ref } from 'vue'
import { plots, buildingCount, buildingLimit, furnaceCost, canBuild, buildFurnace,
  canMoveBuilding, moveBuilding, feedFurnace, burnSeconds, burnMana } from './buildings.js'
import { bag, bagCapacity, resources, manaCapacity } from './resources.js'
import { placeById } from './map.js'

const props = defineProps({ id: String })
const building = computed(() => plots[props.id])
const empty = computed(() => Object.keys(plots).filter(id => plots[id] === null))
const destination = ref('')
function withdrawFire() {
  if (bag.length < bagCapacity && resources.runes.火 > 0n) {
    resources.runes.火--
    bag.push('火')
  }
}
</script>

<template>
  <section class="facility">
    <template v-if="!building">
      <h2>建造基础魔力炉</h2>
      <p>工坊库存 <span v-for="(cost, rune) in furnaceCost" :key="rune">{{ rune }} {{ resources.runes[rune] }}/{{ cost }}　</span></p>
      <button class="gather" :disabled="!canBuild" @click="buildFurnace(id)">{{ buildingCount >= buildingLimit ? '建筑数量已达上限' : '在此建造' }}</button>
    </template>
    <template v-else-if="building.type === 'furnace'">
      <h2>炉中燃料 · {{ building.fuel }} 火</h2>
      <p>每 {{ burnSeconds }} 秒消耗 1 火，产生 {{ burnMana }} 魔力。哥雷姆使用交互点 1 投料。</p>
      <p>{{ !building.fuel ? '等待投料' : manaCapacity - resources.mana < burnMana ? '魔力储量接近上限，暂缓燃烧' : '正在燃烧 · ' + building.elapsed + ' / ' + burnSeconds + ' 秒' }} · 魔力 {{ resources.mana }}/{{ manaCapacity }}</p>
      <button class="gather" :disabled="!bag.includes('火')" @click="feedFurnace(id, bag)">从背包投入 1 火</button>
    </template>
    <template v-else-if="building.type === 'warehouse'">
      <h2>仓库收货台</h2>
      <p>交互点 1 · 将哥雷姆的第一枚货物存入工坊库存。</p>
      <button class="gather" :disabled="bag.length >= bagCapacity || resources.runes.火 === 0n" @click="withdrawFire">取 1 火到背包</button>
    </template>
    <details v-if="canMoveBuilding(id)" class="exit-guide">
      <summary>移动建筑</summary>
      <label>空置位置
        <select v-model="destination">
          <option disabled value="">选择编号</option>
          <option v-for="to in empty" :key="to" :value="to">{{ placeById[to].number }} 号位</option>
        </select>
      </label>
      <button :disabled="!empty.includes(destination)" @click="moveBuilding(id, destination)">移至所选位置</button>
    </details>
  </section>
</template>
