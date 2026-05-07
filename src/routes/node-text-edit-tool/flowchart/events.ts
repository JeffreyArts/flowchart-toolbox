import Flowchart from "."
import type { FlowchartNode } from "./nodes"

export type FlowchartEventType = "mouseDown" | "mouseMove" | "mouseUp" | "click" | "keyDown" | "keyUp" | "wheel" | "touchStart" | "touchMove" | "touchEnd" | "pinch" | "swipe" | "zoomChange" | "viewBoxChange" | "nodeAdded" | "nodeRemoved" 

export type FlowchartEvent = { 
    eventType: FlowchartEventType,
    handler: (fec: FlowchartEventContext) => void
    priority: number
}

export type FlowchartEventContext = {
    originalEvent?: Event | MouseEvent | KeyboardEvent | FlowchartNodeEvent;
    stopped: boolean;
    stopPropagation(): void;
}

export type FlowchartNodeEvent = {
    node: FlowchartNode
}

export class FlowchartEvents {
    flowchart: Flowchart
    isWithinChart = false

    mouseDown = false
    mousePos = { x: 0, y: 0 }
    mouseStartPos = undefined as { x: number, y: number } | undefined
    globalMousePos = { x: 0, y: 0 }
    globalMouseStartPos = undefined as { x: number, y: number } | undefined
    mouseDelta = { x: 0, y: 0 }

    touchPos: { x: number; y: number }[] = []
    globalTouchPos: { x: number; y: number }[] = []
    touchStartPoints: { x: number; y: number }[] = []
    touchStartDistance = 0
    touchAvg = { x: 0, y: 0 }
    globalTouchAvg = { x: 0, y: 0 }
    touchScale = 1
    touchDelta = { x: 0, y: 0 }

    list = [] as FlowchartEvent[]

    ignore = {
        mouseDown: false,
        mouseMove: false,
        mouseUp: false,
        click: false,
        keyDown: false,
        keyUp: false,
        wheel: false,
        touchStart: false,
        touchMove: false,
        touchEnd: false,
        pinch: false,
        swipe: false,
        nodeAdded: false,
        nodeRemoved: false,
    } as Record<FlowchartEventType, boolean>

    constructor(flowchart: Flowchart) {
        this.flowchart = flowchart

        if (this.flowchart.parentElement) {
            this.flowchart.parentElement.addEventListener("wheel", this.onWheel, { passive: false })
        }
        document.addEventListener("mousedown", this.onMouseDown)
        document.addEventListener("mousemove", this.onMouseMove)
        document.addEventListener("mouseup", this.onMouseUp)
        document.addEventListener("click", this.onClick)
        document.addEventListener("keydown", this.onKeyDown)
        document.addEventListener("keyup", this.onKeyUp)
        document.addEventListener("touchstart", this.onTouchStart, { passive: false })
        document.addEventListener("touchmove", this.onTouchMove, { passive: false })
        document.addEventListener("touchend", this.onTouchEnd)
    }
                                        
    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 
                             
    private dispatch(eventType: FlowchartEventType, e?: Event | FlowchartNodeEvent) {
        if (this.ignore[eventType]) return

        const handlers = this.get(eventType)
        if (handlers.length === 0) return

        const ctx = this.createContext(e)
        for (const event of handlers) {
            if (ctx.stopped) break
            event.handler(ctx)
        }
    }

    private createContext = (originalEvent?: Event | FlowchartNodeEvent): FlowchartEventContext =>{
        const ctx = {
            stopped: false,
            stopPropagation() {
                this.stopped = true
            }
        } as FlowchartEventContext
        
        if (originalEvent) {
            ctx.originalEvent = originalEvent
        }

        return ctx
    }

