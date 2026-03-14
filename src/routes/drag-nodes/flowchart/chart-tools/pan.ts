import type { FlowchartType, FlowchartPos } from "../types"
import Tool from "./index"

export class PanTool extends Tool {
    name = "pan"
    mouseStartPos = undefined as FlowchartPos | undefined
    mouse = { x: 0, y: 0 } as FlowchartPos
    
    constructor(flowchart: FlowchartType) {
        super(flowchart)

        if (flowchart.el) {
            if (!flowchart.el.classList.contains("__toolPan")) {
                flowchart.el.classList.add("__toolPan")
            }
        }
    }

    #setMouse = (e: MouseEvent) => {
        if (!this.flowchart?.chart) return

        const x = e.clientX - this.flowchart.chart.getBoundingClientRect().left
        const y = e.clientY - this.flowchart.chart.getBoundingClientRect().top
        this.mouse = { x, y }
    }

    onMouseDown = (e: MouseEvent) => {  
        this.#setMouse(e)
        if (!this.isWithinChart) return

        this.mouseStartPos = { ...this.mouse }
    }
    
    onMouseMove = (e: MouseEvent) => {  
        this.#setMouse(e)
        if (!this.mouseDown) return
        if (!this.flowchart) return
        if (!this.mouseStartPos) return

        const deltaX = this.mouse.x - this.mouseStartPos.x
        const deltaY = this.mouse.y - this.mouseStartPos.y

        if (this.flowchart) {
            this.flowchart.pan.x += deltaX
            this.flowchart.pan.y += deltaY
        }
    }

    onMouseUp = (e: MouseEvent) => {  
        this.#setMouse(e)
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