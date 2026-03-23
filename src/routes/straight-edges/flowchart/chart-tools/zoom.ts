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
        if (!this.flowchart?.parentElement) return

        if (this.isWithinChart) {
            e.preventDefault()
        } else {
            return
        }

        const zoomIntensity = 0.001
        const delta = -e.deltaY * zoomIntensity
        const zoomFactor = 1 + delta

        const currentZoom = this.flowchart.zoom || 1
        const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.1), 10)

        const svgMouseX = (-this.flowchart.pan.x + this.globalMousePos.x) / currentZoom
        const svgMouseY = (-this.flowchart.pan.y + this.globalMousePos.y) / currentZoom

        this.flowchart.pan.x = -(svgMouseX * newZoom - this.globalMousePos.x)
        this.flowchart.pan.y = -(svgMouseY * newZoom - this.globalMousePos.y)
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
        if (this.flowchart?.parentElement) {
            if (value) {
                this.flowchart.parentElement.classList.add("__isZooming")
            } else {
                this.flowchart.parentElement.classList.remove("__isZooming")
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