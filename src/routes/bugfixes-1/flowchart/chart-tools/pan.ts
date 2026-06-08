import type { Flowchart } from "../index"
import FlowchartTool from "./index"
import type { FlowchartEventContext } from "../events"

export type PanToolOptions = {
    spaceBarPanning: boolean
    middleMousePanning: boolean
    scrollPanning: boolean
}

// Allows you to pan the viewbox via the follow UX
// 1. Hold space bar and then click + drag
// 2. Scroll horizontally/vertically with mouse and/or trackpad
// 3. Hold middle mouse button and then click + drag (untested)
// 4. Use two fingers to swipe on touch devices (untested)
// 
export class PanTool extends FlowchartTool {
    name = "pan"

    state = {
        active: true,
        spaceBarDown: false,
    }

    options = new Proxy<PanToolOptions>({
        spaceBarPanning: true,
        middleMousePanning: true,
        scrollPanning: true,
    }, {
        set: (target, prop, value) => {
            (target as any)[prop] = value
            return true
        }
    })

    constructor(flowchart: Flowchart, options?: Partial<PanTool["options"]>) {
        super(flowchart)

        this.updateOptions(options)

        this.flowchart.events.add("wheel", this.onWheel)
        this.flowchart.events.add("keyDown", this.onKeyDown)
        this.flowchart.events.add("keyUp", this.onKeyUp)
        this.flowchart.events.add("mouseDown", this.onMouseDown)
        this.flowchart.events.add("mouseMove", this.onMouseMove)
        this.flowchart.events.add("mouseUp", this.onMouseUp)
    }

    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 
    
    private updateOptions(options?: Partial<PanToolOptions>) {
        if (options) {
            Object.assign(this.options, options)
        }
    }
    

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onKeyDown = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as KeyboardEvent

        // If an input or textarea is focused, ignore events for panning
        const activeElement = document.activeElement
        if (activeElement && (activeElement.nodeName == "INPUT" || activeElement.nodeName == "TEXTAREA" )) return

        if (this.options.spaceBarPanning && this.flowchart.events.isWithinChart) {    
            if (e.code.toLowerCase() === "space") {
                e.preventDefault()
                if (this.state.spaceBarDown) return
                if (!this.flowchart.parentElement) return
                
                this.state.spaceBarDown = true
                this.flowchart.parentElement.style.cursor = "grab"
            }
        }
    }

    private onKeyUp = (fec: FlowchartEventContext) => {
        if (!this.state.active) return

        const e = fec.originalEvent as KeyboardEvent
        if (this.options.spaceBarPanning) {
            if (e.code.toLowerCase() === "space") {
                this.state.spaceBarDown = false
                if (!this.flowchart.parentElement) return
                this.flowchart.parentElement.style.cursor = ""
            }
        }
    }

    private onWheel = (fec: FlowchartEventContext) => {
        if (!this.state.active) return

        const e = fec.originalEvent as WheelEvent
        if (e.ctrlKey || e.metaKey) return
        if (!this.flowchart.events.isWithinChart) return
        
        if (this.options.scrollPanning) {    
            e.preventDefault()
            
            this.flowchart.pan.x -= e.deltaX
            this.flowchart.pan.y -= e.deltaY
        }
    }

    private onMouseDown = (fec: FlowchartEventContext) => {  
        if (!this.state.active) return

        const e = fec.originalEvent as MouseEvent
        if (!this.flowchart.events.isWithinChart) return

        //  Allow panning when spacebar is held down
        if (this.options.spaceBarPanning) {
            if (this.state.spaceBarDown) {
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
    
    private onMouseMove = (fec: FlowchartEventContext) => { 
        if (!this.state.active) return

        const e = fec.originalEvent as MouseEvent
        const mouseStartPos = this.flowchart.events.mouseStartPos
        if (!this.state.spaceBarDown) return
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

    private onMouseUp = (fec: FlowchartEventContext) => {  
        if (!this.state.active) return
        
        const e = fec.originalEvent as MouseEvent

        // Reset cursor if mouse button release without spacebar
        if (this.options.spaceBarPanning) {
            if (this.state.spaceBarDown) {
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
}

export default PanTool