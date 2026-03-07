import type { FlowchartType } from "../types"

export class Tool {
    name = "unknown-tool"
    mouseDown = false
    flowchart = null as FlowchartType | null
    isWithinChart = false
    isActive = true

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
        if (!this.isActive) return

        this.mouseDown = true

        if (this.onMouseDown) {
            this.onMouseDown(e)
        }
    }

    #onMouseMove = (e: MouseEvent) => {
        if (!this.isActive) return

        this.#setWithinChart(e)
        
        if (this.onMouseMove) {
            this.onMouseMove(e)
        }
    }

    #onMouseUp = (e: MouseEvent) => {
        if (!this.isActive) return

        // Get x / y relative to this.flowchart.chart element
        this.mouseDown = false
        
        if (this.onMouseUp) {
            this.onMouseUp(e)
        }
    }

    #onWheel = (e: WheelEvent) => {
        if (!this.isActive) return

        // Check if within chart bounds
        this.#setWithinChart(e)

        if (this.onWheel) {
            this.onWheel(e)
        }
    }

    activate() {
        this.isActive = true
    }

    deactivate() {
        this.isActive = false
    }
    
    onMouseDown = (e: MouseEvent) => {}
    onMouseUp = (e: MouseEvent) => {}
    onMouseMove = (e: MouseEvent) => {}
    onWheel = (e: WheelEvent) => {}

    destroy() {
        document.removeEventListener("mousedown", this.#onMouseDown)
        document.removeEventListener("mousemove", this.#onMouseMove)
        document.removeEventListener("mouseup", this.#onMouseUp)
        document.removeEventListener("wheel", this.#onWheel)
    }
}

export default Tool