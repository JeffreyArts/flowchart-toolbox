import type Flowchart from "../index"
import type FlowchartNode from "../nodes/index"
import type { FlowchartEventContext } from "../events"
import FlowchartTool from "./index"

export type ZoomToolOptions = {
    fitPadding: number
    pinchZooming: boolean
    zHotkeyZooming: boolean
    cmdZooming: boolean
    cmdFit: boolean
    cmdReset: boolean
    scrollZooming: boolean
}

export class ZoomTool extends FlowchartTool {
    name = "zoom"
    isZoomingTimeout = 0

    state = {
        active: true,
        zooming: false,
        zKeyDown: false
    }

    options = new Proxy<ZoomToolOptions>({
        fitPadding: 16,
        // Different methods of zooming
        pinchZooming: true,
        zHotkeyZooming: true,
        cmdZooming: true,
        cmdFit: true,
        cmdReset: true,
        scrollZooming: true,
    }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value
            return true
        }
    })
    
    constructor(flowchart: Flowchart, options?: Partial<ZoomToolOptions>) {
        super(flowchart)

        this.updateOptions(options)

        this.flowchart.events.add("wheel", this.onWheel)
        this.flowchart.events.add("keyDown", this.onKeyDown)
        this.flowchart.events.add("keyUp", this.onKeyUp)
        this.flowchart.events.add("mouseDown", this.onMouseDown)
    }

    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 

    private updateOptions(options?: Partial<ZoomToolOptions>) {
        if (options) {
            Object.assign(this.options, options)
        }
    }

    // █████▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄    ▄▄  ▄▄▄▄ 
    // ██▄▄█▀ ██ ██ ██▄██ ██    ██ ██▀▀▀ 
    // ██     ▀███▀ ██▄█▀ ██▄▄▄ ██ ▀████  

    zoomAtCenter(factor: number) {
        if (!this.flowchart?.parentElement) return

        const width = this.flowchart.parentElement.clientWidth
        const height = this.flowchart.parentElement.clientHeight

        this.zoomAt(width / 2, height / 2, factor)
    }

    zoomAt(x: number, y: number, factor: number) {
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
        const minX = (Math.min(...nodes.map(n => Number(n.x - n.width / 2)))) - padding
        const maxX = Math.max(...nodes.map(n => Number(n.x + n.width / 2))) + padding
        const minY = Math.min(...nodes.map(n => Number(n.y - n.height / 2))) - padding
        const maxY = Math.max(...nodes.map(n => Number(n.y + n.height / 2))) + padding

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

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onWheel = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        
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
            
            this.state.zooming = true
            if (this.isZoomingTimeout) {
                clearTimeout(this.isZoomingTimeout)
            }
            
            this.isZoomingTimeout = setTimeout(() => {
                this.state.zooming = false
            }, 100)
        }
    }

    private onKeyDown = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as KeyboardEvent

        // If an input or textarea is focused, ignore events for zooming
        const activeElement = document.activeElement
        if (activeElement && (activeElement.nodeName == "INPUT" || activeElement.nodeName == "TEXTAREA" )) return

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
            
            if (this.state.zKeyDown) {
                if (e.altKey) {
                    this.flowchart.parentElement.style.cursor = "zoom-out"
                } else {
                    this.flowchart.parentElement.style.cursor = "zoom-in"   
                }
            }

            if (e.code === "KeyZ") {
                e.preventDefault()
                if (this.state.zKeyDown) return
                
                this.state.zKeyDown = true
                this.flowchart.parentElement.style.cursor = "zoom-in"
            }
        }
    }
    
    private onKeyUp = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as KeyboardEvent
        if (this.options.zHotkeyZooming) { 
            if (!this.flowchart.parentElement) return

            if (e.code === "KeyZ") {
                this.state.zKeyDown = false
            }
            
            if (this.state.zKeyDown) {
                this.flowchart.parentElement.style.cursor = "zoom-in"
            } else {
                this.flowchart.parentElement.style.cursor = ""
            }
        }
    }

    private onMouseDown = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as MouseEvent
        if (!this.flowchart.events.isWithinChart) return

        if (this.options.zHotkeyZooming) { 
            if (!this.state.zKeyDown) return
        
            if (e.altKey) {
                this.zoomOut(this.flowchart.events.globalMousePos.x, this.flowchart.events.globalMousePos.y)
            } else {
                this.zoomIn(this.flowchart.events.globalMousePos.x, this.flowchart.events.globalMousePos.y)
            }
        }
    }

    private onPinch = (_fec: FlowchartEventContext) => {
        if (!this.state.active) return
        if (!this.flowchart.events.isWithinChart) return
        
        if (this.options.pinchZooming) {
            const { globalTouchAvg, touchScale } = this.flowchart.events
            this.zoomAt(globalTouchAvg.x, globalTouchAvg.y, touchScale)
        }
    }
}

export default ZoomTool