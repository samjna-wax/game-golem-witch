export const digits = ['无', '水', '土', '火', '气']
export const registerNames = digits.slice(1)

function numberOf(runes) {
  let n = 0n
  for (const rune of runes) n = n * 5n + BigInt(digits.indexOf(rune))
  return n
}

export function decode(line) {
  const op = line[0]
  if (line.length < 2 || ![...line].every(r => digits.includes(r))) return { error: '需要操作符和符文参数。' }
  const value = numberOf(line.slice(1))
  if (op === '火') {
    if (value === 0n || value >= digits.length) return { error: '火的操作数须为寄存器编号 1 至 4（水、土、火、气）。' }
    const register = digits[value]
    return { op: 'inc', register, text: '选中' + register + '寄存器并加一' }
  }
  if (op === '气') return { op: 'decBranch', target: value, text: '当前寄存器减一，成功跳至 ' + value }
  if (op === '无') return { op: 'label', value, text: '标签 ' + value }
  if (op === '土' && value === 0n) return { error: '交互点从 1 开始。退出当前地图请用水无。' }
  if (op === '水' && value === 0n) return { op: 'move', value, text: '退出当前地图' }
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
