<script setup>
import { computed, ref } from 'vue'
import { digits, hauling, installation, installDraft, operand } from './golems.js'

const props = defineProps({ machine: { type: Object, required: true } })
const emit = defineEmits(['installed'])
const area = ref(null)
const gutter = ref(null)
const caret = ref(0)
const plan = computed(() => installation(props.machine))
const lines = computed(() => props.machine.draft.split('\n'))
const current = computed(() => props.machine.draft.slice(0, caret.value).split('\n').length - 1)
const translated = computed(() => {
  const line = lines.value[current.value] ?? ''
  if (!line) return '水为移动，土为交互'
  if (!/^[水土][无水土气火]+$/u.test(line)) return '需要操作符和数值'
  return (line[0] === '水' ? '走出口 ' : '使用交互点 ') + operand(line)
})

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
  installDraft(props.machine)
  emit('installed')
}
</script>

<template>
  <section class="rune-editor" aria-label="符文草稿">
    <div class="board-head"><h2>程序草稿</h2>
      <button v-if="!machine.draft" @mousedown.prevent @click="type(hauling.join('\n'))">填入运土范例</button>
    </div>
    <div class="editor-paper">
      <div ref="gutter" class="gutter" aria-hidden="true">
        <span v-for="(_, i) in lines" :key="i">{{ i + 1 }}</span>
      </div>
      <textarea ref="area" :value="machine.draft" class="rune-ink" aria-label="程序文本" inputmode="none" wrap="off"
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
    <p v-if="plan.error" class="message">{{ plan.error }}</p>
    <p v-else-if="plan.changes.length" class="hint">
      <span v-for="{rune, delta} in plan.changes" :key="rune">{{ delta > 0n ? '占用' : '归还' }}{{ rune }} {{ delta > 0n ? delta : -delta }}　</span>
    </p>
    <button :disabled="!!plan.error || !plan.changed" @click="install">装入哥雷姆</button>
  </section>
</template>
