import { reactive } from 'vue'
import { exits, placeById, canTravel } from './map.js'
import { resources, ropewayOpen, fillTrough, collectRune } from './resources.js'

export const fleet = reactive([])
export const capacity = 5
export const digits = ['无', '水', '土', '气', '火']
export const hauling = ['水水', '水水', '土水', '水水', '水土', '土水']

export function newGolem() {
  fleet.push({
    id: fleet.length + 1, location: 'workshop', cargo: [], program: [], draft: '',
    pc: 0, running: false, report: '等待装入符文。',
  })
}

export function operand(line) {
  let value = 0n
  for (const rune of line.slice(1)) value = value * 5n + BigInt(digits.indexOf(rune))
  return value
}

export function runeCost(lines) {
  const cost = {}
  for (const line of lines) {
    for (const rune of line) cost[rune] = (cost[rune] ?? 0n) + 1n
  }
  return cost
}

export function installation(golem) {
  const lines = golem.draft.split('\n')
  // A final newline is a line terminator. Interior empty lines need instructions.
  if (lines.at(-1) === '') lines.pop()
  const invalid = lines.findIndex(line => !/^[水土][无水土气火]+$/u.test(line))
  if (invalid !== -1) return { error: '第 ' + (invalid + 1) + ' 行需要水或土开头，并跟至少一枚数值符文。' }

  const old = runeCost(golem.program)
  const cost = runeCost(lines)
  const changes = []
  const missing = []
  for (const rune of digits) {
    const delta = (cost[rune] ?? 0n) - (old[rune] ?? 0n)
    if (!delta) continue
    changes.push({ rune, delta })
    const shortage = delta - (resources.runes[rune] ?? 0n)
    if (shortage > 0n) missing.push(rune + ' ' + shortage)
  }
  const changed = lines.length !== golem.program.length || lines.some((line, i) => line !== golem.program[i])
  return { lines, changes, changed, error: missing.length ? '还缺：' + missing.join('、') : '' }
}

export function installDraft(golem) {
  const plan = installation(golem)
  if (plan.error || !plan.changed) return
  for (const { rune, delta } of plan.changes) resources.runes[rune] = (resources.runes[rune] ?? 0n) - delta
  golem.running = false
  golem.program = plan.lines
  golem.pc = 0
  golem.report = plan.lines.length ? '新程序已装入，准备从首行执行。' : '程序已卸下，符文已归还。'
}

function interact(golem, slot) {
  if (golem.location === 'mine' && slot === 2n) {
    if (ropewayOpen.value) return { error: '索道已通，水槽已满。' }
    if (!fillTrough(golem.cargo, 1)) return { error: '货舱里没有水符文。' }
    return { message: ropewayOpen.value ? '水轮转动，通往旧窑场的索道已开启。' : '已向索道水槽投入一枚水符文。' }
  }
  if (slot !== 1n) return { error: '这里没有这个编号的交互点。' }
  if (golem.location === 'workshop') {
    if (!golem.cargo.length) return { error: '货舱已空，无法卸货。' }
    const rune = golem.cargo.shift()
    resources.runes[rune]++
    return { message: '已卸下 1 枚' + rune + '符文。' }
  }
  const rune = placeById[golem.location].rune
  if (!rune) return { error: '这里没有采集或卸货设施。' }
  if (golem.cargo.length >= capacity) return { error: '货舱已满，请先卸货。' }
  collectRune(golem.cargo, rune)
  return { message: '已装入 1 枚' + rune + '符文。' }
}

export function step(golem) {
  const line = golem.program[golem.pc]
  if (!line) return
  if (resources.mana < 1n) {
    golem.report = '魔力不足，等候冥想供能。'
    return
  }
  const n = operand(line)
  let outcome
  if (line[0] === '水') {
    const to = exits[golem.location][n]
    if (to && canTravel(golem.location, to)) {
      golem.location = to
      outcome = { message: '已抵达' + placeById[to].label + '。' }
    } else outcome = { error: to ? '索道尚未修复。' : '此处没有 ' + n + ' 号出口。' }
  } else outcome = interact(golem, n)
  golem.report = '第 ' + (golem.pc + 1) + ' 行 · ' + (outcome.error ?? outcome.message)
  if (outcome.error) golem.running = false
  else {
    resources.mana--
    golem.pc = (golem.pc + 1) % golem.program.length
  }
}
