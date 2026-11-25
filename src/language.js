export const digits = ['无', '水', '土', '火', '气']
export const registerNames = digits.slice(1)

function numberOf(runes) {
  let n = 0n
  for (const rune of runes) n = n * 5n + BigInt(digits.indexOf(rune))
  return n
}

export function decode(line) {
  const [op, mode, register] = line
  if (line.length < 2 || ![...line].every(r => digits.includes(r))) return { error: '需要操作符和符文参数。' }
  if (op === '火') {
    if (line.length !== 3 || !['水', '土'].includes(mode) || !registerNames.includes(register))
      return { error: '火水或火土后接一个元素寄存器。' }
    const increment = mode === '水'
    return { op: increment ? 'inc' : 'dec', register, text: register + (increment ? '寄存器加一' : '寄存器尝试减一') }
  }
  if (op === '气') {
    if (line.length < 3 || !['水', '无'].includes(mode)) return { error: '气水或气无后接标签编号。' }
    const target = numberOf(line.slice(2))
    const conditional = mode === '水'
    return { op: conditional ? 'branch' : 'jump', target, text: (conditional ? '减一成功时跳至 ' : '跳至 ') + target }
  }
  const value = numberOf(line.slice(1))
  if (op === '无') return { op: 'label', value, text: '标签 ' + value }
  return op === '水' ? { op: 'move', value, text: '前往本层地点 ' + value }
    : { op: 'use', value, text: '使用交互点 ' + value }
}

export function compile(lines, unlocked) {
  const instructions = []
  const labels = new Map()
  for (const [i, line] of lines.entries()) {
    const item = decode(line)
    const prefix = '第 ' + (i + 1) + ' 行：'
    if (item.error) return { error: prefix + item.error }
    if (!unlocked && !['move', 'use'].includes(item.op)) return { error: prefix + '将首枚气符文运回仓库以解锁这条指令。' }
    if (item.op === 'label') {
      if (labels.has(item.value)) return { error: prefix + '标签 ' + item.value + ' 重复。' }
      labels.set(item.value, i)
    }
    instructions.push(item)
  }
  for (const [i, item] of instructions.entries()) {
    if (item.target === undefined) continue
    if (!labels.has(item.target)) return { error: '第 ' + (i + 1) + ' 行：没有标签 ' + item.target + '。' }
    item.destination = labels.get(item.target)
  }
  return { instructions }
}
