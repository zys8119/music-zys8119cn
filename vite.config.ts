import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import Unocss from "unocss/vite";
import Devtools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  base: "",
  plugins: [
    Devtools({
      launchEditor: "trae",
    }),
    Unocss(),
    vue({
      template: {
        compilerOptions: {
          // 启用Vue DevTools
          isCustomElement: (tag) => tag.startsWith("vue-devtools"),
        },
      },
    }),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        {
          "naive-ui": [
            "useDialog",
            "useMessage",
            "useNotification",
            "useLoadingBar",
          ],
        },
      ],
      dts: "src/auto-imports.d.ts",
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: "src/components.d.ts",
    }),
  ],
});
