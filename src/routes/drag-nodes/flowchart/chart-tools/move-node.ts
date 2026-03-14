import type { Flowchart } from "../index"
import type { FlowchartPos } from "../types"
import type Node  from "../nodes/index"
import Tool from "./index"
import type PanTool from "./pan"
import type { SelectTool } from "./select"

export class MoveNodeTool extends Tool {
    name = "move-node"
    mouseStartPos = undefined as FlowchartPos | undefined
    mouse = { x: 0, y: 0 } as FlowchartPos
    selectedNode = null as Node | null
    selectedNodeStartPos = undefined as FlowchartPos | undefined
    panTool = undefined as PanTool | undefined
    selectTool = undefined as SelectTool | undefined
    
    constructor(flowchart: Flowchart) {
        super(flowchart)

        if (flowchart.el) {
            if (!flowchart.el.classList.contains("__toolMoveNode")) {
                flowchart.el.classList.add("__toolMoveNode")
            }
        }
    }

    #setMouse = (e: MouseEvent) => {
        if (!this.flowchart?.chart) return

        const rect = this.flowchart.chart.getBoundingClientRect()
        const x = (e.clientX - rect.left - this.flowchart.pan.x) / this.flowchart.zoom
        const y = (e.clientY - rect.top  - this.flowchart.pan.y) / this.flowchart.zoom
        this.mouse = { x, y }
    }

    onMouseDown = (e: MouseEvent) => {  
        this.#setMouse(e)
        this.mouseStartPos = undefined
        
        // Check is flowchart has pan tool
        this.panTool = this.flowchart?._tools.find(t => t.name === "pan")?.object as PanTool | undefined
        this.selectTool = this.flowchart?._tools.find(t => t.name === "select")?.object as SelectTool | undefined

        // Check if mouse is within any node
        this.flowchart.nodes.forEach(node => {
            if (this.mouseStartPos) return
            if (node.isHover) {
                this.selectedNode = node
            }
        })
        
        if (this.selectedNode) {
            this.mouseStartPos = { ...this.mouse }
            this.selectedNodeStartPos = { x: Number(this.selectedNode.x), y: Number(this.selectedNode.y) }
            this.selectedNode.isSelected = true
            if (this.panTool) {
                this.panTool.deactivate()
            }

            if (this.selectTool) {
                this.selectTool.deactivate()
            }
        }
    }
    
    onMouseMove = (e: MouseEvent) => {  
        this.#setMouse(e)
        if (!this.mouseDown) return
        if (!this.selectedNode || !this.selectedNodeStartPos) return
        if (!this.mouseStartPos) return

        const deltaX = (this.mouse.x - this.mouseStartPos.x)// * this.flowchart.zoom
        const deltaY = (this.mouse.y - this.mouseStartPos.y)// * this.flowchart.zoom

        if (this.selectedNode) {
            this.selectedNode.x = Number(this.selectedNodeStartPos.x) + deltaX
            this.selectedNode.y = Number(this.selectedNodeStartPos.y) + deltaY
        }
    }

    onMouseUp = (e: MouseEvent) => {  
        this.#setMouse(e)
        this.mouseStartPos = undefined

        if (this.selectedNode) {
            this.selectedNode.isSelected = false
            this.selectedNode = null
        }


        if (this.panTool) {
            this.panTool.activate()
        }

        if (this.selectTool) {
            this.selectTool.activate()
        }
    } 

    destroy() {
        super.destroy()

        if (this.flowchart?.el) {
            this.flowchart.el.classList.remove("__toolMoveNode")
        }
    }
}

export default MoveNodeTool