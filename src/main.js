import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { newGolem, fleet, hauling, installDraft } from './golems.js'
import { resources, ropeway } from './resources.js'

const editorDemo = import.meta.env.MODE === 'editor-demo'
if (editorDemo) {
  newGolem()
  resources.mana = 60n
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
createApp(App, { openEditor: editorDemo, workshopDemo }).mount('#app')
