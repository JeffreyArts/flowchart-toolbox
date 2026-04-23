import type { Flowchart } from "../index"
import type { FlowchartEventContext } from "../events"
import FlowchartTool from "./index"
import type { FlowchartNode } from "../nodes"

export class AddNodeTool extends FlowchartTool {
    name = "add-node"
    keyDown = false
    offset = 32
    selectedNodesStartPos = [] as { x: number, y: number, node: FlowchartNode }[]
    addButton: SVGElement | undefined
    button = {
        diameter: 25,
    }
    
    constructor(flowchart: Flowchart) {
        super(flowchart)

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolAddNode")) {
                flowchart.parentElement.classList.add("__toolAddNode")
            }
        }

        this.flowchart.events.add("mouseDown", this.moveNodeMouseDown)
        this.flowchart.events.add("mouseMove", this.onMouseMove)
    }

    moveNodeMouseDown = (fec: FlowchartEventContext) => {  
    }
        

    onMouseMove = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as MouseEvent
        const mouseDown = this.flowchart.events.mouseDown
        const mouseStartPos = this.flowchart.events.mouseStartPos
        const mousePos = this.flowchart.events.mousePos

        let matchedNode = false
        this.flowchart.nodes.forEach(node => {
            if (node.shape.containsPoint(mousePos, this.offset)) {
                matchedNode = true
                this.createButton()
                this.updateButtonPosition(node)
            }
        })

        if (!matchedNode) {
            if (this.addButton) {
                this.addButton.remove()
                this.addButton = undefined
            }
        }
    }

    updateButtonPosition(node: FlowchartNode) {
        if (!this.addButton) return
        const mousePos = this.flowchart.events.mousePos
        const buttonOffset = 0//this.offset + 16
        const x = mousePos.x - this.button.diameter/2
        const y = mousePos.y - this.button.diameter/2
        this.addButton.setAttribute("transform", `translate(${x}, ${y})`)
    }

    private createButton() {
        if (this.addButton) return

        const el = document.createElementNS("http://www.w3.org/2000/svg", "g")
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        const diameter = this.button.diameter
        
        // Add circle
        circle.setAttribute("r", `${diameter / 2}`)
        circle.setAttribute("cx", `${diameter / 2}`)
        circle.setAttribute("cy", `${diameter / 2}`)
        circle.setAttribute("fill", "rgba(255, 255, 255, 0.8)")
        circle.setAttribute("stroke", "#707071")
        circle.setAttribute("stroke-dasharray", "3.2 4.8")
        el.appendChild(circle)

        // Add plus sign
        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line1.setAttribute("x1", `${diameter/2}`)
        line1.setAttribute("y1", `${diameter/2 - diameter/4}`)
        line1.setAttribute("x2", `${diameter/2}`)
        line1.setAttribute("y2", `${diameter/2 + diameter/4}`)
        line1.setAttribute("stroke", "#4a494a")
        line1.setAttribute("stroke-linecap", "round")

        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line")
        line2.setAttribute("x1", `${diameter/2 - diameter/4}`)
        line2.setAttribute("y1", `${diameter/2}`)
        line2.setAttribute("x2", `${diameter/2 + diameter/4}`)
        line2.setAttribute("y2", `${diameter/2}`)
        line2.setAttribute("stroke", "#4a494a")
        line2.setAttribute("stroke-linecap", "round")

        el.appendChild(line1)
        el.appendChild(line2)

        this.flowchart.chart?.appendChild(el)
        this.addButton = el
    }

    destroy() {
        if (this.flowchart?.parentElement) {
            this.flowchart.parentElement.classList.remove("__toolMoveNode")
        }
    }
}

export default AddNodeTool