    private setWithinChart = (e: MouseEvent) => {
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
    
    private setMousePos = (e: MouseEvent) => {
        if (!this.flowchart?.chart) return

        const rect = this.flowchart.chart.getBoundingClientRect()

        const globalX = e.clientX - rect.left
        const globalY = e.clientY - rect.top
        this.globalMousePos = { x: globalX, y: globalY }

        const x = (e.clientX - rect.left - this.flowchart.pan.x) / this.flowchart.zoom
        const y = (e.clientY - rect.top  - this.flowchart.pan.y) / this.flowchart.zoom
        this.mousePos = { x, y }

        if (this.mouseStartPos) {
            this.mouseDelta = { x: x - this.mouseStartPos.x, y: y - this.mouseStartPos.y }
        }
    }

    private setTouch = (e: TouchEvent) => {
        const touches = Array.from(e.touches)
        if (touches.length < 2) {
            return false
        }

        const t1 = touches[0]
        const t2 = touches[1]
        if (!t1 || !t2) return

        const rect = this.flowchart.chart.getBoundingClientRect()

        // Raw + global positions for each finger
        this.touchPos = touches.map(t => ({ x: t.clientX, y: t.clientY }))
        this.globalTouchPos = touches.map(t => ({
            x: t.clientX - rect.left,
            y: t.clientY - rect.top
        }))

        // Average center point
        const avgX = touches.reduce((s, t) => s + t.clientX, 0) / touches.length
        const avgY = touches.reduce((s, t) => s + t.clientY, 0) / touches.length
        this.touchAvg = { x: avgX, y: avgY }
        this.globalTouchAvg = { x: avgX - rect.left, y: avgY - rect.top }

        // Distance between first two fingers
        const dx = t1.clientX - t2.clientX
        const dy = t1.clientY - t2.clientY
        const currentDistance = Math.hypot(dx, dy)

        // Scale + delta relative to start
        this.touchScale = this.touchStartDistance > 0 ? currentDistance / this.touchStartDistance : 1

        const p1 = this.touchStartPoints[0]
        const p2 = this.touchStartPoints[1]
        if (p1 && p2) {
            const prevAvgX = (p1.x + p2.x) / 2
            const prevAvgY = (p1.y + p2.y) / 2
            this.touchDelta = { x: avgX - prevAvgX, y: avgY - prevAvgY }
        }

        // Update start values for next frame
        this.touchStartDistance = currentDistance
        this.touchStartPoints = this.touchPos

        return true
    }

    // █████▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄    ▄▄  ▄▄▄▄ 
    // ██▄▄█▀ ██ ██ ██▄██ ██    ██ ██▀▀▀ 
    // ██     ▀███▀ ██▄█▀ ██▄▄▄ ██ ▀████                                   

    add(eventType: FlowchartEventType, handler: (e: FlowchartEventContext) => void, priority = 0) {
        if (this.get(eventType).find(event => event.priority === priority)) {
            this.add(eventType, handler, priority + 1)
            return
        }
        this.list.push({ eventType, handler, priority })
    }

    get(eventType: FlowchartEventType) {
        return this.list.filter(ev => ev.eventType === eventType).sort((a, b) => a.priority - b.priority)
    }

    trigger(eventType: FlowchartEventType, e?: FlowchartNodeEvent) {
        this.dispatch(eventType, e)
    }

    destroy() {
        document.removeEventListener("mousedown", this.onMouseDown)
        document.removeEventListener("mousemove", this.onMouseMove)
        document.removeEventListener("mouseup", this.onMouseUp)
        document.removeEventListener("click", this.onClick)
        document.removeEventListener("wheel", this.onWheel)
        document.removeEventListener("keydown", this.onKeyDown)
        document.removeEventListener("keyup", this.onKeyUp)
        document.removeEventListener("touchstart", this.onTouchStart)
        document.removeEventListener("touchmove", this.onTouchMove)
        document.removeEventListener("touchend", this.onTouchEnd)

        this.list = []
    }
                                      
    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onMouseDown = (e: MouseEvent) => {
        this.setMousePos(e)
        
        this.mouseDown = true
        this.mouseStartPos = { ...this.mousePos }
        this.globalMouseStartPos = { ...this.globalMousePos }

        this.dispatch("mouseDown", e)
    }

    private onMouseMove = (e: MouseEvent) => {
        this.setMousePos(e)
        this.setWithinChart(e)

        this.dispatch("mouseMove", e)
    }

    private onMouseUp = (e: MouseEvent) => {
        this.setMousePos(e)
        
        this.mouseStartPos = undefined
        this.globalMouseStartPos = undefined
        this.mouseDown = false
        
        this.dispatch("mouseUp", e)
    }

    private onClick = (e: MouseEvent) => {
        this.setMousePos(e)

        this.dispatch("click", e)
    }
    
    private onKeyDown = (e: KeyboardEvent) => {
        this.dispatch("keyDown", e)
    }

    private onKeyUp = (e: KeyboardEvent) => {
        this.dispatch("keyUp", e)
    }

    private onWheel = (e: WheelEvent) => {
        // Check if within chart bounds
        this.setWithinChart(e)

        this.dispatch("wheel", e)
    }

    private onTouchStart = (e: TouchEvent) => {
        this.setTouch(e)

        // Reset start values
        this.touchDelta = { x: 0, y: 0 } // For swipe
        this.touchScale = 1 // For pinch
        this.dispatch("touchStart", e)
    }

    private onTouchMove = (e: TouchEvent) => {
        const pinchTreshold = 0.02  // minimum scale change
        const swipeTreshold = 2     // minimum pixels moved to trigger swipe

        this.setTouch(e)

        if (Math.abs(this.touchScale - 1) > pinchTreshold) {
            this.dispatch("pinch", e)
        }

        if (Math.abs(this.touchDelta.x) > swipeTreshold || Math.abs(this.touchDelta.y) > swipeTreshold) {
            this.dispatch("swipe", e)
        }

        this.dispatch("touchMove", e)
    }

    private onTouchEnd = (e: TouchEvent) => { 
        this.setTouch(e)
        
        this.dispatch("touchEnd", e)
    }
}

export default FlowchartEvents