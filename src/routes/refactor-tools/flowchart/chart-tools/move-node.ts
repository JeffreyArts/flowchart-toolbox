import type { Flowchart } from "../index"
import type { FlowchartPos } from "../types"
import type Node  from "../nodes/index"
import FlowchartTool from "./index"
import type { SelectTool } from "./select"

export class MoveNodeTool extends FlowchartTool {
    name = "move-node"
    mouseStartPos = undefined as FlowchartPos | undefined
    selectedNode = null as Node | null
    selectedNodeStartPos = undefined as FlowchartPos | undefined
    selectTool = undefined as SelectTool | undefined
    keyDown = false
    
    constructor(flowchart: Flowchart) {
        super(flowchart)

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolMoveNode")) {
                flowchart.parentElement.classList.add("__toolMoveNode")
            }
        }
    }

    onKeyDown = (e: KeyboardEvent) => {
        this.keyDown = true
    }

    onKeyUp = (e: KeyboardEvent) => {
        this.keyDown = false
    }

    onMouseDown = () => {  
        if (this.keyDown) return

        this.mouseStartPos = undefined
        const tools = this.flowchart.registered.tools
        
        // Check is flowchart has pan tool
        this.selectTool = tools.find(t => t.type === "select")?.object as SelectTool | undefined

        // Check if mouse is within any node
        this.flowchart.nodes.forEach(node => {
            if (this.mouseStartPos) return
            if (node.mouseOver) {
                this.selectedNode = node
            }
        })
        
        if (this.selectedNode) {
            this.mouseStartPos = { ...this.globalMousePos }
            this.selectedNodeStartPos = { x: Number(this.selectedNode.x), y: Number(this.selectedNode.y) }
            this.selectedNode.isSelected = true

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