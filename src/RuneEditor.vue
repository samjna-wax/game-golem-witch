<script setup>
import { computed, onMounted, ref } from 'vue'
import { digits, decode } from './language.js'
import { hauling, installation, installDraft, runeCost } from './golems.js'

import { resources, runeSpace } from './resources.js'

const props = defineProps({ machine: { type: Object, required: true } })
const emit = defineEmits(['installed', 'cleared'])
const area = ref(null)
const gutter = ref(null)
const caret = ref(0)
const counting = ['火水土', '无无', '火土土', '气水无', '气无水', '无水']
const plan = computed(() => installation(props.machine))
const clearOverflow = computed(() => Object.entries(runeCost(props.machine.program))
  .filter(([rune, count]) => count > runeSpace(rune))
  .map(([rune, count]) => rune + ' ' + (count - runeSpace(rune))).join('、'))
const lines = computed(() => props.machine.draft.split('\n'))
const current = computed(() => props.machine.draft.slice(0, caret.value).split('\n').length - 1)
const translated = computed(() => {
  const line = lines.value[current.value] ?? ''
  if (!line) return '水为移动，土为交互'
  const item = decode(line)
  return item.error || item.text
})

// Native editing owns the text and selection while this machine is mounted.
onMounted(() => { area.value.value = props.machine.draft })

function clearProgram() {
  props.machine.draft = ''
  installDraft(props.machine)
  const el = area.value
  el.value = ''
  el.setSelectionRange(0, 0)
  el.scrollTop = 0
  gutter.value.scrollTop = 0
  caret.value = 0
  el.focus({ preventScroll: true })
  emit('cleared')
}

function syncSelection() {
  caret.value = area.value.selectionStart
}
function nativeEdit() {
  props.machine.draft = area.value.value
  syncSelection()
}
function replace(start, end, text) {
  const el = area.value
  el.focus({ preventScroll: true })
  el.setRangeText(text, start, end, 'end')
  nativeEdit()
  const top = current.value * 44
  if (top < el.scrollTop) el.scrollTop = top
  if (top + 44 > el.scrollTop + el.clientHeight) el.scrollTop = top + 44 - el.clientHeight
}
function type(text) {
  replace(area.value.selectionStart, area.value.selectionEnd, text)
}
function erase() {
  const { selectionStart: a, selectionEnd: b } = area.value
  if (a || b) replace(a === b ? a - 1 : a, b, '')
}
function install() {
  if (installDraft(props.machine)) emit('installed')
}
</script>

<template>
  <section class="rune-editor" aria-label="符文草稿">
    <div class="board-head"><h2>程序草稿</h2>
      <button v-if="machine.draft || machine.program.length" @click="clearProgram">清空并重写</button>
      <button v-if="!machine.draft" @mousedown.prevent @click="type(hauling().join('\n'))">填入运土范例</button>
      <button v-if="resources.airReturned && !machine.draft" @mousedown.prevent @click="type(counting.join('\n'))">填入计数范例</button>
    </div>
    <p v-if="machine.program.length" class="hint">清空会停机并退还符文。<span v-if="clearOverflow">库存空间不足，{{ clearOverflow }} 将消散。</span></p>
    <details v-if="resources.airReturned" class="exit-guide">
      <summary>运算与跳转写法</summary>
      <p>火水 R 给寄存器 R 加一；火土 R 尝试减一，成功时条件为真，原值为零时条件为假。R 可用水、土、火、气。</p>
      <p>无 n 标记本行。气水 n 在最近一次减一成功时跳到标签 n；气无 n 总是跳转。编号按五进制书写。</p>
      <p>例如「火水土」给土寄存器加一，「火土土」尝试减一，「气水无」在成功时跳到「无无」。</p>
    </details>
    <div class="editor-paper">
      <div ref="gutter" class="gutter" aria-hidden="true">
        <span v-for="(_, i) in lines" :key="i">{{ i + 1 }}</span>
      </div>
      <textarea ref="area" class="rune-ink" aria-label="程序文本" inputmode="none" wrap="off"
        spellcheck="false" autocapitalize="off" autocomplete="off" @input="nativeEdit"
        @select="syncSelection" @selectionchange="syncSelection" @click="syncSelection" @keyup="syncSelection"
        @scroll="gutter.scrollTop = area.scrollTop"></textarea>
    </div>
    <div class="keypad" @mousedown.prevent>
      <p class="translation">第 {{ current + 1 }} 行 · {{ translated }}</p>
      <div class="key-row symbols">
        <button v-for="(rune, n) in digits" :key="rune" :aria-label="'输入' + rune" @click="type(rune)">
          <span class="rune-ink">{{ rune }}</span><small>{{ rune }} · {{ n }}</small>
        </button>
      </div>
      <div class="key-row editing">
        <button @click="type('\n')">换行</button><button @click="erase">退格</button>
      </div>
    </div>
    <p v-if="plan.length !== undefined" class="hint">程序 {{ plan.length }} 枚符文 · 本次装入 {{ plan.manaCost }} 魔力 · 现有 {{ resources.mana }}</p>
    <p v-if="plan.error" class="message">{{ plan.error }}</p>
    <p v-else-if="plan.changes.length" class="hint">
      <span v-for="{rune, delta, overflow} in plan.changes" :key="rune">{{ delta > 0n ? '占用' : '归还' }}{{ rune }} {{ delta > 0n ? delta : -delta - overflow }}<template v-if="overflow">（另有 {{ overflow }} 枚溢出消散）</template>　</span>
    </p>
    <button :disabled="!!plan.error || !plan.changed" @click="install">装入哥雷姆</button>
  </section>
</template>
