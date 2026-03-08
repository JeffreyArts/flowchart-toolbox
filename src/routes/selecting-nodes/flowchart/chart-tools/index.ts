import type { FlowchartType } from "../types"

export class Tool {
    name = "unknown-tool"
    mouseDown = false
    flowchart = null as FlowchartType | null
    isWithinChart = false

    constructor(flowchart: FlowchartType) {
        this.flowchart = flowchart

        if (this.flowchart.el) {
            this.flowchart.el.addEventListener("wheel", this.#onWheel, { passive: false })
        }
        document.addEventListener("mousedown", this.#onMouseDown)
        document.addEventListener("mousemove", this.#onMouseMove)
        document.addEventListener("mouseup", this.#onMouseUp)
    }

    #setWithinChart = (e: MouseEvent) => {
        if (!this.flowchart?.el) return false

        const rect = this.flowchart.el.getBoundingClientRect()
        this.isWithinChart =  (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        )
        return this.isWithinChart
    }

    #onMouseDown = (e: MouseEvent) => {

        this.mouseDown = true

        if (this.onMouseDown) {
            this.onMouseDown(e)
        }
    }

    #onMouseMove = (e: MouseEvent) => {
        this.#setWithinChart(e)
        
        if (this.onMouseMove) {
            this.onMouseMove(e)
        }
    }

    #onMouseUp = (e: MouseEvent) => {
        // Get x / y relative to this.flowchart.chart element
        this.mouseDown = false
        
        if (this.onMouseUp) {
            this.onMouseUp(e)
        }
    }

    #onWheel = (e: WheelEvent) => {
        // Check if within chart bounds
        this.#setWithinChart(e)

        if (this.onWheel) {
            this.onWheel(e)
        }
    }
    
    onMouseDown = (_e: MouseEvent) => {}
    onMouseUp = (_e: MouseEvent) => {}
    onMouseMove = (_e: MouseEvent) => {}
    onWheel = (_e: WheelEvent) => {}

    destroy() {
        document.removeEventListener("mousedown", this.#onMouseDown)
        document.removeEventListener("mousemove", this.#onMouseMove)
        document.removeEventListener("mouseup", this.#onMouseUp)
        document.removeEventListener("wheel", this.#onWheel)
    }
}

export default Tool