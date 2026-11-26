<script setup>
import { computed } from 'vue'
import { layers, layerPlaces, placeById, travelTo } from './map.js'
import { buildingCount, buildingLimit } from './buildings.js'
import { fleet } from './golems.js'
import ExitGuide from './ExitGuide.vue'

const props = defineProps({ location: String })
defineEmits(['travel'])
const current = computed(() => placeById[props.location])
const nodes = computed(() => layerPlaces[current.value.layer])
const inWorkshop = computed(() => current.value.layer === 'interior')
const atEntrance = computed(() => fleet.filter(g => g.location === current.value.layer).length)
const exit = computed(() => travelTo(props.location, 0n))
function access(node) {
  return travelTo(props.location, BigInt(node.number))
}
const positions = computed(() => nodes.value.length === 2 ? [[23, 50], [77, 50]] : nodes.value.length === 4
  ? [[23, 25], [77, 75], [77, 25], [23, 75]] : [[17, 50], [50, 24], [83, 50]])
</script>

<template>
  <nav class="map" aria-label="本层地图">
    <div class="map-heading">
      <h2>{{ layers[current.layer] }}</h2>
      <small v-if="atEntrance">入口 · {{ atEntrance }} 具哥雷姆</small>
      <small v-if="inWorkshop">建筑 {{ buildingCount }} / {{ buildingLimit }}</small>
    </div>
    <div :class="inWorkshop ? 'plot-list' : 'map-track expanded'">
      <svg v-if="!inWorkshop" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <template v-for="([x, y], i) in positions" :key="i">
          <line v-for="([x2, y2], j) in positions.slice(i+1)" :key="j" :x1="x" :y1="y" :x2="x2" :y2="y2"
            :class="{ closed: access(nodes[i]).error || access(nodes[i+j+1]).error }" />
        </template>
      </svg>
      <button v-for="(node, i) in nodes" :key="node.id" :class="inWorkshop ? 'plot' : 'place'"
        :style="inWorkshop ? undefined : { left: positions[i][0]+'%', top: positions[i][1]+'%' }"
        :disabled="access(node).location === location || !!access(node).error"
        :aria-current="node.id === location ? 'location' : undefined" @click="$emit('travel', node.number)">
        <strong>{{ node.number }} · {{ node.label }}</strong>
        <small>{{ node.id === location ? (node.inside ? '门外 · 进入' : '所在地') : access(node).error || '水 ' + node.number }}</small>
        <span v-if="fleet.some(g => g.location === node.id)" class="machine-marker">⚙{{ fleet.filter(g => g.location === node.id).length }}</span>
      </button>
    </div>
    <button v-if="exit.location" class="door-action" @click="$emit('travel', 0)">0 · 退出{{ layers[current.layer] }}</button>
    <ExitGuide />
  </nav>
</template>
