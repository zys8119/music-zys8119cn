import { createApp } from 'vue'
import { create } from 'naive-ui'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import router from './router'

const naive = create()
const app = createApp(App)

app.use(naive)
app.use(router)
app.mount('#app')
