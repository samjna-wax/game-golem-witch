<script setup>
import { resources, manaCapacity } from './resources.js'
</script>

<template>
  <div class="mana-meter">
    <div class="meter-label">
      <strong>魔力</strong>
      <output aria-label="当前魔力">{{ resources.mana }} <small>/ {{ manaCapacity }}</small></output>
    </div>
    <div class="mana-track" role="meter" aria-label="魔力储量" aria-valuemin="0"
      :aria-valuemax="Number(manaCapacity)" :aria-valuenow="Number(resources.mana)">
      <span :style="{ width: (Number(resources.mana) / Number(manaCapacity) * 100) + '%' }"></span>
    </div>
  </div>
</template>
