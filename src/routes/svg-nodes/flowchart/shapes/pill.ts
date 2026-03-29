import { FlowchartShape, type FlowchartShapeOptions } from "."
import { type FlowchartNode } from "../nodes"

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

    createTextEl() {
        const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text")
        textEl.setAttribute("text-anchor", "middle")
        textEl.setAttribute("dominant-baseline", "middle")
        textEl.classList.add("flowchart-shape-rectangle-text")

        if (!this.node.flowchart?.nodesGroup) {
            console.warn("Node is not attached to a flowchart yet. Cannot add shape to SVG.")
            return
        }

        this.node.svgGroup.appendChild(textEl)
        return textEl
    }

    updateShape() {
        if (!this.svgEl) return
        this.svgEl.setAttribute("width", this.width + "px")
        this.svgEl.setAttribute("height", this.height + "px")
        this.svgEl.setAttribute("rx", this.r + "px")
        this.svgEl.setAttribute("ry", this.r + "px")
    }

    updateText() {
        if (!this.textEl) return
        const textEl = this.textEl
        textEl.innerHTML = ""

        this.node.textBox.lines.forEach((line, index) => {
            const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan")

            // Eerste regel dy = 0, volgende regels dy = lineHeight
            tspan.setAttribute("x", this.node.x + "px")
            tspan.setAttribute("dy", index === 0 ? "0" : this.node.textBox.lineHeight + "px")
            tspan.textContent = line
            textEl.appendChild(tspan)
        })
        this.updatePosition()
        this.updateShape()
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
        this.node.removeEventListener("afterTextChange", this.boundUpdateText)
        if (this.svgEl) this.svgEl.remove()
    }
}

export default PillShape