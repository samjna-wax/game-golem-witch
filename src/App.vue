<script setup>
import { canForge, forgeGolem, golemCost, golems } from './forge.js'
import { resources } from './resources.js'
import { computed, ref } from 'vue'
import { places, arrival, canTravel } from './map.js'
import NearbyMap from './NearbyMap.vue'

const location = ref('room')
const current = computed(() => places.find(place => place.id === location.value))

function travel(destination) {
  if (canTravel(location.value, destination)) location.value = arrival(destination)
}

function gather() {
  if (current.value.rune) resources.runes[current.value.rune]++
  else if (current.value.action) resources.mana++
}

</script>

<template>
  <main class="room" aria-labelledby="room-title">
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
          <span id="rune-label">符文</span>
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
      <section v-if="location === 'workshop'" class="forge" aria-label="魔力锻炉">
        <div class="recipe">
          <p id="forge-cost">每具消耗：魔力 {{ golemCost.mana }} · 土符文 {{ golemCost.earth }} · 水符文 {{ golemCost.water }}</p>
          <output aria-label="已有哥雷姆">已有 {{ golems }} 具哥雷姆</output>
        </div>
        <button type="button" class="gather" :disabled="!canForge" aria-describedby="forge-cost" @click="forgeGolem">
          锻造哥雷姆
        </button>
      </section>
      <button v-if="current.action" type="button" class="gather" @click="gather">
        <span>{{ current.action }}</span>
        <span class="yield">+1</span>
      </button>
    </div>
  </main>
</template>
