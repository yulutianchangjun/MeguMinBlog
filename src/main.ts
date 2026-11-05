import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { purgeLegacyTestData } from './lib/cleanup'
import { useProfileStore } from './stores/profile'
import './styles/tokens.css'
import './styles/base.css'
import './styles/prose.css'

purgeLegacyTestData()

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

router.afterEach((to) => {
  useProfileStore(pinia).track(to.fullPath)
})

app.mount('#app')
