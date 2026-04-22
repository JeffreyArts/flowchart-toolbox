import type { Flowchart } from "../index"
import FlowchartTool from "./index"
import type { FlowchartEventContext } from "../events"

// Allows you to pan the viewbox via the follow UX
// 1. Hold space bar and then click + drag
// 2. Scroll horizontally/vertically with mouse and/or trackpad
// 3. Hold middle mouse button and then click + drag (untested)
// 4. Use two fingers to swipe on touch devices (untested)
// 
export class PanTool extends FlowchartTool {
    name = "pan"
    mouseStartPos = undefined as { x: number, y: number } | undefined
    spaceBarDown = false
    options = {
        spaceBarPanning: true,
        middleMousePanning: true,
        touchSwipePanning: true,
        scrollPanning: true,
    }
    
    constructor(flowchart: Flowchart, options?: Partial<PanTool["options"]>) {
        super(flowchart)

        if (options) {
            this.options = { ...this.options, ...options }
        }

        if (this.flowchart.parentElement) {
            if (!this.flowchart.parentElement.classList.contains("__toolPan")) {
                this.flowchart.parentElement.classList.add("__toolPan")
            }
        }

        this.flowchart.events.add("wheel", this.onWheel)
        this.flowchart.events.add("keyDown", this.onKeyDown)
        this.flowchart.events.add("keyUp", this.onKeyUp)
        this.flowchart.events.add("mouseDown", this.onMouseDown)
        this.flowchart.events.add("mouseMove", this.onMouseMove)
        this.flowchart.events.add("mouseUp", this.onMouseUp)
    }

    onKeyDown = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as KeyboardEvent

        if (this.options.spaceBarPanning) {
            if (e.code.toLowerCase() === "space") {
                e.preventDefault()
                if (this.spaceBarDown) return
                if (!this.flowchart.parentElement) return
                
                this.spaceBarDown = true
                this.flowchart.parentElement.style.cursor = "grab"
            }
        }
    }

    onKeyUp = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as KeyboardEvent
        if (this.options.spaceBarPanning) {
            if (e.code.toLowerCase() === "space") {
                this.spaceBarDown = false
                if (!this.flowchart.parentElement) return
                this.flowchart.parentElement.style.cursor = ""
            }
        }
    }

    onSwipe = (fec: FlowchartEventContext) => {        
        if (this.options.touchSwipePanning) {
            this.flowchart.pan.x += this.flowchart.events.touchDelta.x
            this.flowchart.pan.y += this.flowchart.events.touchDelta.y
        }
    }
    
    
    onWheel = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as WheelEvent
        if (e.ctrlKey || e.metaKey) return
        if (!this.flowchart.events.isWithinChart) return
        
        if (this.options.scrollPanning) {    
            e.preventDefault()
            
            this.flowchart.pan.x -= e.deltaX
            this.flowchart.pan.y -= e.deltaY
        }
    }

    onMouseDown = (fec: FlowchartEventContext) => {  
        const e = fec.originalEvent as MouseEvent
        if (!this.flowchart.events.isWithinChart) return
        this.mouseStartPos = { ...this.flowchart.events.mousePos }

        //  Allow panning when spacebar is held down
        if (this.options.spaceBarPanning) {
            if (this.spaceBarDown) {
                if (!this.flowchart.parentElement) return
                this.flowchart.parentElement.style.cursor = "grabbing"
            }
        }

        // Allow panning via middle mouse button
        if (this.options.middleMousePanning) {
            if (e.button === 1) {
                e.preventDefault()
                if (!this.flowchart.parentElement) return
                this.flowchart.parentElement.style.cursor = "grabbing"
            }
        }
    }
    
    onMouseMove = (fec: FlowchartEventContext) => {  
        const e = fec.originalEvent as MouseEvent
        const mouseStartPos = this.flowchart.events.mouseStartPos
        if (!this.spaceBarDown) return
        if (!this.flowchart.events.mouseDown) return
        if (!mouseStartPos) return

        // const mousePos = this.flowchart.events.mousePos
        const deltaX = (this.flowchart.events.mouseDelta.x) * this.flowchart.zoom
        const deltaY = (this.flowchart.events.mouseDelta.y) * this.flowchart.zoom

        if (this.options.spaceBarPanning) {
            this.flowchart.pan.x += deltaX
            this.flowchart.pan.y += deltaY
        }
        
        if (this.options.middleMousePanning) {
            if (e.button !== 1) return

            this.flowchart.pan.x += deltaX
            this.flowchart.pan.y += deltaY
        }
    }

    onMouseUp = (fec: FlowchartEventContext) => {  
        const e = fec.originalEvent as MouseEvent
        this.mouseStartPos = undefined

        // Reset cursor if mouse button release without spacebar
        if (this.options.spaceBarPanning) {
            if (this.spaceBarDown) {
                if (!this.flowchart.parentElement) return
                this.flowchart.parentElement.style.cursor = "grab"
            }
        }
        
        // Reset cursor if middle mouse button was used
        if (this.options.middleMousePanning) {
            if (e.button === 1) {
                if (!this.flowchart.parentElement) return
                this.flowchart.parentElement.style.cursor = "grab"
            }
        }
    }   

    deactivate(): void {
        this.mouseStartPos = undefined
    }

    destroy() {
        if (this.flowchart?.parentElement) {
            this.flowchart.parentElement.classList.remove("__toolPan")
            this.flowchart.parentElement.classList.remove("__isPanning")
        }
    }
}

export default PanTool