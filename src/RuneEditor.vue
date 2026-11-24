<script>
// The game clipboard also works between different golems in an offline file.
import { shallowRef } from 'vue'
const clipboard = shallowRef(null)
</script>

<script setup>
import { computed, ref } from 'vue'
import { digits, hauling, installation, installDraft, operand } from './golems.js'

const props = defineProps({ machine: { type: Object, required: true } })
const emit = defineEmits(['installed'])
const area = ref(null)
const gutter = ref(null)
const selection = ref([0, 0])
const lineAnchor = ref(null)
const wholeLines = ref(null)
const history = ref([])
const plan = computed(() => installation(props.machine))
const lines = computed(() => props.machine.draft.split('\n'))
const starts = computed(() => {
  let offset = 0
  return lines.value.map(line => {
    const start = offset
    offset += line.length + 1
    return start
  })
})
const current = computed(() => props.machine.draft.slice(0, selection.value[0]).split('\n').length - 1)
const translated = computed(() => {
  const line = lines.value[current.value] ?? ''
  if (!line) return '水为移动，土为交互'
  if (!/^[水土][无水土气火]+$/u.test(line)) return '需要操作符和数值'
  return (line[0] === '水' ? '走出口 ' : '使用交互点 ') + operand(line)
})

function syncSelection() {
  const el = area.value
  selection.value = [el.selectionStart, el.selectionEnd]
  if (wholeLines.value) {
    const [a,b] = wholeLines.value
    if (el.selectionStart !== starts.value[a] || el.selectionEnd !== endOf(b)) resetLinePick()
  }
}
function resetLinePick() {
  lineAnchor.value = null
  wholeLines.value = null
}
function endOf(i) {
  return starts.value[i + 1] ?? props.machine.draft.length
}
function select(start, end = start, reveal = false) {
  const el = area.value
  el.focus({ preventScroll: true })
  el.setSelectionRange(start, end)
  syncSelection()
  if (reveal) {
    const row = current.value
    const top = row * 44
    if (top < el.scrollTop) el.scrollTop = top
    if (top + 44 > el.scrollTop + el.clientHeight) el.scrollTop = top + 44 - el.clientHeight
  }
}
function pickLine(i) {
  const anchor = lineAnchor.value ?? i
  lineAnchor.value = lineAnchor.value === null ? i : null
  const a = Math.min(i, anchor), b = Math.max(i, anchor)
  wholeLines.value = [a, b]
  select(starts.value[a], endOf(b))
}
function remember() {
  history.value.push({ text: props.machine.draft, start: area.value.selectionStart, end: area.value.selectionEnd })
}
function replace(start, end, text) {
  remember()
  resetLinePick()
  const el = area.value
  el.setRangeText(text, start, end, 'end')
  props.machine.draft = el.value
  select(start + text.length, start + text.length, true)
}
function type(text) {
  replace(area.value.selectionStart, area.value.selectionEnd, text)
}
function move(direction) {
  const { selectionStart: a, selectionEnd: b, value } = area.value
  resetLinePick()
  select(a !== b ? (direction < 0 ? a : b) : Math.max(0, Math.min(value.length, a + direction)), undefined, true)
}
function erase() {
  const { selectionStart: a, selectionEnd: b } = area.value
  if (a || b) replace(a === b ? a - 1 : a, b, '')
}
function duplicate() {
  const i = current.value
  const pos = starts.value[i] + lines.value[i].length
  replace(pos, pos, '\n' + lines.value[i])
}
function copy(cut) {
  const { selectionStart: a, selectionEnd: b } = area.value
  const range = wholeLines.value
  if (!range && a === b) return
  clipboard.value = range
    ? { block: true, text: lines.value.slice(range[0], range[1] + 1).join('\n') }
    : { block: false, text: props.machine.draft.slice(a, b) }
  if (cut) {
    const start = range && range[1] === lines.value.length - 1 && a > 0 ? a - 1 : a
    replace(start, b, '')
  } else {
    resetLinePick()
    select(range ? starts.value[range[1]] + lines.value[range[1]].length : b)
  }
}
function paste() {
  const clip = clipboard.value
  if (!clip) return
  const el = area.value
  if (!clip.block) return type(clip.text)
  if (wholeLines.value) {
    const [a,b] = wholeLines.value
    replace(starts.value[a], endOf(b), clip.text + (b + 1 < lines.value.length ? '\n' : ''))
  } else if (el.selectionStart !== el.selectionEnd) {
    type(clip.text)
  } else {
    const i = current.value
    const pos = starts.value[i] + lines.value[i].length
    replace(pos, pos, (lines.value[i] ? '\n' : '') + clip.text)
  }
}
function undo() {
  const last = history.value.pop()
  if (!last) return
  resetLinePick()
  props.machine.draft = last.text
  area.value.value = last.text
  select(last.start, last.end, true)
}
function nativeEdit() {
  resetLinePick()
  props.machine.draft = area.value.value
  syncSelection()
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
      <div ref="gutter" class="gutter" aria-label="选择整行"
        @scroll="area.scrollTop = gutter.scrollTop" @mousedown.prevent>
        <button v-for="(_, i) in lines" :key="i" :aria-label="'选第 ' + (i + 1) + ' 行'"
          :aria-pressed="!!wholeLines && i >= wholeLines[0] && i <= wholeLines[1]" @click="pickLine(i)">{{ i + 1 }}</button>
      </div>
      <textarea ref="area" :value="machine.draft" aria-label="程序文本" inputmode="none" wrap="off"
        spellcheck="false" autocapitalize="off" autocomplete="off"
        @beforeinput="remember" @input="nativeEdit"
        @select="syncSelection" @selectionchange="syncSelection" @click="resetLinePick(); syncSelection()" @keyup="syncSelection"
        @scroll="gutter.scrollTop = area.scrollTop"></textarea>
    </div>
    <div class="keypad" @mousedown.prevent>
      <p class="translation">第 {{ current + 1 }} 行 · {{ translated }}</p>
      <div class="key-row symbols">
        <button v-for="(rune, n) in digits" :key="rune" :aria-label="'输入' + rune" @click="type(rune)">{{ rune }}<small>{{ n }}</small></button>
        <button @click="type('\n')">换行</button>
      </div>
      <div class="key-row editing">
        <button aria-label="光标左移" @click="move(-1)">←</button><button aria-label="光标右移" @click="move(1)">→</button>
        <button @click="erase">退格</button><button @click="duplicate">复制本行</button>
        <button :disabled="!history.length" @click="undo">撤销</button>
      </div>
      <div v-if="selection[0] !== selection[1] || wholeLines || clipboard" class="tools clip">
        <button v-if="selection[0] !== selection[1] || wholeLines" @click="copy(true)">剪切</button>
        <button v-if="selection[0] !== selection[1] || wholeLines" @click="copy(false)">复制</button>
        <button v-if="clipboard" @click="paste">粘贴</button>
      </div>
    </div>
    <p class="hint">点行号选整行，再点末行可选中一段。</p>
    <p v-if="plan.error" class="message">{{ plan.error }}</p>
    <p v-else-if="plan.changes.length" class="hint">
      <span v-for="{rune, delta} in plan.changes" :key="rune">{{ delta > 0n ? '占用' : '归还' }}{{ rune }} {{ delta > 0n ? delta : -delta }}　</span>
    </p>
    <button :disabled="!!plan.error || !plan.changed" @click="install">装入哥雷姆</button>
  </section>
</template>
