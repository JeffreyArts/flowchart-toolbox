import type { Flowchart } from "../index"
import type { FlowchartEventContext } from "../events"
import FlowchartTool from "./index"
import { FlowchartNode } from "../nodes"

export type AddNodeToolOptions = {
    buttonDiameter: number
    segments: number
    defaultNodeType: string
    smartNodes?: {
        start: string
        normal: string
        decision: string
        end: string
    }
}

export class AddNodeTool extends FlowchartTool {
    name = "add-node"
    keyDown = false
    offset = 32
    selectedNode = undefined as FlowchartNode | undefined
    newNodeType = ""
    addButton: SVGElement | undefined
    

    options = {
        buttonDiameter: 25,
        segments: 8,
        defaultNodeType: "end",
        smartNodes: {
            start: "start",
            normal: "process",
            decision: "decision",
            end: "end",
        }
    }
    
    constructor(flowchart: Flowchart, options?: AddNodeToolOptions) {
        super(flowchart, options)

        this.newNodeType = this.options.defaultNodeType

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolAddNode")) {
                flowchart.parentElement.classList.add("__toolAddNode")
            }
        }

        this.flowchart.events.add("mouseDown", this.moveNodeMouseDown)
        this.flowchart.events.add("mouseMove", this.onMouseMove)
        this.flowchart.events.add("keyDown", this.resetNodeSelectionOnKeyDown)
    }

    private resetNodeSelectionOnKeyDown = (_fec: FlowchartEventContext) => {

        if (this.selectedNode) {
            this.selectedNode = undefined
        }
    }

    private moveNodeMouseDown = () => {  
        if (!this.addButton) return
        if (!this.selectedNode) return
        const mousePos = this.flowchart.events.mousePos

        const transformProp = this.addButton.getAttribute("transform")
        if (transformProp === null) return
        const [x, y] = transformProp.match(/-?\d+\.?\d*/g)!.map(Number)
        const point = { x, y }
        if (!point.x || !point.y) {
            console.warn("Could not parse add button position from transform attribute:", transformProp)
            return
        }
        const distance = Math.sqrt((mousePos.x - point.x) ** 2 + (mousePos.y - point.y) ** 2)
        if (distance < this.options.buttonDiameter) {
            this.addNewNode()
        }
    }
        

    private onMouseMove = () => {
        const mousePos = this.flowchart.events.mousePos

        let matchedNode = false
        this.flowchart.nodes.forEach(node => {
            if (node.shape.containsPoint(mousePos, this.offset) && !node.shape.containsPoint(mousePos)) {
                matchedNode = true
                this.selectedNode = node
                this.createButton()
                this.updateButtonPosition(node)
            }
        })

        if (!matchedNode) {
            this.selectedNode = undefined
            this.removeButton()
        }
    }

    private addNewNode() {
        if (!this.selectedNode) return
        const mousePos = this.flowchart.events.mousePos
        const borderDistance = this.selectedNode.calculateEdgeStart(mousePos, 100)

        const newNode = new FlowchartNode(this.newNodeType, {
            text: "New node",
            parent: this.selectedNode,
            x: borderDistance.x,
            y: borderDistance.y,
            options: { maxWidth: 200 }
        })
        this.flowchart.addNode(newNode)



        if (this.options.smartNodes) {
            const parentCount = this.selectedNode.parents.length
            const childCount = this.selectedNode.children.length
            const newNodeOptions = {
                flowchart: this.flowchart,
                x: this.selectedNode.x,
                y: this.selectedNode.y,
                options: this.selectedNode.options
            }

            if (parentCount === 0 && this.selectedNode.type !== this.options.smartNodes.start) {
                this.flowchart.replaceNode(this.selectedNode, new FlowchartNode(this.options.smartNodes.start, newNodeOptions))
            } else if (childCount === 1 && parentCount > 0 && this.selectedNode.type !== this.options.smartNodes.normal) {
                this.flowchart.replaceNode(this.selectedNode, new FlowchartNode(this.options.smartNodes.normal, newNodeOptions))
            } else if (childCount > 1 && parentCount > 0 && this.selectedNode.type !== this.options.smartNodes.decision) {
                this.flowchart.replaceNode(this.selectedNode, new FlowchartNode(this.options.smartNodes.decision, newNodeOptions))
            }
        }
        
        

        this.removeButton()
    }

    private updateButtonPosition(node: FlowchartNode) {
        if (!this.addButton) return
        const mousePos = this.flowchart.events.mousePos
        const { x,y } = node.calculateEdgeStart(mousePos, this.options.buttonDiameter/2, this.options.segments)
        this.addButton.setAttribute("transform", `translate(${x-this.options.buttonDiameter/2}, ${y-this.options.buttonDiameter/2})`)
    }

    private removeButton() {
        if (this.addButton) {
            this.addButton.remove()
            this.addButton = undefined
        }
    }

    private createButton() {
        if (this.addButton) return

        const el = document.createElementNS("http://www.w3.org/2000/svg", "g")
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        const diameter = this.options.buttonDiameter
        
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
        this.removeButton()
        if (this.flowchart?.parentElement) {
            this.flowchart.parentElement.classList.remove("__toolMoveNode")
        }
    }
}

export default AddNodeTool