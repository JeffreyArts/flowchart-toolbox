import { createWebHistory, createRouter } from "vue-router"
import CanvasPanning from "./canvas-panning/canvas-panning.vue"
import CanvasZoom from "./canvas-zoom/canvas-zoom.vue"
import Home from "./home.vue"
import OptionsOverview from "./options-overview.vue"
import SelectingNodes from "./selecting-nodes/selecting-nodes.vue"
import TheSymbols from "./the-symbols.vue"

const routes = [
    {
        path: "/",
        name: "Home",
        component: Home
    },
    {
        path: "/the-symbols",
        name: "1) The symbols",
        component: TheSymbols
    },
    {
        path: "/canvas-panning",
        name: "2) Canvas panning",
        component: CanvasPanning
    },
    {
        path: "/canvas-zoom",
        name: "3) Canvas zoom",
        component: CanvasZoom
    },
    {
        path: "/selecting-nodes",
        name: "4) Selecting nodes",
        component: SelectingNodes
    },
    {
        path: "/options-overview",
        name: "Options overview",
        component: OptionsOverview
    },
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
