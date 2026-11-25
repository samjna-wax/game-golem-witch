<script setup>
import { computed, ref } from 'vue'
import { resources, ropeway, ropewayOpen, troughGoal } from './resources.js'
import { exits, placeById } from './map.js'
import { fleet, capacity, operand, step } from './golems.js'

import ExitGuide from './ExitGuide.vue'
import RuneEditor from './RuneEditor.vue'

defineProps({ returnLabel: String })
defineEmits(['close'])
const view = ref('edit')
const iconMode = ref(true)
const id = ref(1)
const machine = computed(() => fleet[id.value - 1])
const selected = ref(null)
function chooseMachine() {
  selected.value = null
}
function showInstalled() {
  selected.value = null
  view.value = 'run'
}
function start() {
  const g = machine.value
  g.running = true
}
</script>

<template>
  <article class="board" :class="{ 'icon-mode': iconMode }">
    <header class="board-head">
      <h1>符文板</h1>
      <button type="button" @click="$emit('close')">{{ returnLabel }}</button>
    </header>
    <label>哥雷姆
      <select v-model="id" @change="chooseMachine">
        <option v-for="g in fleet" :key="g.id" :value="g.id">{{ g.id }} 号</option>
      </select>
    </label>
    <label class="glyph-choice"><input type="checkbox" v-model="iconMode">符文图标</label>
    <div class="board-switch" role="group" aria-label="符文板视图">
      <button :aria-pressed="view === 'edit'" @click="view = 'edit'">编辑符文</button>
      <button :aria-pressed="view === 'run'" @click="view = 'run'">执行程序</button>
    </div>
    <ExitGuide />
    <RuneEditor v-show="view === 'edit'" :key="machine.id" :machine="machine"
      @installed="showInstalled" @cleared="selected = null" />
    <template v-if="view === 'run'">
      <section class="readout" aria-label="哥雷姆状态">
        <strong>{{ placeById[machine.location].title }}</strong>
        <span>货舱 {{ machine.cargo.length }}/{{ capacity }} · {{ machine.cargo.join('、') || '空' }}</span>
        <p>出口 <span v-for="(to, n) in exits[machine.location]" :key="n">{{ n }} {{ placeById[to].label }}{{ to === 'kiln' && !ropewayOpen ? '（停运）' : '' }}　</span></p>
        <p v-if="machine.location === 'workshop' || placeById[machine.location].rune">
          交互点 1 · {{ machine.location === 'workshop' ? '收货台' : placeById[machine.location].feature }}
        </p>
        <p v-if="machine.location === 'mine'">交互点 2 · 索道水槽 {{ ropeway.water }}/{{ troughGoal }}</p>
        <p>魔力 {{ resources.mana }} · 每步消耗 1</p>
        <p>库存 · 土 {{ resources.runes.土 }}　水 {{ resources.runes.水 }}</p>
      </section>

      <div class="board-head"><h2>已装入程序</h2><span>{{ machine.running ? '运行中' : '已停止' }}</span></div>
      <details v-if="machine.program.length" class="installed">
        <summary>{{ machine.program.length }} 行 · 下一行 {{ machine.pc + 1 }}</summary>
        <ol class="program">
          <li v-for="(line, i) in machine.program" :key="i">
            <button :aria-pressed="i === selected" @click="selected = i">
              <span>{{ i + 1 }}</span><b class="rune-ink">{{ line }}</b>
              <span>{{ line[0] === '水' ? '出口' : '交互点' }} {{ operand(line) }}</span>
              <small v-if="i === machine.pc">下一行</small>
            </button>
          </li>
        </ol>
      </details>
      <p role="status" class="message">{{ machine.report }}</p>
      <div class="tools">
        <button :disabled="machine.running || !machine.program.length" @click="step(machine)">单步</button>
        <button v-if="machine.running" @click="machine.running = false">暂停</button>
        <button v-else :disabled="!machine.program.length" @click="start">自动循环</button>
        <button v-if="selected !== null" :disabled="machine.running" @click="machine.pc = selected">从选中行开始</button>
      </div>
    </template>

  </article>
</template>
