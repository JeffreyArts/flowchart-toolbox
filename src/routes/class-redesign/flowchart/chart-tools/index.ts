import type Flowchart  from "../index"

export class Tool {
    name = "unknown-tool"
    mouseDown = false
    flowchart: Flowchart
    isWithinChart = false
    isActive = true

    constructor(flowchart: Flowchart) {
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