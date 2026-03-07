import type { FlowchartType, FlowchartPos } from "../types"

export class Tool {
    name = "unknown-tool"
    flowchart = null as FlowchartType | null

    constructor(flowchart: FlowchartType) {
        this.flowchart = flowchart

        document.addEventListener("mousedown", this.#onMouseDown)
        document.addEventListener("mousemove", this.#onMouseMove)
        document.addEventListener("mouseup", this.#onMouseUp)
    }

    #onMouseDown = (e: MouseEvent) => {
        // Get x / y relative to this.flowchart.chart element
        const x = e.clientX - (this.flowchart?.chart.getBoundingClientRect().left || 0)
        const y = e.clientY - (this.flowchart?.chart.getBoundingClientRect().top || 0)
        
        if (this.onMouseDown) {
            this.onMouseDown({ x, y })
        }
    }

    #onMouseMove = (e: MouseEvent) => {
        // Get x / y relative to this.flowchart.chart element
        const x = e.clientX - (this.flowchart?.chart.getBoundingClientRect().left || 0)
        const y = e.clientY - (this.flowchart?.chart.getBoundingClientRect().top || 0)
        
        if (this.onMouseMove) {
            this.onMouseMove({ x, y })
        }
    }

    #onMouseUp = (e: MouseEvent) => {
        // Get x / y relative to this.flowchart.chart element
        const x = e.clientX - (this.flowchart?.chart.getBoundingClientRect().left || 0)
        const y = e.clientY - (this.flowchart?.chart.getBoundingClientRect().top || 0)
        
        if (this.onMouseUp) {
            this.onMouseUp({ x, y })
        }
    }

    
    onMouseDown = (pos: FlowchartPos) => {}
    onMouseUp = (pos: FlowchartPos) => {}
    onMouseMove = (pos: FlowchartPos) => {}

    destroy() {
        document.removeEventListener("mousedown", this.#onMouseDown)
        document.removeEventListener("mousemove", this.#onMouseMove)
        document.removeEventListener("mouseup", this.#onMouseUp)
    }
}

export default Tool