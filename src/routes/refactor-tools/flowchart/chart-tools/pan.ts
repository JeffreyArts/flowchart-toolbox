import type { Flowchart } from "../index"
import FlowchartTool from "./index"

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
    
    constructor(flowchart: Flowchart) {
        super(flowchart)

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolPan")) {
                flowchart.parentElement.classList.add("__toolPan")
            }
        }
    }

    onKeyDown = (e: KeyboardEvent) => {
        if (e.code.toLowerCase() === "space") {
            e.preventDefault()
            if (this.spaceBarDown) return
            if (!this.flowchart.parentElement) return
            
            this.spaceBarDown = true
            this.flowchart.parentElement.style.cursor = "grab"
        }
    }

    onKeyUp = (e: KeyboardEvent) => {
        if (e.code.toLowerCase() === "space") {
            this.spaceBarDown = false
            if (!this.flowchart.parentElement) return
            this.flowchart.parentElement.style.cursor = ""
        }
    }

    onSwipe = (_e: TouchEvent, deltaX: number, deltaY: number) => {
        if (!this.flowchart) return

        this.flowchart.pan.x += deltaX
        this.flowchart.pan.y += deltaY
    }
    
    onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) return
        if (!this.isWithinChart) return
        if (!this.flowchart) return

        e.preventDefault()

        this.flowchart.pan.x -= e.deltaX
        this.flowchart.pan.y -= e.deltaY
    }

    onMouseDown = (e: MouseEvent) => {  
        if (!this.isWithinChart) return
        this.mouseStartPos = { ...this.globalMousePos }

        //  Allow panning when spacebar is held down
        if (this.spaceBarDown) {
            if (!this.flowchart.parentElement) return
            this.flowchart.parentElement.style.cursor = "grabbing"
        }

        // Allow panning via middle mouse button
        if (e.button === 1) {
            e.preventDefault()
            if (!this.flowchart.parentElement) return
            this.flowchart.parentElement.style.cursor = "grabbing"
        }
    }
    
    onMouseMove = (e: MouseEvent) => {  
        if (!this.spaceBarDown) return
        if (!this.mouseDown) return
        if (!this.flowchart) return
        if (!this.mouseStartPos) return

        const deltaX = this.globalMousePos.x - this.mouseStartPos.x
        const deltaY = this.globalMousePos.y - this.mouseStartPos.y

        this.flowchart.pan.x += deltaX
        this.flowchart.pan.y += deltaY

        this.mouseStartPos = { ...this.globalMousePos }
    }

    onMouseUp = (e: MouseEvent) => {  
        this.mouseStartPos = undefined

        // Reset cursor if mouse button release without spacebar
        if (this.spaceBarDown) {
            if (!this.flowchart.parentElement) return
            this.flowchart.parentElement.style.cursor = "grab"
        }
        
        // Reset cursor if middle mouse button was used
        if (e.button === 1) {
            if (!this.flowchart.parentElement) return
            this.flowchart.parentElement.style.cursor = "grab"
        }
    }   

    deactivate(): void {
        super.deactivate()
        this.mouseStartPos = undefined
    }

    destroy() {
        super.destroy()

        if (this.flowchart?.parentElement) {
            this.flowchart.parentElement.classList.remove("__toolPan")
            this.flowchart.parentElement.classList.remove("__isPanning")
        }
    }
}

export default PanTool