<script setup>
import { computed, ref } from 'vue'
import { resources } from './resources.js'
import { exits, placeById } from './map.js'
import { fleet, capacity, digits, hauling, operand, runeCost, affordable, insertLines, removeLine, step } from './golems.js'

defineEmits(['close'])
const id = ref(1)
const machine = computed(() => fleet[id.value - 1])
const selected = ref(null)
const op = ref('水')
const numberRunes = ref('水')
const draft = computed(() => op.value + numberRunes.value)
const sampleCost = runeCost(hauling)
function chooseMachine() {
  selected.value = null
}
function addLine() {
  const g = machine.value
  const index = selected.value === null ? g.program.length : selected.value + 1
  if (insertLines(g, index, [draft.value])) selected.value = index
}
function erase() {
  removeLine(machine.value, selected.value)
  selected.value = null
}
function start() {
  const g = machine.value
  g.running = true
  step(g)
}
</script>

<template>
  <article class="board">
    <header class="board-head">
      <h1>符文板</h1>
      <button type="button" @click="$emit('close')">返回工坊</button>
    </header>
    <label>哥雷姆
      <select v-model="id" @change="chooseMachine">
        <option v-for="g in fleet" :key="g.id" :value="g.id">{{ g.id }} 号</option>
      </select>
    </label>
    <section class="readout" aria-label="哥雷姆状态">
      <strong>{{ placeById[machine.location].title }}</strong>
      <span>货舱 {{ machine.cargo.length }}/{{ capacity }} · {{ machine.cargo.join('、') || '空' }}</span>
      <p>出口 <span v-for="(to, n) in exits[machine.location]" :key="n">{{ n }} {{ placeById[to].label }}　</span></p>
      <p v-if="machine.location === 'workshop' || placeById[machine.location].rune">
        交互点 1 · {{ machine.location === 'workshop' ? '收货台' : placeById[machine.location].feature }}
      </p>
      <p>库存 · 土 {{ resources.runes.土 }}　水 {{ resources.runes.水 }}</p>
    </section>

    <div class="board-head"><h2>程序</h2><span>{{ machine.running ? '运行中' : '已停止' }}</span></div>
    <ol v-if="machine.program.length" class="program">
      <li v-for="(line, i) in machine.program" :key="i">
        <button :aria-pressed="i === selected" @click="selected = i">
          <span>{{ i + 1 }}</span><b>{{ line[0] }} ｜ {{ line.slice(1) }}</b>
          <span>{{ line[0] === '水' ? '出口' : '交互点' }} {{ operand(line) }}</span>
          <small v-if="i === machine.pc">下一行</small>
        </button>
      </li>
    </ol>
    <div v-else class="example">
      <p>运土范例 · 工坊出发，到矿山采一枚土符文，再回工坊卸货</p>
      <button :disabled="!affordable(hauling)" @click="insertLines(machine, 0, hauling)">装入六行范例</button>
      <small>占用 土 {{ sampleCost.土 }} · 水 {{ sampleCost.水 }}，拆行归还。</small>
    </div>
    <p role="status" class="message">{{ machine.report }}</p>
    <div class="tools">
      <button :disabled="machine.running || !machine.program.length" @click="step(machine)">单步</button>
      <button v-if="machine.running" @click="machine.running = false">暂停</button>
      <button v-else :disabled="!machine.program.length" @click="start">自动循环</button>
      <button v-if="selected !== null" :disabled="machine.running" @click="machine.pc = selected">从选中行开始</button>
    </div>

    <details class="composer" open>
      <summary>编排符文</summary>
      <fieldset :disabled="machine.running">
        <legend>操作符</legend>
        <button v-for="symbol in ['水','土']" :key="symbol" :aria-pressed="op === symbol" @click="op = symbol">
          {{ symbol }} · {{ symbol === '水' ? '移动' : '交互' }}
        </button>
      </fieldset>
      <fieldset :disabled="machine.running">
        <legend>数值 · 五进制</legend>
        <button v-for="(symbol, n) in digits" :key="symbol" :disabled="!resources.runes[symbol]"
          @click="numberRunes += symbol">{{ symbol }} {{ n }}</button>
        <button :disabled="!numberRunes" @click="numberRunes = numberRunes.slice(0, -1)">退一位</button>
      </fieldset>
      <p class="draft">草稿　{{ op }} ｜ {{ numberRunes || '…' }}
        <span v-if="numberRunes">（{{ operand(draft) }}）</span>
      </p>
      <div class="tools">
        <button :disabled="machine.running || !numberRunes || !affordable([draft])" @click="addLine">
          {{ selected === null ? '追加一行' : '插入选中行后' }}
        </button>
        <button :disabled="machine.running || selected === null" @click="erase">拆除选中行</button>
      </div>
      <p>装入时占用符文，拆除时归还。走完末行会回到首行。</p>
    </details>
  </article>
</template>
