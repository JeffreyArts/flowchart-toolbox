import type { un } from "vue-router/dist/index-DFCq6eJK.js"
import { type FlowchartNode } from "../nodes"

export interface FlowchartShapeOptions {
       
}

export abstract class FlowchartShape {
    abstract name: string
    abstract svgEl: SVGElement
    abstract createSvgEl(): SVGElement | undefined
    abstract updatePosition(): void
    abstract updateShape(): void
    abstract updateStyle(): void
    abstract containsPoint(x: number, y: number): boolean
    
    private _isHover: boolean = false
    private _isVisible: boolean = false
    
    id: string = crypto.randomUUID()
    node: FlowchartNode
    textEl: SVGTextElement | undefined = undefined

    init?(): void
    
    constructor(node: FlowchartNode, options?: Partial<FlowchartShapeOptions>) {
        this.node = node
        this.#init()

        document.addEventListener("mousemove", this.boundSetIsHover)
        node.addEventListener("positionChange", this.boundUpdatePosition)
    }
    
    #init() {
    }

    get flowchart() {   
        return this.node?.flowchart
    }

    /** Visible **/

    set isVisible(value: boolean) {
        this._isVisible = value

        if (!this.svgEl) return

        if (value) {
            this.svgEl.style.opacity = "1"
        } else {
            this.svgEl.style.opacity = "0"
        }
    }

    get isVisible() {
        return this._isVisible
    }

    /** Hover **/
    
    set isHover(value: boolean) {
        if (value) {
            this.onMouseEnter()
        } else {
            this.onMouseLeave()
        }
        this._isHover = value
    }
    
    get isHover() {
        return this._isHover
    }

    /** Position **/
    // #updatePosition() {
    //     if (!this.svgEl || !this.node) return
    //     this.svgEl.setAttribute("x", this.node.x + "px")
    //     this.svgEl.setAttribute("y", this.node.y + "px")
    // }
    
    boundUpdatePosition = this.updatePosition.bind(this)


    /** Shape */
    setIsHover(e: MouseEvent) {

        const flowchart = this.flowchart
        if (!flowchart || !flowchart.chart) {
            return
        }
        const rect = flowchart.chart.getBoundingClientRect()

        const x = (e.clientX - rect.left - flowchart.pan.x) / flowchart.zoom
        const y = (e.clientY - rect.top  - flowchart.pan.y) / flowchart.zoom

        if (!this.node.shape) {
            throw new Error("Shape is not defined for this node")
        }

        this.isHover = this.node.shape.containsPoint(x, y)
        this.node.mouseOver = this.isHover
    }

    boundSetIsHover = this.setIsHover.bind(this)


    getBorderDistance(targetNode: FlowchartNode): number {
        const dx = targetNode.x - this.node.x
        const dy = targetNode.y - this.node.y
        const length = Math.hypot(dx, dy)
        const nx = dx / length  // genormaliseerde richting
        const ny = dy / length

        let low = 0
        let high = Math.max(this.node.width, this.node.height)
        if (!targetNode.shape) {
            throw new Error("Target node has no shape")
        }
        for (let i = 0; i < 16; i++) {
            const mid = (low + high) / 2
            if (targetNode.shape.containsPoint(this.node.x + nx * mid, this.node.y + ny * mid)) {
                low = mid
            } else {
                high = mid
            }
        }

        return (low + high) / 2
    }

    /** Lifecycle Hooks **/

    onMouseEnter() {
        this.svgEl.classList.add("__isHover")
    }

    onMouseLeave() {
        this.svgEl.classList.remove("__isHover")
    }

    destroy() {
        if (this.node) {
            this.node.removeEventListener("positionChange", this.boundUpdatePosition)
        }
        if (this.svgEl) { this.svgEl.remove()}
    }

}

export default FlowchartShape