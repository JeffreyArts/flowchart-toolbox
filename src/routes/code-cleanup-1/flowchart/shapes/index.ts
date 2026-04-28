import { type FlowchartNode } from "../nodes"
import TextHelper from "./text-helper"

export interface FlowchartShapeOptions {
    style?: Partial<CSSStyleDeclaration>
    class?: string | string[]
}

export abstract class FlowchartShape {
    abstract name: string
    svgEl: SVGElement
    abstract createSvgEl(): SVGElement
    abstract updatePosition(): void
    abstract updateShape(): void
    abstract containsPoint(point: { x: number, y: number }, offset?: number): boolean

    id: string = crypto.randomUUID()
    node: FlowchartNode
    textEl: SVGTextElement | undefined = undefined
    class = ""
    updateStyleDelay = undefined as ReturnType<typeof setTimeout> | undefined
    
    afterTextHelperCreated?(textHelper: TextHelper): void
    
    constructor(node: FlowchartNode, options?: Partial<FlowchartShapeOptions>) {
        this.node = node

        this.processOptions(options)

        this.svgEl = this.createSvgEl()
        this.addSvgEl()
        this.updateStyle(options?.style)

        this.textEl = this.createTextEl()
        this.updateText()
        
        document.addEventListener("mousemove", this.boundSetMouseOver)
        node.addEventListener("positionChange", this.boundUpdatePosition)
        node.addEventListener("dimensionChange", this.boundUpdateShape)
        node.addEventListener("afterTextChange", this.boundUpdateText)
    }
    
    addSvgEl() {
        if (this.class) {
            this.svgEl.classList.add(this.class)
        }
        
        if (!this.node.flowchart?.nodesGroup) {
            console.warn("Node is not attached to a flowchart yet. Cannot add shape to SVG.")
            return
        }

        this.node.svgGroup.appendChild(this.svgEl)
    }

    createTextEl() {
        const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text")
        textEl.setAttribute("text-anchor", "middle")
        textEl.setAttribute("dominant-baseline", "middle")
        textEl.classList.add("flowchart-shape-text")

        if (!this.node.flowchart?.nodesGroup) {
            console.warn("Node is not attached to a flowchart yet. Cannot add shape to SVG.")
            return
        }

        this.node.svgGroup.appendChild(textEl)
        return textEl
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

    get style(): CSSStyleDeclaration {
        if (!this.svgEl) {
            console.warn("SVG element is not created yet. Cannot access style.")
            return {} as CSSStyleDeclaration
        }
        return this.svgEl.style
    }

    processOptions(options?: Partial<FlowchartShapeOptions >) {
        if (!options) return

        if (options.class) {
            if (Array.isArray(options.class)) {
                this.class = options.class.join(" ")
            } else {
                this.class = options.class
            }
        }
    }
    get flowchart() {   
        return this.node?.flowchart
    }

    // Width & height
    get width() {
        return this.node.textBox.width 
    }
    
    get height() {
        return this.node.textBox.height 
    }
    

    /** Position **/
    updateStyle(style?: Partial<CSSStyleDeclaration>) {
        if (!style) return
        if (!this.svgEl) return

        for (const key in style) {
            const value = style[key] || ""
            const cssKey = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() // camelCase to kebab-case
            this.svgEl.style.setProperty(cssKey, value )
        }
    }

    private mouseInsideShape = () => {
        const flowchart = this.flowchart
        if (!flowchart || !flowchart.chart) {
            return false
        }

        if (!this.node.shape) {
            throw new Error("Shape is not defined for this node")
        }

        return this.node.shape.containsPoint(flowchart.events.mousePos)
    }

    /** Shape */
    private setMouseOver() {
        this.node.state.mouseOver = this.mouseInsideShape()

        if (this.node.state.mouseOver && !this.node.state.mouseEntered) {
            this.node.state.mouseEntered = true
            this.node.state.mouseLeft = false
        } else if (!this.node.state.mouseOver && this.node.state.mouseEntered) {
            this.node.state.mouseEntered = false
            this.node.state.mouseLeft = true
        }
    }

    getBorderDistance(targetPosition: { x: number, y: number }, offset = 0): number {
        const dx = targetPosition.x - this.node.x
        const dy = targetPosition.y - this.node.y
        const length = Math.hypot(dx, dy)
        const nx = dx / length // genormaliseerde richting
        const ny = dy / length

        let low = 0
        let high = Math.max(this.node.width, this.node.height) + offset
    
        for (let i = 0; i < 16; i++) {
            const mid = (low + high) / 2
            if (this.containsPoint({ x: this.node.x + nx * mid, y: this.node.y + ny * mid }, offset)) {
                low = mid
            } else {
                high = mid
            }
        }

        return (low + high) / 2
    }

    boundUpdateShape        = this.updateShape.bind(this)
    boundUpdatePosition     = this.updatePosition.bind(this)
    boundSetMouseOver       = this.setMouseOver.bind(this)
    boundUpdateText         = this.updateText.bind(this)

    destroy() {
        if (this.node) {
            this.node.removeEventListener("positionChange", this.boundUpdatePosition)
        }
        if (this.svgEl) { this.svgEl.remove()}
    }

}

export default FlowchartShape