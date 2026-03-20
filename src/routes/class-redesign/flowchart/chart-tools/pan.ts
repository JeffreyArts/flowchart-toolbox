import type { FlowchartType, FlowchartPos } from "../types"
import Tool from "./index"

export class PanTool extends Tool {
    name = "pan"
    mouseStartPos = undefined as FlowchartPos | undefined
    
    constructor(flowchart: FlowchartType) {
        super(flowchart)

        if (flowchart.el) {
            if (!flowchart.el.classList.contains("__toolPan")) {
                flowchart.el.classList.add("__toolPan")
            }
        }
    }

    onMouseDown = (e: MouseEvent) => {  
        if (!this.isWithinChart) return

        this.mouseStartPos = { ...this.globalMousePos }
    }
    
    onMouseMove = (e: MouseEvent) => {  
        if (!this.mouseDown) return
        if (!this.flowchart) return
        if (!this.mouseStartPos) return

        const deltaX = this.globalMousePos.x - this.mouseStartPos.x
        const deltaY = this.globalMousePos.y - this.mouseStartPos.y

        if (this.flowchart) {
            this.flowchart.pan.x += deltaX
            this.flowchart.pan.y += deltaY
        }
    }

    onMouseUp = (e: MouseEvent) => {  
        this.mouseStartPos = undefined
    }   

    deactivate(): void {
        super.deactivate()
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

export default PanTool