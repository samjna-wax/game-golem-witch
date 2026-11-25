import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { newGolem, fleet, hauling, installDraft } from './golems.js'
import { resources, ropeway } from './resources.js'

const editorDemo = import.meta.env.MODE === 'editor-demo'
if (editorDemo) {
  newGolem()
  resources.mana = 84n // Prepay 24 runes for the sample and leave 60 mana for play.
  resources.runes.土 = 13n
  resources.runes.水 = 16n
  fleet[0].draft = hauling().join('\n')
  installDraft(fleet[0])
}
const workshopDemo = import.meta.env.MODE === 'workshop-demo'
if (workshopDemo) {
  newGolem()
  fleet[0].draft = [
    '水无', '土无', '水无', '土无', '水土', ...Array(5).fill('土水'),
    '水无', '土无', '水土', '土无', '水土', ...Array(5).fill('土水'),
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
    '土无', '水无', '土无', '水土', '土无', '水火', ...Array(3).fill('土水'),
    '水无', '土无', '水无', '土无', '水土', '土无', '水水', ...Array(3).fill('土水'), '水无',
  ].join('\n')
}
createApp(App, { openEditor: editorDemo || airDemo, workshopDemo }).mount('#app')
