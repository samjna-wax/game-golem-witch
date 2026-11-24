import roomImage from './assets/witch-room.webp'
import courtyardImage from './assets/courtyard.webp'
import workshopImage from './assets/workshop.webp'
import mineImage from './assets/mine.webp'

import { ropewayOpen } from './resources.js'

export const places = [
  {
    id: 'room', parent: 'manor', label: '房间', title: '魔女的房间',
    image: roomImage, feature: '阁楼书桌',
  },
  {
    id: 'courtyard', parent: 'manor', label: '庭院', title: '庭院',
    image: courtyardImage, feature: '魔力之泉', action: '汲取水符文', rune: '水',
  },
  {
    id: 'workshop', parent: 'manor', label: '工坊', title: '宅邸工坊',
    image: workshopImage, feature: '魔力锻炉',
  },
  {
    id: 'gate', label: '入口', parent: 'manor', title: '宅邸入口',
    image: courtyardImage, feature: '通往矿山的小径',
  },
  {
    id: 'mine', label: '矿山', title: '附近的矿山',
    image: mineImage, feature: '矿脉采集点', action: '采集土符文', rune: '土',
  },
  {
    id: 'kiln', label: '旧窑场', title: '对岸的旧窑场',
    image: workshopImage, feature: '窑底余烬', action: '拾取火符文', rune: '火',
  },
]

export const manor = { id: 'manor', label: '魔女宅邸', entrance: 'gate' }

// Each road owns two stable, local exit numbers; layout changes do not renumber them.
const roads = [
  ['room', 1, 'courtyard', 2], ['room', 2, 'gate', 3], ['courtyard', 3, 'gate', 4],
  ['room', 3, 'workshop', 3], ['courtyard', 1, 'workshop', 2], ['gate', 2, 'workshop', 1],
  ['manor', 1, 'mine', 1], ['mine', 2, 'kiln', 1],
]

export const paths = roads.map(([a, , b]) => [a, b])
export const placeById = Object.fromEntries(places.map(place => [place.id, place]))
export const exits = Object.fromEntries(places.map(place => [place.id, {}]))
for (const [a, portA, b, portB] of roads) {
  exits[arrival(a)][portA] = arrival(b)
  exits[arrival(b)][portB] = arrival(a)
}

export function arrival(id) {
  return id === manor.id ? manor.entrance : id
}

export function canTravel(from, to) {
  return (to !== 'kiln' || ropewayOpen.value) && Object.values(exits[from]).includes(arrival(to))
}
