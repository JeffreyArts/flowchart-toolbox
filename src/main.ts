import { createApp } from "vue"
import router from "./routes"
import App from "./App.vue"
// @ts-ignore
import print from "@/console.print"

createApp(App)
    .use(router)
    .mount("#app")
