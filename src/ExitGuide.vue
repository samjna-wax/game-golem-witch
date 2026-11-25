<script setup>
import { places, placeById, exits } from './map.js'
import { ropewayOpen } from './resources.js'
</script>

<template>
  <details class="exit-guide">
    <summary>各地点出口编号</summary>
    <dl>
      <div v-for="place in places" :key="place.id">
        <dt>{{ place.label }}</dt>
        <dd>
          <span v-for="(destination, number) in exits[place.id]" :key="number">
            <b>{{ number }}</b> {{ placeById[destination].label }}{{ !ropewayOpen && (place.id === 'kiln' || destination === 'kiln') ? '（停运）' : '' }}
          </span>
        </dd>
      </div>
    </dl>
  </details>
</template>
