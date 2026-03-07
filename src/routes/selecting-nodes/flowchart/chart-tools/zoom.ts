import type { FlowchartType, FlowchartPos } from "../types"
import Tool from "./index"

export class ZoomTool extends Tool {
    name = "zoom"
    mouseStartPos = undefined as FlowchartPos | undefined
    isZoomingTimeout = 0
    _isZooming = false
    
    constructor(flowchart: FlowchartType) {
        super(flowchart)
    }
    
    onWheel: (e: WheelEvent) => void = (e) => {
        if (!this.flowchart?.el) return

        if (this.isWithinChart) {
            e.preventDefault()
        } else {
            return
        }
        const rect = this.flowchart.el.getBoundingClientRect()
        const mouseX = e.clientX - rect.left - rect.width / 2
        const mouseY = e.clientY - rect.top - rect.height / 2

        const zoomIntensity = 0.001
        const delta = -e.deltaY * zoomIntensity
        const zoomFactor = 1 + delta

        const currentZoom = this.flowchart.zoom || 1
        const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.1), 10)
        
        this.flowchart.pan.x = mouseX - (mouseX - this.flowchart.pan.x) * (newZoom / currentZoom)
        this.flowchart.pan.y = mouseY - (mouseY - this.flowchart.pan.y) * (newZoom / currentZoom)
        this.flowchart.zoom = newZoom

        this.isZooming = true
        if (this.isZoomingTimeout) {
            clearTimeout(this.isZoomingTimeout)
        }

        this.isZoomingTimeout = setTimeout(() => {
            this.isZooming = false
        }, 100)
    }

    set isZooming(value: boolean) {
        if (this.flowchart?.el) {
            if (value) {
                this.flowchart.el.classList.add("__isZooming")
            } else {
                this.flowchart.el.classList.remove("__isZooming")
            }
        }
        this._isZooming = value
    }

    get isZooming() {
        return this._isZooming
    }
    
    destroy() {
        super.destroy()
    }
}

export default ZoomTool