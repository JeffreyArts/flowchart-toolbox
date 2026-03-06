import Home from "./home.vue"
import OptionsOverview from "./options-overview.vue"
import { createWebHistory, createRouter } from "vue-router"

const routes = [
    {
        path: "/",
        name: "Home",
        component: Home
    },
    {
        path: "/options-overview",
        name: "Options overview",
        component: OptionsOverview
    }
]


const router = createRouter({
    history: createWebHistory(),
    routes,
})

////////////////////////////////////////////////////////////////////////
// IMPORTANT NOTICE
// The code above will be updated via the `yarn new-route` command
// Be cautious when you make custom modifications (it should just work, 
// but just pay extra attention during your commits)
//
// - Jeffrey Arts, July 2024
////////////////////////////////////////////////////////////////////////


export default router
