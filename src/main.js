import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'

// Create and mount the app
const app = createApp(App)
app.use(router)
app.mount('#app')