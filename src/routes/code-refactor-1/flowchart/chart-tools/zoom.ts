import type { FlowchartType, FlowchartPos } from "../types"
import type FlowchartNode from "../nodes/index"
import FlowchartTool from "./index"

export class ZoomTool extends FlowchartTool {
    name = "zoom"
    mouseStartPos = undefined as FlowchartPos | undefined
    isZoomingTimeout = 0
    _isZooming = false
    
    constructor(flowchart: FlowchartType) {
        super(flowchart)
    }

    fit(nodes?: FlowchartNode[]) {
        if (!this.flowchart) return
        if (!nodes) {
            nodes = this.flowchart.nodes
        }
        if (nodes.length === 0) return

        const padding = 0
        const minX = (Math.min(...nodes.map(n => Number(n.x - n.width * this.flowchart.zoom / 2)))) - padding
        const maxX = Math.max(...nodes.map(n => Number(n.x + n.width * this.flowchart.zoom / 2))) + padding
        const minY = Math.min(...nodes.map(n => Number(n.y - n.height * this.flowchart.zoom / 2))) - padding
        const maxY = Math.max(...nodes.map(n => Number(n.y + n.height * this.flowchart.zoom / 2))) + padding

        const chartWidth = this.flowchart.parentElement?.clientWidth || 1
        const chartHeight = this.flowchart.parentElement?.clientHeight || 1

        const zoomX = chartWidth / (maxX - minX)
        const zoomY = chartHeight / (maxY - minY)

        const newZoom = Math.min(zoomX, zoomY, 10)

        this.flowchart.chart.style.transition = "transform 0.3s ease"
        this.flowchart.zoom = newZoom
        this.flowchart.pan.x = (chartWidth - (maxX - minX) * newZoom) / 2 - minX * newZoom
        this.flowchart.pan.y = (chartHeight - (maxY - minY) * newZoom) / 2 - minY * newZoom
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