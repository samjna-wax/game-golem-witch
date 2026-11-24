<script setup>
import { resources } from './resources.js'
import roomImage from './assets/witch-room.webp'
</script>

<template>
  <main class="room" aria-labelledby="room-title">
    <div class="scene">
      <img :src="roomImage" alt="阁楼里，魔女在烛光下把双手拢在发光的水晶旁。">
      <h1 id="room-title">魔女的房间</h1>
    </div>
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
      <button type="button" @click="resources.mana++">
        <span>提炼魔力</span>
        <span class="yield">+1</span>
      </button>
    </div>
  </main>
</template>
