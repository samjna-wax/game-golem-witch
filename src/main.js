import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { newGolem, fleet, hauling, installDraft } from './golems.js'
import { resources } from './resources.js'

const editorDemo = import.meta.env.MODE === 'editor-demo'
if (editorDemo) {
  newGolem()
  resources.mana = 60n
  resources.runes.土 = 9n
  resources.runes.水 = 15n
  fleet[0].draft = hauling.join('\n')
  installDraft(fleet[0])
}
createApp(App, { openEditor: editorDemo }).mount('#app')
