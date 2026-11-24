import roomImage from './assets/witch-room.webp'
import courtyardImage from './assets/courtyard.webp'
import mineImage from './assets/mine.webp'

export const places = [
  {
    id: 'room', label: '房间', title: '魔女的房间',
    image: roomImage, feature: '阁楼书桌', action: '提炼魔力',
  },
  {
    id: 'courtyard', label: '庭院', title: '庭院',
    image: courtyardImage, feature: '魔力之泉', action: '汲取水符文', rune: '水',
  },
  {
    id: 'mine', label: '矿山', title: '附近的矿山',
    image: mineImage, feature: '矿脉采集点', action: '采集土符文', rune: '土',
  },
]

export const paths = [['room', 'courtyard'], ['courtyard', 'mine']]

export function canTravel(from, to) {
  return paths.some(([a, b]) => (from === a && to === b) || (from === b && to === a))
}
