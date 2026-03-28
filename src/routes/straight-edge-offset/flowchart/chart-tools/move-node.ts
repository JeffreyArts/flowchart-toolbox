import type { Flowchart } from "../index"
import type { FlowchartPos } from "../types"
import type Node  from "../nodes/index"
import Tool from "./index"
import type PanTool from "./pan"
import type { SelectTool } from "./select"

export class MoveNodeTool extends Tool {
    name = "move-node"
    mouseStartPos = undefined as FlowchartPos | undefined
    selectedNode = null as Node | null
    selectedNodeStartPos = undefined as FlowchartPos | undefined
    panTool = undefined as PanTool | undefined
    selectTool = undefined as SelectTool | undefined
    
    constructor(flowchart: Flowchart) {
        super(flowchart)

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolMoveNode")) {
                flowchart.parentElement.classList.add("__toolMoveNode")
            }
        }
    }

    

    onMouseDown = (e: MouseEvent) => {  
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
            this.mouseStartPos = { ...this.globalMousePos }
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
        if (!this.mouseDown) return
        if (!this.selectedNode || !this.selectedNodeStartPos) return
        if (!this.mouseStartPos) return

        const deltaX = (this.globalMousePos.x - this.mouseStartPos.x) / this.flowchart.zoom
        const deltaY = (this.globalMousePos.y - this.mouseStartPos.y) / this.flowchart.zoom

        if (this.selectedNode) {
            this.selectedNode.x = Number(this.selectedNodeStartPos.x) + deltaX
            this.selectedNode.y = Number(this.selectedNodeStartPos.y) + deltaY
        }
    }

    onMouseUp = (e: MouseEvent) => {  
        this.mouseStartPos = undefined


        if (this.panTool) {
            this.panTool.activate()
        }

        if (this.selectTool) {
            if (this.selectedNodeStartPos?.x == this.selectedNode?.x && this.selectedNodeStartPos?.y == this.selectedNode?.y) {
                this.selectTool.activate()
                this.selectTool = undefined
            } else {
                setTimeout(() => {
                    if (this.selectTool) {
                        this.selectTool.activate()
                    }
                    this.selectTool = undefined
                })
            }
        }

        if (this.selectedNode) {
            this.selectedNode.isSelected = false
            this.selectedNode = null
            this.selectedNodeStartPos = undefined
        }
    } 

    destroy() {
        super.destroy()

        if (this.flowchart?.parentElement) {
            this.flowchart.parentElement.classList.remove("__toolMoveNode")
        }
    }
}

export default MoveNodeTool