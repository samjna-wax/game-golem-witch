<script setup>
import { layers, layerPlaces, placeById } from './map.js'
import { ropewayOpen } from './resources.js'
</script>

<template>
  <details class="exit-guide">
    <summary>各层地点编号与门</summary>
    <p class="hint">水 n 前往本层 n 号地点。土 0 穿门。无表示 0，可免费书写。</p>
    <dl>
      <div v-for="(nodes, layer) in layerPlaces" :key="layer">
        <dt>{{ layers[layer] }}</dt>
        <dd><span v-for="p in nodes" :key="p.id">
          <b>{{ p.number }}</b> {{ p.label }}{{ p.id === 'kiln' && !ropewayOpen ? '（停运）' : '' }}
          <small v-if="p.door"> → {{ placeById[p.door].label }}</small>
        </span></dd>
      </div>
    </dl>
  </details>
</template>
