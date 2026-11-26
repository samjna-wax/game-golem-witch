import { reactive } from 'vue'
import { placeById, locationPath, travelTo } from './map.js'
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
  return ['水无', '水无', '水土', '水水', '土水', '水无', '水水', '水土', '水' + destination, '土水']
}

export function newGolem() {
  fleet.push({
    id: fleet.length + 1, initialized: true, location: 'interior', cargo: [], program: [], draft: '',
    pc: 0, instructions: [], registers: emptyRegisters(), currentRegister: '水', running: false, blocked: false, report: '等待装入符文。',
  })
}

export function canRecall(golem) {
  return !golem.initialized && resources.mana >= recallCost
}

export function recall(golem) {
  if (!canRecall(golem)) return
  resources.mana -= recallCost
  golem.location = 'interior'
  golem.cargo.length = 0
  golem.running = false
  golem.blocked = false
  golem.pc = 0
  golem.registers = emptyRegisters()
  golem.currentRegister = '水'
  golem.initialized = true
  golem.report = '已回到工坊并重置，可以编辑符文。'
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
  if (!golem.initialized) return { error: '请先重置哥雷姆再编辑符文。' }
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
  golem.blocked = false
  golem.initialized = plan.lines.length === 0
  golem.program = plan.lines
  golem.instructions = plan.instructions
  golem.pc = 0
  golem.registers = emptyRegisters()
  golem.currentRegister = '水'
  golem.report = plan.lines.length ? '新程序已装入，准备从首行执行。' : '程序已卸下，可收纳的符文已归还。'
  return true
}

function interact(golem, slot) {
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
  golem.initialized = false
  if (resources.mana < 1n) {
    golem.blocked = true
    golem.report = '魔力不足，等候供能。'
    return
  }
  const n = item.value
  let next = (golem.pc + 1) % golem.program.length
  let outcome = { message: item.text }
  if (item.op === 'move') {
    const move = travelTo(golem.location, n, 'golem')
    if (move.error) outcome = move
    else {
      golem.location = move.location
      outcome = { message: '已抵达' + locationPath(move.location) + '。' }
    }
  } else if (item.op === 'use') {
    outcome = interact(golem, n)
  } else if (item.op === 'inc') {
    golem.currentRegister = item.register
    golem.registers[item.register]++
  } else if (item.op === 'decBranch') {
    const r = golem.currentRegister
    if (golem.registers[r] > 0n) {
      golem.registers[r]--
      next = item.destination
      outcome.message = r + '寄存器减一，跳至标签 ' + item.target + '。'
    } else {
      outcome.message = r + '寄存器为零，继续下一行。'
    }
  }
  golem.report = '第 ' + (golem.pc + 1) + ' 行 · ' + (outcome.error ?? outcome.message)
  golem.blocked = Boolean(outcome.error)
  if (!outcome.error) {
    resources.mana--
    golem.pc = next
  }
}
