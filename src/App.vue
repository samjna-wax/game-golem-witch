<script setup>
import { resources } from './resources.js'
import { computed, ref } from 'vue'
import { places, paths, canTravel } from './map.js'

const location = ref('room')
const current = computed(() => places.find(place => place.id === location.value))

function travel(destination) {
  if (canTravel(location.value, destination)) location.value = destination
}

function gather() {
  if (current.value.rune) resources.runes[current.value.rune]++
  else resources.mana++
}

function column(id) {
  return places.findIndex(place => place.id === id) + 1
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
    <nav class="map" aria-label="附近地图">
      <h2>附近地图</h2>
      <div class="map-track" :style="{ gridTemplateColumns: 'repeat(' + places.length + ', minmax(0, 1fr))' }">
        <span v-for="[a, b] in paths" :key="a + b" class="path" aria-hidden="true"
          :style="{ gridColumn: column(a) + ' / ' + (column(b) + 1) }"></span>
        <button v-for="place in places" :key="place.id" type="button" class="place"
          :style="{ gridColumn: column(place.id) }"
          :disabled="!canTravel(location, place.id)"
          :aria-current="place.id === location ? 'location' : undefined"
          @click="travel(place.id)">
          <strong>{{ place.label }}</strong>
          <small>{{ place.id === location ? '所在地' : canTravel(location, place.id) ? '前往' : '未相邻' }}</small>
        </button>
      </div>
    </nav>
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
      <button type="button" class="gather" @click="gather">
        <span>{{ current.action }}</span>
        <span class="yield">+1</span>
      </button>
    </div>
  </main>
</template>
