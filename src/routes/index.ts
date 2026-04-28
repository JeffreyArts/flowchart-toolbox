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
import FitZoom from "./fit-zoom/fit-zoom.vue"
import Segments from "./segments/segments.vue"
import CodeRefactor1 from "./code-refactor-1/code-refactor-1.vue"
import RefactorTools from "./refactor-tools/refactor-tools.vue"
import NodeState from "./node-state/node-state.vue"
import PassingOptions from "./passing-options/passing-options.vue"
import AddNodeTool from "./add-node-tool/add-node-tool.vue"
import PassRegisterOptions from "./pass-register-options/pass-register-options.vue"
import CodeCleanup1 from "./code-cleanup-1/code-cleanup.vue"
import TheSymbols from "./the-symbols.vue"
import JointJS from "./joint-js.vue"
import Cytoscape from "./cytoscape.vue"
import ShapeOutside from "./shape-outside.vue"

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
        path: "/fit-zoom",
        name: "14) Fit Zoom",
        component: FitZoom
    },
    {
        path: "/segments",
        name: "15) Segments",
        component: Segments
    },
    {
        path: "/code-refactor-1",
        name: "16) Code Refactor 1",
        component: CodeRefactor1
    },
    {
        path: "/refactor-tools",
        name: "17) Refactor Tools",
        component: RefactorTools
    },
    {
        path: "/node-state",
        name: "18) Node State",
        component: NodeState
    },
    {
        path: "/passing-options",
        name: "19) Passing options",
        component: PassingOptions
    },
    {
        path: "/add-node-tool",
        name: "20) Add Node Tool",
        component: AddNodeTool
    },
    {
        path: "/pass-register-options",
        name: "21) Pass register options",
        component: PassRegisterOptions
    },
    {
        path: "/code-cleanup-1",
        name: "22) Code cleanup 1",
        component: CodeCleanup1
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
