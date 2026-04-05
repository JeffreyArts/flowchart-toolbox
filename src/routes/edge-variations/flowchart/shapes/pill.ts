import { FlowchartShape, type FlowchartShapeOptions } from "."
import { type FlowchartNode } from "../nodes"
import type TextHelper from "./text-helper"

interface FlowchartPillShapeOptions extends FlowchartShapeOptions {
    
}


export class PillShape extends FlowchartShape {
    name = "pill"
    svgEl: SVGElement
    textEl = undefined as SVGTextElement | undefined

    constructor(node: FlowchartNode, options?: Partial<FlowchartPillShapeOptions>) {
        super( node, options )
        
        this.processOptions(options)

        const svgEl = this.createSvgEl()
        this.textEl = this.createTextEl()
        
        if (svgEl) {
            this.svgEl = svgEl
        } else {
            throw new Error("Failed to create SVG element for PillShape.")
        }
        
        this.updateStyle()
        this.updateText()
        
        this.node.addEventListener("afterTextChange", this.boundUpdateText)
    }

    boundUpdateText = this.updateText.bind(this)
    

    get width() { return this.node.textBox.width  }    
    get height() { return this.node.textBox.height  }

    private get r()  { return this.height / 2 }
    private get lx() { return this.node.x - this.width / 2 + this.r }  // middelpunt linker cirkel
    private get rx() { return this.node.x + this.width / 2 - this.r }  // middelpunt rechter cirkel

    processOptions(options?: Partial<FlowchartPillShapeOptions>) {
        if (!options) return
        super.processOptions(options)
    }

    containsPoint(mouseX: number, mouseY: number) {
        const { r, lx, rx } = this
        const y = this.node.y

        // Get distance between mouse and each circle center
        const distToRx = Math.hypot(mouseX - rx, mouseY - y)
        const distToLx = Math.hypot(mouseX - lx, mouseY - y)
        return ( distToRx <= r || distToLx <= r || (mouseX >= lx && mouseX <= rx && Math.abs(mouseY - y) <= r))
    }

    // Create 
    createSvgEl() {
        const rectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        rectangle.classList.add("flowchart-shape")
        rectangle.classList.add("__isPill")

        if (this.className) {
            rectangle.classList.add(...this.className.split(" "))
        }

        if (!this.node.flowchart?.nodesGroup) {
            console.warn("Node is not attached to a flowchart yet. Cannot add shape to SVG.")
            return
        }

        this.node.svgGroup.appendChild(rectangle)
        return rectangle
    }

    updateShape() {
        if (!this.svgEl) return
        this.svgEl.setAttribute("width", this.width + "px")
        this.svgEl.setAttribute("height", this.height + "px")
        this.svgEl.setAttribute("rx", this.r + "px")
        this.svgEl.setAttribute("ry", this.r + "px")
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

    afterTextHelperCreated(textHelper: TextHelper): void {
        const leftEl = textHelper.leftEl 
        const rightEl = textHelper.rightEl

        if (!leftEl || !rightEl) return
        
        leftEl.style.width = "50%"
        leftEl.style.shapeOutside = "polygon(0% 0%, 50% 0%, 50% 0%, 44.94% 0.26%, 39.94% 1.02%, 35.03% 2.29%, 30.28% 4.05%, 25.73% 6.28%, 21.44% 8.96%, 17.43% 12.06%, 13.76% 15.55%, 10.46% 19.39%, 7.57% 23.55%, 5.11% 27.98%, 3.11% 32.63%, 1.60% 37.47%, 0.58% 42.43%, 0.06% 47.47%, 0.06% 52.53%, 0.58% 57.57%, 1.60% 62.53%, 3.11% 67.37%, 5.11% 72.02%, 7.57% 76.45%, 10.46% 80.61%, 13.76% 84.45%, 17.43% 87.94%, 21.44% 91.04%, 25.73% 93.72%, 30.28% 95.95%, 35.03% 97.71%, 39.94% 98.98%, 44.94% 99.74%, 50% 100%, 50% 100%, 0% 100%)"
        
        rightEl.style.width = "50%"
        rightEl.style.shapeOutside = "polygon(100% 0%, 50% 0%, 50% 0%, 55.06% 0.26%, 60.06% 1.02%, 64.97% 2.29%, 69.72% 4.05%, 74.27% 6.28%, 78.56% 8.96%, 82.57% 12.06%, 86.24% 15.55%, 89.54% 19.39%, 92.43% 23.55%, 94.89% 27.98%, 96.89% 32.63%, 98.40% 37.47%, 99.42% 42.43%, 99.94% 47.47%, 99.94% 52.53%, 99.42% 57.57%, 98.40% 62.53%, 96.89% 67.37%, 94.89% 72.02%, 92.43% 76.45%, 89.54% 80.61%, 86.24% 84.45%, 82.57% 87.94%, 78.56% 91.04%, 74.27% 93.72%, 69.72% 95.95%, 64.97% 97.71%, 60.06% 98.98%, 55.06% 99.74%, 50% 100%, 50% 100%, 100% 100%)"
    }

    // Destroy
    destroy(): void {
        super.destroy()
        this.node.removeEventListener("afterTextChange", this.boundUpdateText)
        if (this.svgEl) this.svgEl.remove()
    }
}

export default PillShape