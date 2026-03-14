import type { FlowchartType, FlowchartPos } from "../types"
import Tool from "./index"

export class SelectTool extends Tool {
    name = "select"
    mouseStartPos = undefined as FlowchartPos | undefined
    startPan = { x: 0, y: 0 } as FlowchartPos

    onClick = undefined as ((e: MouseEvent) => void) | undefined
    
    constructor(flowchart: FlowchartType) {
        super(flowchart)

        if (flowchart.el) {
            if (!flowchart.el.classList.contains("__toolSelect")) {
                flowchart.el.classList.add("__toolSelect")
            }
        }

        if (flowchart.el) {
            flowchart.el.addEventListener("click", this.#onClick)
        }
    }

    onMouseDown: (e: MouseEvent) => void = (_e) => {  
        this.startPan = { ...this.flowchart.pan } as FlowchartPos
    }

    #onClick = (e: MouseEvent) => {
        if (!this.isActive) return

        if (this.startPan.x !== this.flowchart.pan.x || this.startPan.y !== this.flowchart.pan.y) {
            // If pan has changed since mouse down, don't trigger click event (prevents click when panning)
            return
        }

        if (this.onClick) {
            this.onClick(e)
        }
    }

    destroy() {
        super.destroy()

        if (this.flowchart?.el) {
            this.flowchart.el.classList.remove("__toolSelect")
            this.flowchart.el.removeEventListener("click", this.#onClick)
        }
    }
}

export default SelectTool