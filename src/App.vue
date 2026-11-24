<script setup>
import { ref } from 'vue'
import roomImage from './assets/witch-room.webp'

const mana = ref(0)
</script>

<template>
  <main class="room" aria-labelledby="room-title">
    <div class="scene">
      <img :src="roomImage" alt="阁楼里，魔女在烛光下把双手拢在发光的水晶旁。">
      <h1 id="room-title">魔女的房间</h1>
    </div>
    <div class="workbench">
      <div class="reserve">
        <span id="mana-label">魔力</span>
        <output aria-labelledby="mana-label">{{ mana }}</output>
      </div>
      <button type="button" @click="mana++">
        <span>提炼魔力</span>
        <span class="yield">+1</span>
      </button>
    </div>
  </main>
</template>
