import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { DkanClientPlugin } from '@dkan-client-tools/vue'

const app = createApp(App)

// Install DKAN Client Plugin
// Use empty baseUrl in development - Vite proxy will forward /api requests to local DDEV DKAN site
app.use(DkanClientPlugin, {
  clientOptions: {
    baseUrl: '',  // Proxy handles this in development (https://dkan.ddev.site)
  }
})

app.mount('#app')
