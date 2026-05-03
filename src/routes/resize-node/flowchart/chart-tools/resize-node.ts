import Flowchart  from "../index"
import FlowchartTool from "./index"
import FlowchartNode from "../nodes/index"
import type { FlowchartEventContext,  FlowchartNodeEvent } from "../events"

export class ResizeNodeTool extends FlowchartTool {
    name = "resize-node"
    selectedNodes = [] as FlowchartNode[]
    selectionBox = undefined as SVGRectElement | undefined

    options = {
    }

    constructor(flowchart: Flowchart) {
        super(flowchart)
        this.flowchart.events.add("nodeAdded", this.onNodeAdded)
    }

    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 


    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onNodeAdded = (fec: FlowchartEventContext) => {
        if (!fec.originalEvent) return
        const nodeEvent = fec.originalEvent as FlowchartNodeEvent
        const node = nodeEvent.node
        if (!node) return

        node.addEventListener("selected", this.onNodeSelected)
        node.addEventListener("deselected", this.onNodeDeselected)
    }

    private onNodeSelected = (node: FlowchartNode) => {
        if (!this.flowchart) return

        console.log("Node selected", node)   
    }

    private onNodeDeselected = (node: FlowchartNode) => {
        console.log("Node deselected", node)   
    }
}

export default ResizeNodeTool