import { FlowchartShape, type FlowchartShapeOptions } from "."
import { type FlowchartNode } from "../nodes"

export interface ForeignObjectShapeOptions extends FlowchartShapeOptions {
    maxWidth?: number;
}

/** THIS NO LONGER WORKS */
export class ForeignObjectShape extends FlowchartShape {
    name = "foreign-object"
    textEl = undefined as HTMLDivElement | undefined
    svgEl: SVGElement
    
    constructor(node: FlowchartNode, options: Partial<ForeignObjectShapeOptions>) {
        super( node, options )
        
        this.svgEl = this.createSvgEl()
    }

    init() {
    }

    createSvgEl() {
        const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject")
        foreignObject.setAttribute("width", "1000px")
        foreignObject.setAttribute("height", "1000px")
        foreignObject.setAttribute("x", this.node.x + "px")
        foreignObject.setAttribute("y", this.node.y + "px")

        foreignObject.classList.add("flowchart-shape-foreign-object")
        return foreignObject
    }

    // containsPoint(px: number, py: number): boolean {
    //     this.svgEl.getBoundingClientRect()
    //     const rect = this.svgEl.getBoundingClientRect()
    //     return px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom
    // }

    destroy(): void {
        super.destroy()
        if (this.svgEl) this.svgEl.remove()
        if (this.textEl) this.textEl.remove()
    }
}

export default ForeignObjectShape