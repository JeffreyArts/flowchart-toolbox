import type Flowchart from "../index"
import type FlowchartNode from "../nodes/index"
import type { FlowchartEventContext } from "../events"
import FlowchartTool from "./index"
import type { K } from "vue-router/dist/index-DFCq6eJK.js"

export class ZoomTool extends FlowchartTool {
    name = "zoom"
    mouseStartPos = undefined as { x: number, y: number } | undefined
    zKeyDown = false
    isZoomingTimeout = 0
    _isZooming = false

    options = {
        fitPadding: 16,
        // Different methods of zooming
        pinchZooming: true,
        zHotkeyZooming: true,
        cmdZooming: true,
        cmdFit: true,
        cmdReset: true,
        scrollZooming: true,
    }
    
    constructor(flowchart: Flowchart) {
        super(flowchart)

        this.flowchart.events.add("wheel", this.onWheel)
        this.flowchart.events.add("keyDown", this.onKeyDown)
        this.flowchart.events.add("keyUp", this.onKeyUp)
        this.flowchart.events.add("mouseDown", this.onMouseDown)
    }

    private zoomAtCenter(factor: number) {
        if (!this.flowchart?.parentElement) return

        const width = this.flowchart.parentElement.clientWidth
        const height = this.flowchart.parentElement.clientHeight

        this.zoomAt(width / 2, height / 2, factor)
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
    

    onWheel = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as WheelEvent
        if (!this.flowchart?.parentElement) return
        if (this.flowchart.events.isWithinChart) {
            e.preventDefault()
        } else {
            return
        }
        
        // If ctrl or meta key is held, zoom 
        if (this.options.scrollZooming) {
            if (!e.ctrlKey && !e.metaKey) return
            const zoomIntensity = 0.005
            const delta = -e.deltaY * zoomIntensity
            const factor = 1 + delta
            
            this.zoomAt(this.flowchart.events.globalMousePos.x, this.flowchart.events.globalMousePos.y, factor)
            
            this.isZooming = true
            if (this.isZoomingTimeout) {
                clearTimeout(this.isZoomingTimeout)
            }
            
            this.isZoomingTimeout = setTimeout(() => {
                this.isZooming = false
            }, 100)
        }
    }

    onKeyDown = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as KeyboardEvent
        
        // Zoom with cmd/ctrl + +/-
        if (this.options.cmdZooming) {
            if ((e.ctrlKey || e.metaKey) && (e.code === "Equal" || e.code === "NumpadAdd")) {
                e.preventDefault()
                this.zoomAtCenter(1.2)
            }

            if ((e.ctrlKey || e.metaKey) && (e.code === "Minus" || e.code === "NumpadSubtract")) {
                e.preventDefault()
                this.zoomAtCenter(1 / 1.2)
            }
        }

        // Fit with cmd/ctrl + 0
        if (this.options.cmdFit) {
            if ((e.ctrlKey || e.metaKey) && e.code === "Digit0") {
                e.preventDefault()
                this.fit()
            }
        }

        // Reset with cmd/ctrl + 1
        if (this.options.cmdReset) {
            if ((e.ctrlKey || e.metaKey) && e.code === "Digit1") {
                e.preventDefault()
                this.resetZoom()
            }
        }

        // Allow zooming via clicking when Z key is held down (zoom-out when alt is also held)
        if (this.options.zHotkeyZooming) {
            if (!this.flowchart.parentElement) return
            
            if (this.zKeyDown) {
                if (e.altKey) {
                    this.flowchart.parentElement.style.cursor = "zoom-out"
                } else {
                    this.flowchart.parentElement.style.cursor = "zoom-in"   
                }
            }

            if (e.code === "KeyZ") {
                e.preventDefault()
                if (this.zKeyDown) return
                
                this.zKeyDown = true
                this.flowchart.parentElement.style.cursor = "zoom-in"
            }
        }
    }
    
    onKeyUp = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as KeyboardEvent
        if (this.options.zHotkeyZooming) { 
            if (!this.flowchart.parentElement) return

            if (e.code === "KeyZ") {
                this.zKeyDown = false
            }
            
            if (this.zKeyDown) {
                this.flowchart.parentElement.style.cursor = "zoom-in"
            } else {
                this.flowchart.parentElement.style.cursor = ""
            }
        }
    }

    onMouseDown = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as MouseEvent
        if (!this.flowchart.events.isWithinChart) return

        if (this.options.zHotkeyZooming) { 
            if (!this.zKeyDown) return
        
            if (e.altKey) {
                this.zoomOut(this.flowchart.events.globalMousePos.x, this.flowchart.events.globalMousePos.y)
            } else {
                this.zoomIn(this.flowchart.events.globalMousePos.x, this.flowchart.events.globalMousePos.y)
            }
        }
    }

    onPinch = (_fec: FlowchartEventContext) => {
        if (!this.flowchart.events.isWithinChart) return
        
        if (this.options.pinchZooming) {
            const { globalTouchAvg, touchScale } = this.flowchart.events
            this.zoomAt(globalTouchAvg.x, globalTouchAvg.y, touchScale)
        }
    }
}

export default ZoomTool