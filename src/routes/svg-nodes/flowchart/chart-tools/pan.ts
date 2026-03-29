import type { FlowchartType, FlowchartPos } from "../types"
import Tool from "./index"

export class PanTool extends Tool {
    name = "pan"
    mouseStartPos = undefined as FlowchartPos | undefined
    
    constructor(flowchart: FlowchartType) {
        super(flowchart)

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolPan")) {
                flowchart.parentElement.classList.add("__toolPan")
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

        this.flowchart.pan.x += deltaX
        this.flowchart.pan.y += deltaY

        this.mouseStartPos = { ...this.globalMousePos }
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

        if (this.flowchart?.parentElement) {
            this.flowchart.parentElement.classList.remove("__toolPan")
            this.flowchart.parentElement.classList.remove("__isPanning")
        }
    }
}

export default PanTool