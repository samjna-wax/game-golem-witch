<script setup>
import { computed, ref } from 'vue'
import { manor, places, paths, arrival, canTravel, exits } from './map.js'

import { fleet } from './golems.js'

const props = defineProps({ location: { type: String, required: true } })
defineEmits(['travel'])
const expanded = ref(true)
const inside = computed(() => places.find(place => place.id === props.location)?.parent === manor.id)
const mine = places.find(place => place.id === 'mine')
const nodes = computed(() => expanded.value ? places : [manor, mine])

// Drawing coordinates are percentages. Travel always uses the graph's edges.
const positions = computed(() => expanded.value
  ? { room: [15, 25], courtyard: [15, 75], workshop: [50, 75], gate: [50, 25], mine: [85, 25] }
  : { manor: [25, 50], mine: [75, 50] })
const edges = computed(() => expanded.value
  ? paths.map(([a, b]) => [arrival(a), arrival(b)])
  : paths.filter(pair => pair.includes(manor.id)))

function exitLabel(id) {
  const port = Object.keys(exits[props.location]).find(n => exits[props.location][n] === arrival(id))
  return port + ' 号' + (id === manor.id ? ' · 入口' : '出口')
}
function machinesHere(id) {
  return fleet.filter(g => id === manor.id ? g.location !== mine.id : g.location === id).length
}

function isHere(id) {
  return id === manor.id ? inside.value : id === props.location
}

function reachable(id) {
  return !isHere(id) && canTravel(props.location, id)
}
</script>

<template>
  <nav class="map" aria-label="附近地图">
    <div class="map-heading">
      <h2>附近地图</h2>
      <button class="map-toggle" type="button" :aria-expanded="expanded" aria-controls="nearby-topology"
        @click="expanded = !expanded">{{ expanded ? '收起宅邸' : '展开宅邸' }}</button>
    </div>
    <div id="nearby-topology" class="map-track" :class="{ expanded }">
      <div v-if="expanded" class="manor-boundary"><span>魔女宅邸</span></div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line v-for="[a, b] in edges" :key="a + b"
          :x1="positions[a][0]" :y1="positions[a][1]"
          :x2="positions[b][0]" :y2="positions[b][1]" />
      </svg>
      <button v-for="node in nodes" :key="node.id" type="button" class="place"
        :style="{ left: positions[node.id][0] + '%', top: positions[node.id][1] + '%' }"
        :disabled="!reachable(node.id)" :aria-current="isHere(node.id) ? 'location' : undefined"
        @click="$emit('travel', node.id)">
        <strong>{{ node.label }}</strong>
        <span v-if="machinesHere(node.id)" class="machine-marker" :aria-label="machinesHere(node.id) + ' 具哥雷姆'">⚙{{ machinesHere(node.id) }}</span>
        <small>{{ isHere(node.id) ? '所在地' : reachable(node.id) ? exitLabel(node.id) : '未相邻' }}</small>
      </button>
    </div>
  </nav>
</template>
