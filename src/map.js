import roomImage from './assets/witch-room.webp'
import courtyardImage from './assets/courtyard.webp'
import workshopImage from './assets/workshop.webp'
import mineImage from './assets/mine.webp'
import { ropewayOpen } from './resources.js'
import { plots } from './buildings.js'

export const layers = { manor: '魔女宅邸', outside: '宅邸外', interior: '工坊内部' }
export const places = [
  { id: 'gate', layer: 'manor', number: 0, label: '宅邸门内侧', door: 'manorDoor', image: courtyardImage },
  { id: 'courtyard', layer: 'manor', number: 1, label: '庭院', feature: '魔力之泉', action: '汲取水符文', rune: '水', image: courtyardImage },
  { id: 'workshopDoor', layer: 'manor', number: 2, label: '工坊门外侧', door: 'workshop', image: workshopImage },
  { id: 'room', layer: 'manor', number: 3, label: '魔女的房间', feature: '阁楼书桌', image: roomImage },
  { id: 'manorDoor', layer: 'outside', number: 0, label: '宅邸门外侧', door: 'gate', image: courtyardImage },
  { id: 'mine', layer: 'outside', number: 1, label: '矿山', feature: '矿脉采集点', action: '采集土符文', rune: '土', image: mineImage },
  { id: 'kiln', layer: 'outside', number: 2, label: '旧窑场', feature: '窑底余烬', action: '拾取火符文', rune: '火', image: workshopImage },
  { id: 'workshop', layer: 'interior', number: 0, label: '工坊门内侧', door: 'workshopDoor', feature: '魔力锻炉', image: workshopImage },
  ...Object.keys(plots).map((id, i) => ({
    id, layer: 'interior', number: i + 1, image: workshopImage,
    get label() {
      return { warehouse: '仓库', furnace: '基础魔力炉' }[plots[id]?.type] ?? '空地'
    },
    get feature() { return '工坊 ' + (i + 1) + ' 号位' },
  })),
]
export const placeById = Object.fromEntries(places.map(p => [p.id, p]))
export const layerPlaces = Object.fromEntries(Object.keys(layers)
  .map(layer => [layer, places.filter(p => p.layer === layer)]))
export const addresses = Object.fromEntries(Object.entries(layerPlaces)
  .map(([layer, nodes]) => [layer, Object.fromEntries(nodes.map(p => [p.number, p.id]))]))

export function canTravel(from, to) {
  return Boolean(placeById[from]) && placeById[from].layer === placeById[to]?.layer && (to !== 'kiln' || ropewayOpen.value)
}
