import type { FlowchartType, FlowchartPos } from "../types"
import Tool from "./index"

export class PanTool extends Tool {
    name = "pan"
    mouseDown = false
    mouseStartPos = undefined as FlowchartPos | undefined
    
    constructor(flowchart: FlowchartType) {
        super(flowchart)

        if (flowchart.el) {
            if (!flowchart.el.classList.contains("__toolPan")) {
                flowchart.el.classList.add("__toolPan")
            }
        }
    }
    

    onMouseDown = (pos: FlowchartPos) => {  
        this.mouseDown = true
        this.mouseStartPos = { x: pos.x, y: pos.y }
    }
    
    onMouseMove = (pos: FlowchartPos) => {  
        if (!this.mouseDown) return
        if (!this.flowchart) return
        if (!this.mouseStartPos) return

        const deltaX = pos.x - this.mouseStartPos.x
        const deltaY = pos.y - this.mouseStartPos.y
        
        if (this.flowchart) {
            this.flowchart.pan.x += deltaX
            this.flowchart.pan.y += deltaY
        }
    }

    onMouseUp = () => {
        this.mouseDown = false
        this.mouseStartPos = undefined
    }   

    destroy() {
        super.destroy()

        if (this.flowchart?.el) {
            this.flowchart.el.classList.remove("__toolPan")
            this.flowchart.el.classList.remove("__isPanning")
        }
    }
}