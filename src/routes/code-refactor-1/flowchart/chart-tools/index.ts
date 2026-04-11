import type Flowchart  from "../index"

export class FlowchartTool {
    name = "unknown-tool"
    mouseDown = false
    flowchart: Flowchart
    isWithinChart = false
    isActive = true
    mousePos = { x: 0, y: 0 }
    globalMousePos = { x: 0, y: 0 }

    constructor(flowchart: Flowchart) {
        this.flowchart = flowchart

        if (this.flowchart.parentElement) {
            this.flowchart.parentElement.addEventListener("wheel", this.#onWheel, { passive: false })
        }
        document.addEventListener("mousedown", this.#onMouseDown)
        document.addEventListener("mousemove", this.#onMouseMove)
        document.addEventListener("mouseup", this.#onMouseUp)
    }

    #setWithinChart = (e: MouseEvent) => {
        if (!this.flowchart?.parentElement) return false

        const rect = this.flowchart.parentElement.getBoundingClientRect()
        this.isWithinChart =  (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        )
        return this.isWithinChart
    }

    #setMousePos = (e: MouseEvent) => {
        if (!this.flowchart?.chart) return

        const rect = this.flowchart.chart.getBoundingClientRect()

        const globalX = e.clientX - rect.left
        const globalY = e.clientY - rect.top
        this.globalMousePos = { x: globalX, y: globalY }


        const x = (e.clientX - rect.left - this.flowchart.pan.x) / this.flowchart.zoom
        const y = (e.clientY - rect.top  - this.flowchart.pan.y) / this.flowchart.zoom
        this.mousePos = { x, y }
    }

    #onMouseDown = (e: MouseEvent) => {
        if (!this.isActive) return
        this.#setMousePos(e)
        
        this.mouseDown = true

        if (this.onMouseDown) {
            this.onMouseDown(e)
        }
    }

    #onMouseMove = (e: MouseEvent) => {
        if (!this.isActive) return

        this.#setMousePos(e)
        this.#setWithinChart(e)
        
        if (this.onMouseMove) {
            this.onMouseMove(e)
        }
    }

    #onMouseUp = (e: MouseEvent) => {
        if (!this.isActive) return
        this.#setMousePos(e)

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

export default FlowchartTool