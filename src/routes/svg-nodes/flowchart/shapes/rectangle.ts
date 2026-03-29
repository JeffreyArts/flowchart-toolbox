import { FlowchartShape, type FlowchartShapeOptions } from "."
import { type FlowchartNode } from "../nodes"

export interface RectangleShapeOptions extends FlowchartShapeOptions {
    maxWidth?: number;
    border?: {
        color?: string,
        width?: number | string,
        style?: "solid" | "dashed" | "dotted" | "none"
    },
    background?: {
        color?: string
    },
}

export class RectangleShape extends FlowchartShape {
    name = "rectangle"
    svgEl: SVGElement
    textEl = undefined as SVGTextElement | undefined
    
    border = this.#makeReactive({
        color: "#b2e0f9" as string | undefined,
        width: 4 as number | string,
        style: "solid" as "solid" | "dashed" | "dotted" | "none" | undefined
    }, () => this.updateStyle())

    background = this.#makeReactive({
        color: undefined as string | undefined
    }, () => this.updateStyle())

    // font = this.#makeReactive({
    //     color: undefined as string | undefined,
    //     size: undefined as number | string | undefined,
    //     family: undefined as string | undefined
    // }, () => this.updateStyle())

    #updateStyleDelay = undefined as ReturnType<typeof setTimeout> | undefined

    constructor(node: FlowchartNode, options?: Partial<RectangleShapeOptions>) {
        super( node, options )

        this.processOptions(options)

        const svgEl = this.createSvgEl()
        this.textEl = this.createTextEl()
        
        if (svgEl) {
            this.svgEl = svgEl
        } else {
            throw new Error("Failed to create SVG element for RectangleShape.")
        }
        
        this.updateStyle()
        this.updateText()
        
        this.node.addEventListener("afterTextChange", this.boundUpdateText)
    }

    boundUpdateText = this.updateText.bind(this)
    

    get width() {
        return this.node.textBox.width 
    }
    
    get height() {
        return this.node.textBox.height 
    }
    

    processOptions(options?: Partial<RectangleShapeOptions>) {
        if (!options) return
        super.processOptions(options)
        
        // MAX WIDTH
        if (options.maxWidth) {
            this.node.maxWidth = options.maxWidth
        }

        // BORDER
        if (options.border) {
            if (options.border.color) {
                this.border.color = options.border.color
            }

            if (typeof options.border.width === "number" || typeof options.border.width === "string") {
                this.border.width = options.border.width
            } 
                
            if (options.border.style) {
                this.border.style = options.border.style
            } else {
                this.border.style = "none"
            }
        }

        // BACKGROUND
        if (options.background) {
            if (options.background.color) {
                this.background.color = options.background.color
            }
        }
    }


    #makeReactive<T extends object>(obj: T, onChange: () => void): T {
        return new Proxy(obj, {
            set(target, prop, value) {
                target[prop as keyof T] = value
                onChange()
                return true
            }
        })
    }

    containsPoint(px: number, py: number): boolean {

        const x1 = this.node.x - this.width / 2
        const y1 = this.node.y - this.height / 2
        const x2 = this.node.x + this.width / 2
        const y2 = this.node.y + this.height / 2
        
        return px >= x1 && px <= x2 && py >= y1 && py <= y2
    }
    
    // Create 
    createSvgEl() {
        const rectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        rectangle.classList.add("flowchart-shape-rectangle")

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

    // Update
    updateStyle() {
        if (this.#updateStyleDelay) {
            clearTimeout(this.#updateStyleDelay)
        }

        this.#updateStyleDelay = setTimeout(() => {
            // Background
            if (this.background.color) {
                this.svgEl.setAttribute("fill", this.background.color)
            } else {
                this.svgEl.setAttribute("fill", "transparent")
            }
            
            
            // Border
            if (this.border.style !== "none") {
                if (this.border.color) {
                    this.svgEl.setAttribute("stroke", this.border.color)
                }

                this.svgEl.setAttribute("stroke-width", this.border.width.toString())
                
                if (this.border.style === "dashed") {
                    this.svgEl.setAttribute("stroke-dasharray", "4 2")
                } else if (this.border.style === "dotted") {
                    this.svgEl.setAttribute("stroke-dasharray", "1 2")
                } else {
                    this.svgEl.setAttribute("stroke-dasharray", "0")
                }
            } else {
                this.svgEl.removeAttribute("stroke")
                this.svgEl.removeAttribute("stroke-width")
                this.svgEl.removeAttribute("stroke-dasharray")
            }
        })
    }

    updateShape() {
        if (!this.svgEl) return
        this.svgEl.setAttribute("width", this.width + "px")
        this.svgEl.setAttribute("height", this.height + "px")
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

export default RectangleShape