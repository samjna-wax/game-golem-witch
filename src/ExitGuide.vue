<script setup>
import { layers, layerPlaces } from './map.js'
import { ropewayOpen } from './resources.js'
</script>

<template>
  <details class="exit-guide">
    <summary>各层地点编号</summary>
    <p class="hint">水 n 前往本层 n 号地点，有内部地图时直接进入。水 0（「水无」）从任意位置退出一层。无表示 0，可免费书写。</p>
    <dl>
      <div v-for="(nodes, layer) in layerPlaces" :key="layer">
        <dt>{{ layers[layer] }}</dt>
        <dd><span v-for="p in nodes" :key="p.id">
          <b>{{ p.number }}</b> {{ p.label }}{{ p.id === 'kiln' && !ropewayOpen ? '（停运）' : '' }}
          <small v-if="p.golemOnly">仅哥雷姆通行</small>
          <small v-if="p.inside"> · 进入{{ layers[p.inside] }}</small>
        </span></dd>
      </div>
    </dl>
  </details>
</template>
