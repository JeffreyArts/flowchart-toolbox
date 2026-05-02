import type { Flowchart } from "../index"
import type { FlowchartEventContext } from "../events"
import FlowchartTool from "./index"
import type { FlowchartNode } from "../nodes"

export class MoveNodeTool extends FlowchartTool {
    name = "move-node"
    selectedNodesStartPos = [] as { x: number, y: number, node: FlowchartNode }[]
    
    constructor(flowchart: Flowchart) {
        super(flowchart)

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolMoveNode")) {
                flowchart.parentElement.classList.add("__toolMoveNode")
            }
        }

        this.flowchart.events.add("mouseDown", this.onMouseDown)
        this.flowchart.events.add("mouseMove", this.onMouseMove)
    }
    
    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onMouseDown = (_fec: FlowchartEventContext) => {  
        this.selectedNodesStartPos = []
        if (!this.flowchart.events.isWithinChart) return
        let selectedNode = undefined as FlowchartNode | undefined
        this.flowchart.nodes.filter(node => {
            if (!node.shape) return false
            if (!node.state.selected) return false
            this.selectedNodesStartPos.push({ x: Number(node.x), y: Number(node.y), node: node })
            if (node.shape.containsPoint(this.flowchart.events.mousePos)) {
                selectedNode = node
            }
            return node
        })

        if (!selectedNode) {
            this.selectedNodesStartPos.length = 0
            return
        }
        
        return
    }

    private onMouseMove = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as MouseEvent
        const mouseDown = this.flowchart.events.mouseDown
        const mouseStartPos = this.flowchart.events.mouseStartPos
        const globalMousePos = this.flowchart.events.mousePos
        
        if (!mouseDown) return
        if (!mouseStartPos) return

        let deltaX = (globalMousePos.x - mouseStartPos.x) /// this.flowchart.zoom
        let deltaY = (globalMousePos.y - mouseStartPos.y) /// this.flowchart.zoom
        // If holding shift key only move vertical or horizontal
        if (e.shiftKey) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                deltaY = 0
            } else {
                deltaX = 0
            }
        }
        
        this.selectedNodesStartPos.forEach(pos => {
            // const startPos = this.selectedNodeStartPos ?? { x: Number(node.x), y: Number(node.y) }
            pos.node.x = pos.x + deltaX
            pos.node.y = pos.y + deltaY
        })
    }
}

export default MoveNodeTool