import type Flowchart from "../index"
import type FlowchartNode from "../nodes/index"
import FlowchartTool from "./index"

export class ZoomTool extends FlowchartTool {
    name = "zoom"
    mouseStartPos = undefined as { x: number, y: number } | undefined
    zKeyDown = false
    isZoomingTimeout = 0
    _isZooming = false

    options = {
        fitPadding: 16,
    }
    
    constructor(flowchart: Flowchart) {
        super(flowchart)
    }

    fit(nodes?: FlowchartNode[]) {
        if (!this.flowchart) return
        if (!nodes) {
            nodes = this.flowchart.nodes
        }
        if (nodes.length === 0) return

        const padding = this.options.fitPadding
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
    private zoomAtCenter(factor: number) {
        if (!this.flowchart?.parentElement) return

        const width = this.flowchart.parentElement.clientWidth
        const height = this.flowchart.parentElement.clientHeight

        this.zoomAt(width / 2, height / 2, factor)
    }

    resetZoom() {
        if (!this.flowchart?.parentElement) return

        const width = this.flowchart.parentElement.clientWidth
        const height = this.flowchart.parentElement.clientHeight

        const centerX = width / 2
        const centerY = height / 2

        const viewBoxCenterX = -this.flowchart.pan.x / this.flowchart.zoom + centerX / this.flowchart.zoom
        const viewBoxCenterY = -this.flowchart.pan.y / this.flowchart.zoom + centerY / this.flowchart.zoom

        this.flowchart.zoom = 1
        this.flowchart.pan.x = -viewBoxCenterX + centerX
        this.flowchart.pan.y = -viewBoxCenterY + centerY
    }

    zoomIn(x: number, y: number, factor = 1.2) {
        this.zoomAt(x, y, factor)
    }

    zoomOut(x: number, y: number, factor = 1.2) {
        this.zoomAt(x, y, 1 / factor)
    }

    private zoomAt(x: number, y: number, factor: number) {
        if (!this.flowchart) return

        const currentZoom = this.flowchart.zoom
        const newZoom = Math.min(Math.max(currentZoom * factor, 0.1), 10)

        const viewBoxX = -this.flowchart.pan.x / currentZoom + x / currentZoom
        const viewBoxY = -this.flowchart.pan.y / currentZoom + y / currentZoom

        this.flowchart.pan.x = -viewBoxX * newZoom + x
        this.flowchart.pan.y = -viewBoxY * newZoom + y
        this.flowchart.zoom = newZoom
    }

    onWheel: (e: WheelEvent) => void = (e) => {
        if (!this.flowchart?.parentElement) return
        if (!e.ctrlKey && !e.metaKey) return

        if (this.isWithinChart) {
            e.preventDefault()
        } else {
            return
        }

        const zoomIntensity = 0.005
        const delta = -e.deltaY * zoomIntensity
        const factor = 1 + delta

        this.zoomAt(this.globalMousePos.x, this.globalMousePos.y, factor)

        this.isZooming = true
        if (this.isZoomingTimeout) {
            clearTimeout(this.isZoomingTimeout)
        }

        this.isZoomingTimeout = setTimeout(() => {
            this.isZooming = false
        }, 100)
    }
    onKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === "z") {
            e.preventDefault()
            if (this.zKeyDown) return
            if (!this.flowchart.parentElement) return
        
            this.zKeyDown = true
            this.flowchart.parentElement.style.cursor = "zoom-in"
        }

        if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
            e.preventDefault()
            this.zoomAtCenter(1.2)
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "-") {
            e.preventDefault()
            this.zoomAtCenter(1 / 1.2)
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "0") {
            e.preventDefault()
            this.fit()
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "1") {
            e.preventDefault()
            this.resetZoom()
        }

        
        if (this.zKeyDown) {
            if (!this.flowchart.parentElement) return

            if (e.altKey) {
                this.flowchart.parentElement.style.cursor = "zoom-out"
            } else {
                this.flowchart.parentElement.style.cursor = "zoom-in"   
            }
        }
    }
    
    onKeyUp = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === "z") {
            this.zKeyDown = false
        }
        
        if (!this.flowchart.parentElement) return

        if (this.zKeyDown) {
            this.flowchart.parentElement.style.cursor = "zoom-in"
        } else {
            this.flowchart.parentElement.style.cursor = ""
        }
    }

    onMouseDown = (e: MouseEvent) => {
        if (!this.isWithinChart) return
        if (!this.zKeyDown) return
        

        if (e.altKey) {
            this.zoomOut(this.globalMousePos.x, this.globalMousePos.y)
        } else {
            this.zoomIn(this.globalMousePos.x, this.globalMousePos.y)
        }
    }

    onPinch = (e: TouchEvent, scale: number) => {
        const t0 = e.touches.item(0)
        const t1 = e.touches.item(1)
        if (!t0 || !t1) return

        const rect = this.flowchart.chart.getBoundingClientRect()
        const midX = (t0.clientX + t1.clientX) / 2 - rect.left
        const midY = (t0.clientY + t1.clientY) / 2 - rect.top

        this.zoomAt(midX, midY, scale)
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