import roomImage from './assets/witch-room.webp'
import courtyardImage from './assets/courtyard.webp'
import workshopImage from './assets/workshop.webp'
import mineImage from './assets/mine.webp'

export const places = [
  {
    id: 'room', parent: 'manor', label: '房间', title: '魔女的房间',
    image: roomImage, feature: '阁楼书桌', action: '提炼魔力',
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
]

export const manor = { id: 'manor', label: '魔女宅邸', entrance: 'gate' }

export const paths = [
  ['room', 'courtyard'], ['room', 'gate'], ['courtyard', 'gate'],
  ['room', 'workshop'], ['courtyard', 'workshop'], ['gate', 'workshop'],
  ['manor', 'mine'],
]

export function arrival(id) {
  return id === manor.id ? manor.entrance : id
}

const travelPaths = paths.map(([a, b]) => [arrival(a), arrival(b)])

export function canTravel(from, to) {
  const target = arrival(to)
  return travelPaths.some(([a, b]) =>
    (from === a && target === b) || (from === b && target === a))
}
