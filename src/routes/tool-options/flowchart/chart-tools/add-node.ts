import type { Flowchart } from "../index"
import type { FlowchartEventContext } from "../events"
import FlowchartTool from "./index"
import { FlowchartNode } from "../nodes"
import type { ZoomTool } from "./zoom"

export type AddNodeToolOptions = {
    buttonDiameter: number
    segments: number
    buttonOffset: number
    defaultNodeType: string
    defaultDistance: number
    autoFit: boolean
    disableOnSelect: boolean,
    smartNodes?: {
        start: string
        normal: string
        decision: string
        end: string
    }
}

export class AddNodeTool extends FlowchartTool {
    name = "add-node"
    addButton: SVGElement | undefined
    
    state = {
        active: true,
        keyDown: false,
        selectedNode: undefined as FlowchartNode | undefined
    }

    options = new Proxy<AddNodeToolOptions>({
        autoFit: true,
        buttonDiameter: 24,
        buttonOffset: 12,
        defaultNodeType: "end",
        defaultDistance: 100,
        disableOnSelect: true,
        segments: 8,
    }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value

            return true
        }
    })
    
    constructor(flowchart: Flowchart, options?: AddNodeToolOptions) {
        super(flowchart)
        
        this.parseOptions(options)

        this.flowchart.events.add("mouseDown", this.onMouseDown)
        this.flowchart.events.add("mouseMove", this.onMouseMove)
        this.flowchart.events.add("keyDown", this.onKeyDown)
        this.flowchart.events.add("keyUp", this.onKeyUp)
    }
    
    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 

    private parseOptions(options?: Partial<AddNodeToolOptions>) {
        if (!options) return
        this.options = { ...this.options, ...options }

        if (this.options.smartNodes) {
            if (!this.options.smartNodes.start) { 
                console.warn("AddNodeTool: smartNodes option is missing 'start' type. Could cause problems")
            }
            if (!this.options.smartNodes.end) { 
                console.warn("AddNodeTool: smartNodes option is missing 'end' type. Could cause problems")
            }
            if (!this.options.smartNodes.decision) { 
                console.warn("AddNodeTool: smartNodes option is missing 'decision' type. Could cause problems")
            }
            if (!this.options.smartNodes.normal) {
                console.warn("AddNodeTool: smartNodes option is missing 'normal' type. Could cause problems")
            }
        }
    }
    
    private addNewNode() {
        if (!this.state.selectedNode) return
        const mousePos = this.flowchart.events.mousePos
        const borderDistance = this.state.selectedNode.calculateEdgeStart(mousePos, this.options.defaultDistance)

        const newNode = new FlowchartNode(this.options.defaultNodeType, {
            text: "New node",
            parent: this.state.selectedNode,
            x: borderDistance.x,
            y: borderDistance.y,
            options: { maxWidth: 200 }
        })
        this.flowchart.addNode(newNode)



        if (this.options.smartNodes) {
            const parentCount = this.state.selectedNode.parents.length
            const childCount = this.state.selectedNode.children.length
            const newNodeOptions = {
                flowchart: this.flowchart,
                x: this.state.selectedNode.x,
                y: this.state.selectedNode.y,
                options: this.state.selectedNode.options
            }
            let newNodeType = this.options.defaultNodeType
            let addNode = false

            if (parentCount === 0 && this.state.selectedNode.type !== this.options.smartNodes.start) {
                if (this.options.smartNodes.start) {
                    newNodeType = this.options.smartNodes.start
                }
                addNode = true
            } else if (childCount === 1 && parentCount > 0 && this.state.selectedNode.type !== this.options.smartNodes.normal) {
                if (this.options.smartNodes.normal) {
                    newNodeType = this.options.smartNodes.normal
                }
                addNode = true
            } else if (childCount > 1 && parentCount > 0 && this.state.selectedNode.type !== this.options.smartNodes.decision) {
                if (this.options.smartNodes.decision) {
                    newNodeType = this.options.smartNodes.decision
                }
                addNode = true
            }

            if (addNode) {
                this.flowchart.replaceNode(this.state.selectedNode, new FlowchartNode(newNodeType, newNodeOptions))
            }
        }
        
        if (this.options.autoFit) {
            const zoomTool = this.flowchart.getTool("zoom") as unknown as ZoomTool | undefined
            if (zoomTool) {
                zoomTool.fit()
            } else {
                console.warn("Auto-fit is enabled for AddNodeTool but ZoomTool is not registered. Could not update zoom.")
            }
        }

        this.removeButton()
    }

    private updateButtonPosition(node: FlowchartNode) {
        if (!this.addButton) return
        const mousePos = this.flowchart.events.mousePos
        const { x,y } = node.calculateEdgeStart(mousePos, this.options.buttonOffset, this.options.segments)
        this.addButton.setAttribute("transform", `translate(${x-this.options.buttonOffset}, ${y-this.options.buttonOffset})`)
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

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onKeyDown = (_fec: FlowchartEventContext) => {
        if (!this.state.active) return

        this.state.keyDown = true
        this.removeButton()
        if (this.state.selectedNode) {
            this.state.selectedNode = undefined
        }
    }

    private onKeyUp = (_fec: FlowchartEventContext) => {
        this.state.keyDown = false
    }

    private onMouseDown = () => {  
        if (!this.state.active) return
        if (!this.addButton) return
        if (!this.state.selectedNode) return
        if (this.state.keyDown) return // Cancel when a key is hold down to allow for keyboard shortcuts without accidentally adding nodes
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
        if (!this.state.active) return
        if (this.state.keyDown) return // Cancel when a key is hold down to allow for keyboard shortcuts without accidentally showing the add button

        const mousePos = this.flowchart.events.mousePos
        let matchedNodes = 0

        this.flowchart.nodes.forEach(node => {
            if (node.shape.containsPoint(mousePos, this.options.buttonOffset + this.options.buttonDiameter)) {
                matchedNodes++
                if (!node.shape.containsPoint(mousePos)) {
                    this.state.selectedNode = node
                    if (this.options.disableOnSelect && node.state.selected) return
                    
                    this.createButton()
                    this.updateButtonPosition(node)
                } else if (this.state.selectedNode) {
                    this.state.selectedNode = undefined
                    this.removeButton()
                }
            }  
        })

        if (matchedNodes === 0 || matchedNodes > 1) {
            this.state.selectedNode = undefined
            this.removeButton()
        }
    }
}

export default AddNodeTool