import { FlowchartShape, type FlowchartShapeOptions } from "."
import { type FlowchartNode } from "../nodes"

export interface RectangleShapeOptions extends FlowchartShapeOptions {
}

export class RectangleShape extends FlowchartShape {
    name = "rectangle"
    
    constructor(node: FlowchartNode, options?: Partial<RectangleShapeOptions>) {
        super( node, options )
    }

    containsPoint(point: { x: number, y: number }, offset = 0): boolean {

        const x1 = this.node.x - this.width / 2 + offset
        const y1 = this.node.y - this.height / 2 + offset
        const x2 = this.node.x + this.width / 2 - offset
        const y2 = this.node.y + this.height / 2 - offset
        
        return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2
    }
    
    // Create 
    createSvgEl() {
        const rectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        rectangle.classList.add("flowchart-shape")
        rectangle.classList.add("__isRectangle")
        return rectangle
    }

    updateShape() {
        if (!this.svgEl) return
        this.svgEl.setAttribute("width", this.width + "px")
        this.svgEl.setAttribute("height", this.height + "px")
    }

    updatePosition() {
        if (!this.svgEl || !this.node) return
        this.svgEl.setAttribute("x", this.node.x - this.width / 2 + "px")
        this.svgEl.setAttribute("y",this.node.y - this.height / 2 + "px")
        
        if (this.textEl) {
            const totalHeight = this.node.textBox.lineHeight * this.node.textBox.lines.length
            const textY = this.node.y - totalHeight / 2 + this.node.textBox.lineHeight / 2

            this.textEl.setAttribute("x", this.node.x + "px")
            this.textEl.setAttribute("y", textY + "px")
            this.textEl.childNodes.forEach(tspan => {
                if (tspan instanceof SVGElement) {
                    tspan.setAttribute("x", this.node.x + "px")
                }
            })
        }


        const x = parseFloat(this.svgEl.getAttribute("x") || "0")
        const y = parseFloat(this.svgEl.getAttribute("y") || "0")
        this.node.svgGroup.style.transformOrigin = `${x + this.width/2 }px ${y + this.height/2 }px`
    }

    // Destroy
    destroy(): void {
        super.destroy()
        if (this.svgEl) this.svgEl.remove()
    }
}

export default RectangleShape