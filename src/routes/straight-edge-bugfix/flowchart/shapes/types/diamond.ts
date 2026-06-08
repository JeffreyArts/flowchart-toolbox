import { FlowchartShape, type FlowchartShapeOptions } from ".."
import { type FlowchartNode } from "../../nodes"
import type TextHelper from "../text-helper"

interface FlowchartDiamondShapeOptions extends FlowchartShapeOptions {
    
}


export class DiamondShape extends FlowchartShape {
    name = "diamond"

    constructor(node: FlowchartNode, options?: Partial<FlowchartDiamondShapeOptions>) {
        super( node, options )
    }

    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 
                             
    override createSvgEl() {
        const diamond = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
        diamond.classList.add("flowchart-shape")
        return diamond
    }

    override updateShape() {
        if (!this.svgEl) return

        const cx = this.node.x
        const cy = this.node.y
        const w = this.width
        const h = this.height

        const points = `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`
        this.svgEl.setAttribute("points", points)
    }

    override updatePosition() {
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
        this.updateShape()
    }

    // █████▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄    ▄▄  ▄▄▄▄ 
    // ██▄▄█▀ ██ ██ ██▄██ ██    ██ ██▀▀▀ 
    // ██     ▀███▀ ██▄█▀ ██▄▄▄ ██ ▀████  

    containsPoint(pos: { x: number, y: number }, offset = 0): boolean {
        const a = this.width / 2
        const b = this.height / 2
        const dx = Math.abs(pos.x - this.node.x)
        const dy = Math.abs(pos.y - this.node.y)
        const hypot = Math.hypot(a, b)
        return dx * b + dy * a <= a * b + offset * hypot
    }

    afterTextHelperCreated(textHelper: TextHelper): void {
        textHelper.parentEl.style.aspectRatio = "1"
        const leftEl = textHelper.leftEl 
        const rightEl = textHelper.rightEl
        
        if (!leftEl || !rightEl) return
        
        leftEl.style.width = "50%"
        leftEl.style.shapeOutside = "polygon(0 0, 100% 0, 0 50%, 100% 100%, 0 100%)"
        
        rightEl.style.width = "50%"
        rightEl.style.shapeOutside = "polygon(100% 0, 100% 100%, 0 100%, 100% 50%, 0 0)"
    }

    destroy(): void {
        super.destroy()
        if (this.svgEl) this.svgEl.remove()
    }
}

export default DiamondShape