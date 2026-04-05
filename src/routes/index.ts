import { createWebHistory, createRouter } from "vue-router"
import CanvasPanning from "./canvas-panning/canvas-panning.vue"
import CanvasZoom from "./canvas-zoom/canvas-zoom.vue"
import Home from "./home.vue"
import OptionsOverview from "./options-overview.vue"
import SelectingNodes from "./selecting-nodes/selecting-nodes.vue"
import ConnectNodes from "./connect-nodes/connect-nodes.vue"
import DragNodes from "./drag-nodes/drag-nodes.vue"
import ClassRedesign from "./class-redesign/class-redesign.vue"
import StraightEdges from "./straight-edges/straight-edges.vue"
import StraightEdgeOffset from "./straight-edge-offset/straight-edge-offset.vue"
import SVGNodes from "./svg-nodes/svg-nodes.vue"
import EdgeVariations from "./edge-variations/edge-variations.vue"
import TheSymbols from "./the-symbols.vue"
import JointJS from "./joint-js.vue"
import Cytoscape from "./cytoscape.vue"
import ShapeOutside from "./shape-outside.vue"
import path from "path"

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
        path: "/connect-nodes",
        name: "5) Connect nodes",
        component: ConnectNodes
    },
    {
        path: "/drag-nodes",
        name: "6) Drag nodes",
        component: DragNodes
    },
    {
        path: "/joint-js",
        name: "7) JointJS",
        component: JointJS
    },
    {
        path: "/cytoscape",
        name: "8) Cytoscape",
        component: Cytoscape
    },
    {
        path: "/class-redesign",
        name: "9) Class redesign",
        component: ClassRedesign
    },
    {
        path: "/straight-edges",
        name: "10) Straight edges",
        component: StraightEdges
    },
    {
        path: "/straight-edge-offset",
        name: "11) Straight edge offset",
        component: StraightEdgeOffset
    },
    {
        path: "/svg-nodes",
        name: "12) SVG Nodes",
        component: SVGNodes
    },
    {
        path: "/shape-outside",
        name: "12.1) Shape outside",
        component: ShapeOutside
    },
    {
        path: "/edge-variations",
        name: "13) Edge variations",
        component: EdgeVariations
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
