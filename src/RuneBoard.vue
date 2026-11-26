<script setup>
import { computed, ref } from 'vue'
import { resources, ropeway, ropewayOpen, troughGoal } from './resources.js'
import { layerPlaces, placeById, locationPath } from './map.js'
import { fleet, capacity, step, recallCost, canRecall, recall } from './golems.js'

import { plots } from './buildings.js'
import ExitGuide from './ExitGuide.vue'
import RuneEditor from './RuneEditor.vue'
import { copyText, programText } from './copyProgram.js'

const view = ref(fleet[0].initialized ? 'edit' : 'run')
const iconMode = ref(true)
const id = ref(1)
const machine = computed(() => fleet[id.value - 1])
const current = computed(() => placeById[machine.value.location])
const building = computed(() => plots[machine.value.location])
const selected = ref(null)
const copyMessage = ref('')
const manualCopy = ref('')
let copyRequest = 0
function clearCopyState() {
  copyMessage.value = ''
  manualCopy.value = ''
  copyRequest++
}
function chooseMachine() {
  selected.value = null
  clearCopyState()
}
async function copyProgram() {
  const text = programText(machine.value)
  const request = ++copyRequest
  manualCopy.value = ''
  const copied = await copyText(text)
  if (request !== copyRequest) return
  copyMessage.value = copied ? '已复制完整程序。' : '无法自动复制，请长按下方文本选择并复制。'
  if (!copied) manualCopy.value = text
}
function showInstalled() {
  selected.value = null
  clearCopyState()
  view.value = 'run'
}
function setNextLine() {
  const g = machine.value
  if (g.pc !== selected.value) {
    g.initialized = false
    g.pc = selected.value
  }
}
function start() {
  const g = machine.value
  g.blocked = false
  g.initialized = false
  g.running = true
}
</script>

<template>
  <article class="board" :class="{ 'icon-mode': iconMode }">
    <header class="board-head">
      <h1>符文板</h1>

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
    <div v-if="!machine.initialized" class="recall">
      <button :disabled="!canRecall(machine)" @click="recall(machine); selected = null">重置并回程</button>
      <small>编辑前须重置。消耗 {{ recallCost }} 魔力，清空货舱和寄存器，保留已装程序。</small>
      <small v-if="!canRecall(machine)">当前魔力 {{ resources.mana }} / {{ recallCost }}</small>
    </div>
    <RuneEditor v-if="machine.initialized && view === 'edit'" :key="machine.id" :machine="machine"
      @installed="showInstalled" @cleared="chooseMachine" />
    <template v-if="view === 'run'">
      <section class="readout" aria-label="哥雷姆状态">
        <strong>{{ locationPath(machine.location) }}</strong>
        <span>货舱 {{ machine.cargo.length }}/{{ capacity }} · {{ machine.cargo.join('、') || '空' }}</span>
        <p>本层地点 <span v-for="p in layerPlaces[current.layer]" :key="p.id">{{ p.number }} {{ p.label }}{{ p.id === 'kiln' && !ropewayOpen ? '（停运）' : '' }}　</span></p>
        <p v-if="current.layer !== 'world'">水 0 · 退出当前地图</p>
        <p v-if="current.rune || building?.type === 'warehouse' || building?.type === 'furnace'">交互点 1 · {{ building?.type === 'warehouse' ? '卸货入库' : building?.type === 'furnace' ? '投入一枚火符文' : current.feature }}</p>
        <p v-if="machine.location === 'mine'">交互点 2 · 索道水槽 {{ ropeway.water }}/{{ troughGoal }}</p>
        <p>魔力 {{ resources.mana }} · 每步消耗 1</p>
        <div v-if="resources.airReturned" class="registers" aria-label="寄存器">
          <strong>寄存器</strong>
          <span v-for="(value, name) in machine.registers" :key="name" :aria-current="name === machine.currentRegister ? 'true' : undefined">
            {{ name }} {{ value }}<small v-if="name === machine.currentRegister"> · 当前</small>
          </span>
        </div>
        <p>库存 · 土 {{ resources.runes.土 }}　水 {{ resources.runes.水 }}</p>

      </section>

      <div class="board-head"><h2>已装入程序</h2><span>{{ machine.initialized ? '初始化 · 可编辑' : machine.running ? (machine.blocked ? '等待中，将自动重试' : '运行中') : '已停止' }}</span></div>
      <button :disabled="!machine.program.length" @click="copyProgram">复制完整程序</button>
      <p v-if="copyMessage" role="status" class="message">{{ copyMessage }}</p>
      <textarea v-if="manualCopy" :value="manualCopy" readonly aria-label="待复制的已装程序" @focus="$event.target.select()"></textarea>
      <details v-if="machine.program.length" class="installed">
        <summary>{{ machine.program.length }} 行 · 下一行 {{ machine.pc + 1 }}</summary>
        <ol class="program">
          <li v-for="(line, i) in machine.program" :key="i">
            <button :aria-pressed="i === selected" @click="selected = i">
              <span>{{ i + 1 }}</span><b class="rune-ink">{{ line }}</b>
              <span>{{ machine.instructions[i].text }}</span>
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
        <button v-if="selected !== null" :disabled="machine.running" @click="setNextLine">从选中行开始</button>
      </div>
    </template>

  </article>
</template>
