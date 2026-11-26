import roomImage from './assets/witch-room.webp'
import courtyardImage from './assets/courtyard.webp'
import workshopImage from './assets/workshop.webp'
import mineImage from './assets/mine.webp'
import { ropewayOpen } from './resources.js'
import { plots } from './buildings.js'

export const layers = { world: '世界地图', manor: '宅邸', interior: '工坊', mountain: '矿山', flue: '旧窑场' }
const nodes = [
  { id: 'manorDoor', layer: 'world', number: 1, label: '宅邸', inside: 'manor', image: courtyardImage },
  { id: 'mountainDoor', layer: 'world', number: 2, label: '矿山', inside: 'mountain', image: mineImage },
  { id: 'courtyard', layer: 'manor', number: 1, label: '庭院', feature: '魔力之泉', action: '汲取水符文', rune: '水', image: courtyardImage },
  { id: 'workshopDoor', layer: 'manor', number: 2, label: '工坊', inside: 'interior', image: workshopImage },
  { id: 'room', layer: 'manor', number: 3, label: '魔女的房间', feature: '阁楼书桌', image: roomImage },
  { id: 'mine', layer: 'mountain', number: 1, label: '矿洞', feature: '矿脉采集点', action: '采集土符文', rune: '土', image: mineImage },
  { id: 'kiln', layer: 'mountain', number: 2, label: '旧窑场', inside: 'flue', image: workshopImage },
  { id: 'embers', layer: 'flue', number: 1, label: '余烬堆', action: '拾取火符文', rune: '火', image: workshopImage },
  { id: 'windWell', layer: 'flue', number: 3, label: '风井', feature: '采集气符文', rune: '气', golemOnly: true, image: mineImage },
  ...Object.keys(plots).map((id, i) => ({
    id, layer: 'interior', number: i + 1, image: workshopImage,
    get label() {
      return { forge: '魔力锻炉', warehouse: '仓库', furnace: '基础魔力炉' }[plots[id]?.type] ?? '空地'
    },
  })),
]
const parentNodes = Object.fromEntries(nodes.filter(p => p.inside).map(p => [p.inside, p]))
// An entry stands inside its layer but has no number or interaction of its own.
const entries = Object.values(parentNodes).map(p => ({
  id: p.inside, layer: p.inside, label: '入口', image: p.image,
}))
export const placeById = Object.fromEntries([...nodes, ...entries].map(p => [p.id, p]))
export const layerPlaces = Object.fromEntries(Object.keys(layers)
  .map(layer => [layer, nodes.filter(p => p.layer === layer)]))

export function locationPath(id) {
  const p = placeById[id]
  let leaf = p.inside ? p.label + '门外' : p.label
  if (p.layer === 'interior' && p.number) leaf = p.number + '（' + p.label + '）'
  const parts = [leaf]
  for (let layer = p.layer; parentNodes[layer]; layer = parentNodes[layer].layer) {
    parts.unshift(layers[layer])
  }
  return [layers.world, ...parts].join(' - ')
}

// Both actors resolve the same local address, including exits and automatic entry.
export function travelTo(from, number, actor = 'witch') {
  const layer = placeById[from].layer
  if (number === 0n) {
    const parent = parentNodes[layer]
    return parent ? { location: parent.id } : { error: '已在世界地图。' }
  }
  const target = layerPlaces[layer].find(p => BigInt(p.number) === number)
  if (!target) return { error: '此处没有 ' + number + ' 号地点。' }
  if (target.id === 'kiln' && !ropewayOpen.value) return { error: '索道尚未修复。' }
  if (target.golemOnly && actor !== 'golem') return { error: '仅哥雷姆通行。' }
  return { location: target.inside ?? target.id }
}
