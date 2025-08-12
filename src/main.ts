import "./style.css";
import "virtual:uno.css";
import App from "./App.vue";
import router from "./router";
const app = createApp(App);

// 开发环境下启用Vue DevTools
if (import.meta.env.DEV) {
  app.config.performance = true;
  // Vue DevTools会自动检测开发环境并启用
}

app.use(router);
app.mount("#app");
