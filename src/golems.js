import { reactive } from 'vue'
import { addresses, placeById, canTravel } from './map.js'
import { resources, manaCapacity, runeSpace, ropewayOpen, fillTrough, collectRune } from './resources.js'

import { plots, feedFurnace } from './buildings.js'

import { digits, compile, registerNames } from './language.js'

export const fleet = reactive([])
export const recallCost = 10n
export const capacity = 5
function emptyRegisters() {
  return Object.fromEntries(registerNames.map(name => [name, 0n]))
}
export function hauling() {
  const warehouse = Object.keys(plots).find(id => plots[id]?.type === 'warehouse')
  const destination = digits[placeById[warehouse].number]
  return ['土无', '水无', '土无', '水水', '土水', '水无', '土无', '水土', '土无', '水' + destination, '土水', '水无']
}

export function newGolem() {
  fleet.push({
    id: fleet.length + 1, location: 'workshop', cargo: [], program: [], draft: '',
    pc: 0, instructions: [], registers: emptyRegisters(), condition: false, running: false, report: '等待装入符文。',
  })
}

export function canRecall(golem) {
  return resources.mana >= recallCost &&
    (golem.location !== 'workshop' || golem.cargo.length > 0 || golem.running || golem.pc !== 0)
}

export function recall(golem) {
  if (!canRecall(golem)) return
  resources.mana -= recallCost
  golem.location = 'workshop'
  golem.cargo.length = 0
  golem.running = false
  golem.pc = 0
  golem.registers = emptyRegisters()
  golem.condition = false
  golem.report = '已回到工坊，货舱已清空。'
}

export function runeCost(lines) {
  const cost = {}
  for (const line of lines) {
    for (const rune of line) {
      if (rune !== '无') cost[rune] = (cost[rune] ?? 0n) + 1n
    }
  }
  return cost
}

export function installation(golem) {
  const lines = golem.draft.split('\n')
  // A final newline is a line terminator. Interior empty lines need instructions.
  if (lines.at(-1) === '') lines.pop()
  const compiled = compile(lines, resources.airReturned)
  if (compiled.error) return compiled

  const old = runeCost(golem.program)
  const cost = runeCost(lines)
  const changes = []
  const missing = []
  for (const rune of digits) {
    const delta = (cost[rune] ?? 0n) - (old[rune] ?? 0n)
    if (!delta) continue
    const overflow = -delta > runeSpace(rune) ? -delta - runeSpace(rune) : 0n
    changes.push({ rune, delta, overflow })
    const shortage = delta - (resources.runes[rune] ?? 0n)
    if (shortage > 0n) missing.push(rune + ' ' + shortage)
  }
  const changed = lines.length !== golem.program.length || lines.some((line, i) => line !== golem.program[i])
  const length = lines.reduce((total, line) => total + line.length, 0)
  const manaCost = changed ? BigInt(length) : 0n
  if (manaCost > manaCapacity) missing.push('魔力容量 ' + (manaCost - manaCapacity) + '（上限 ' + manaCapacity + '）')
  else if (manaCost > resources.mana) missing.push('魔力 ' + (manaCost - resources.mana))
  return { lines, instructions: compiled.instructions, changes, changed, length, manaCost, error: missing.length ? '还缺：' + missing.join('、') : '' }
}

export function installDraft(golem) {
  const plan = installation(golem)
  if (plan.error || !plan.changed) return false
  resources.mana -= plan.manaCost
  for (const { rune, delta, overflow } of plan.changes) resources.runes[rune] = (resources.runes[rune] ?? 0n) - delta - overflow
  golem.running = false
  golem.program = plan.lines
  golem.instructions = plan.instructions
  golem.pc = 0
  golem.registers = emptyRegisters()
  golem.condition = false
  golem.report = plan.lines.length ? '新程序已装入，准备从首行执行。' : '程序已卸下，可收纳的符文已归还。'
  return true
}

function interact(golem, slot) {
  if (slot === 0n) {
    const otherSide = placeById[golem.location].door
    if (!otherSide) return { error: '此处没有可穿过的门。' }
    golem.location = otherSide
    return { message: '已穿门至' + placeById[otherSide].label + '。' }
  }
  if (golem.location === 'mine' && slot === 2n) {
    if (ropewayOpen.value) return { error: '索道已通，水槽已满。' }
    if (!fillTrough(golem.cargo, 1)) return { error: '货舱里没有水符文。' }
    return { message: ropewayOpen.value ? '水轮转动，通往旧窑场的索道已开启。' : '已向索道水槽投入一枚水符文。' }
  }
  if (slot !== 1n) return { error: '这里没有这个编号的交互点。' }
  if (plots[golem.location]?.type === 'furnace') {
    return feedFurnace(golem.location, golem.cargo)
      ? { message: '已向炉中投入 1 枚火符文。' } : { error: '货舱里没有火符文。' }
  }
  if (plots[golem.location]?.type === 'warehouse') {
    if (!golem.cargo.length) return { error: '货舱已空，无法卸货。' }
    const rune = golem.cargo[0]
    if (runeSpace(rune) === 0n) return { error: rune + '符文库存已满，货物留在舱内。' }
    golem.cargo.shift()
    resources.runes[rune]++
    if (rune === '气' && !resources.airReturned) {
      resources.airReturned = true
      return { message: '首枚气符文已入库，已解锁运算与跳转。' }
    }
    return { message: '已卸下 1 枚' + rune + '符文。' }
  }
  const rune = placeById[golem.location].rune
  if (!rune) return { error: '这里没有采集或卸货设施。' }
  if (golem.cargo.length >= capacity) return { error: '货舱已满，请先卸货。' }
  collectRune(golem.cargo, rune)
  return { message: '已装入 1 枚' + rune + '符文。' }
}

export function step(golem) {
  const item = golem.instructions[golem.pc]
  if (!item) return
  if (resources.mana < 1n) {
    golem.report = '魔力不足，等候冥想供能。'
    return
  }
  const n = item.value
  let next = (golem.pc + 1) % golem.program.length
  let outcome = { message: item.text }
  if (item.op === 'move') {
    const to = addresses[placeById[golem.location].layer][n]
    if (to && canTravel(golem.location, to, 'golem')) {
      golem.location = to
      outcome = { message: '已抵达' + placeById[to].label + '。' }
    } else outcome = { error: to ? '索道尚未修复。' : '此处没有 ' + n + ' 号地点。' }
  } else if (item.op === 'use') {
    outcome = interact(golem, n)
  } else if (item.op === 'inc') {
    golem.registers[item.register]++
  } else if (item.op === 'dec') {
    golem.condition = golem.registers[item.register] > 0n
    if (golem.condition) golem.registers[item.register]--
    outcome.message += golem.condition ? '成功。' : '失败（值为零）。'
  } else if (item.op === 'jump' || (item.op === 'branch' && golem.condition)) {
    next = item.destination
    outcome.message = '跳至标签 ' + item.target + '。'
  } else if (item.op === 'branch') {
    outcome.message = '条件为假，继续下一行。'
  }
  golem.report = '第 ' + (golem.pc + 1) + ' 行 · ' + (outcome.error ?? outcome.message)
  if (outcome.error) golem.running = false
  else {
    resources.mana--
    golem.pc = next
  }
}
