import { reactive } from 'vue'
import { exits, placeById } from './map.js'
import { resources } from './resources.js'

export const fleet = reactive([])
export const capacity = 3
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
  if (slot !== 1n) return { error: '这里没有这个编号的交互点。' }
  if (golem.location === 'workshop') {
    if (!golem.cargo.length) return { error: '货舱已空，无法卸货。' }
    const rune = golem.cargo.shift()
    resources.runes[rune]++
    return { message: '已卸下 1 枚' + rune + '符文。' }
  }
  const rune = placeById[golem.location].rune
  if (!rune) return { error: '这里没有采集或卸货设施。' }
  if (golem.cargo.length >= capacity) return { error: '货舱已满，需回工坊卸货。' }
  golem.cargo.push(rune)
  return { message: '已装入 1 枚' + rune + '符文。' }
}

export function step(golem) {
  const line = golem.program[golem.pc]
  if (!line) return
  const n = operand(line)
  let outcome
  if (line[0] === '水') {
    const to = exits[golem.location][n]
    if (to) {
      golem.location = to
      outcome = { message: '已抵达' + placeById[to].label + '。' }
    } else outcome = { error: '此处没有 ' + n + ' 号出口。' }
  } else outcome = interact(golem, n)
  golem.report = '第 ' + (golem.pc + 1) + ' 行 · ' + (outcome.error ?? outcome.message)
  if (outcome.error) golem.running = false
  else golem.pc = (golem.pc + 1) % golem.program.length
}
