<script setup>
import { computed } from 'vue'
import { layers, layerPlaces, placeById, canTravel } from './map.js'
import { buildingCount, buildingLimit } from './buildings.js'
import { fleet } from './golems.js'
import ExitGuide from './ExitGuide.vue'

const props = defineProps({ location: String })
defineEmits(['travel', 'cross'])
const current = computed(() => placeById[props.location])
const nodes = computed(() => layerPlaces[current.value.layer])
const inWorkshop = computed(() => current.value.layer === 'interior')
const positions = computed(() => nodes.value.length === 2 ? [[23, 50], [77, 50]] : nodes.value.length === 4
  ? [[23, 25], [77, 75], [77, 25], [23, 75]] : [[17, 50], [50, 24], [83, 50]])
</script>

<template>
  <nav class="map" aria-label="本层地图">
    <div class="map-heading">
      <h2>{{ layers[current.layer] }}</h2>
      <small v-if="inWorkshop">建筑 {{ buildingCount }} / {{ buildingLimit }}</small>
    </div>
    <div :class="inWorkshop ? 'plot-list' : 'map-track expanded'">
      <svg v-if="!inWorkshop" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <template v-for="([x, y], i) in positions" :key="i">
          <line v-for="([x2, y2], j) in positions.slice(i+1)" :key="j" :x1="x" :y1="y" :x2="x2" :y2="y2"
            :class="{ closed: !canTravel(location, nodes[i+j+1].id) }" />
        </template>
      </svg>
      <button v-for="(node, i) in nodes" :key="node.id" :class="inWorkshop ? 'plot' : 'place'"
        :style="inWorkshop ? undefined : { left: positions[i][0]+'%', top: positions[i][1]+'%' }"
        :disabled="node.id === location || !canTravel(location, node.id)"
        :aria-current="node.id === location ? 'location' : undefined" @click="$emit('travel', node.id)">
        <strong>{{ node.number }} · {{ node.label }}</strong>
        <small>{{ node.id === location ? '所在地' : node.golemOnly ? '仅哥雷姆通行' : !canTravel(location, node.id) ? '索道停运' : '水 ' + node.number }}</small>
        <span v-if="fleet.some(g => g.location === node.id)" class="machine-marker">⚙{{ fleet.filter(g => g.location === node.id).length }}</span>
      </button>
    </div>
    <button v-if="current.door" class="door-action" @click="$emit('cross')">穿门至{{ placeById[current.door].label }} · 土 0</button>
    <ExitGuide />
  </nav>
</template>
