import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { newGolem, fleet, hauling, runeCost, installDraft } from './golems.js'
import { resources, ropeway } from './resources.js'

const editorDemo = import.meta.env.MODE === 'editor-demo'
if (editorDemo) {
  newGolem()
  const sample = hauling()
  const cost = runeCost(sample)
  resources.mana = 60n + BigInt(sample.join('').length)
  resources.runes.土 = cost.土 + 6n
  resources.runes.水 = cost.水 + 6n
  fleet[0].draft = sample.join('\n')
  installDraft(fleet[0])
}
const workshopDemo = import.meta.env.MODE === 'workshop-demo'
if (workshopDemo) {
  newGolem()
  fleet[0].draft = [
    '水无', '水无', '水土', '水土', '水水', ...Array(5).fill('土水'),
    '水无', '水无', '水水', '水土', '水火', ...Array(5).fill('土水'),
  ].join('\n')
  ropeway.water = 150
  ropeway.fireFound = true
  resources.runes.土 = 100n
  resources.runes.水 = 50n
  resources.runes.火 = 25n
  resources.mana = 100n
}
const airDemo = import.meta.env.MODE === 'air-demo'
if (airDemo) {
  newGolem()
  ropeway.water = 150
  ropeway.fireFound = true
  resources.runes.水 = 45n
  resources.runes.土 = 35n
  resources.runes.火 = 10n
  resources.mana = 150n
  fleet[0].draft = [
    '水无', '水无', '水土', '水土', '水火', ...Array(3).fill('土水'),
    '水无', '水无', '水水', '水土', '水土', ...Array(3).fill('土水'),
  ].join('\n')
}
createApp(App, { openEditor: editorDemo || airDemo, workshopDemo }).mount('#app')
