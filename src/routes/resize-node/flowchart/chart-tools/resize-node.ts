import Flowchart  from "../index"
import FlowchartTool from "./index"
import FlowchartNode from "../nodes/index"
import type { FlowchartEventContext,  FlowchartNodeEvent } from "../events"

export class ResizeNodeTool extends FlowchartTool {
    name = "resize-node"
    selectedNodes = [] as FlowchartNode[]
    selectBox = undefined as SVGElement | undefined
    handles = [ "middle-left", "middle-right" ]

    options = {
        handleSize: 8
    }

    constructor(flowchart: Flowchart) {
        super(flowchart)
        this.flowchart.events.add("nodeAdded", this.onNodeAdded)
    }

    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 

    private createResizeHandles(node: FlowchartNode) {
        this.selectBox = document.createElementNS("http://www.w3.org/2000/svg", "g")
        
        const outerBox = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        outerBox.setAttribute("fill", "rgba(0, 0, 0, 0.0)")
        outerBox.setAttribute("stroke", "rgba(0, 0, 0, 0.4)")
        outerBox.setAttribute("stroke-width", ".5")
        this.selectBox.appendChild(outerBox)
        
        this.updateSelectionBox(node)


        // Add this.selectBox just after the node's shape element, so that it doesn't get covered by the shape
        if (node.shape.svgEl.parentNode) {
            node.shape.svgEl.parentNode.insertBefore(this.selectBox, node.shape.svgEl.nextSibling)
        }
        
        this.handles.forEach(handleId => {
            const pos = this.getHandlePosition(node, handleId)
            const handle = document.createElementNS("http://www.w3.org/2000/svg", "rect")
            handle.setAttribute("fill", "rgba(255, 255, 255, 1)")
            handle.setAttribute("stroke", "rgba(0, 0, 0, 0.4)")
            handle.setAttribute("stroke-width", ".5")
            handle.setAttribute("x", pos.x.toString())
            handle.setAttribute("y", pos.y.toString())
            handle.setAttribute("width", pos.width.toString())
            handle.setAttribute("height", pos.height.toString())
            handle.setAttribute("class", "handle")
            handle.setAttribute("id", handleId)
            this.selectBox?.appendChild(handle)
        })
    }

    private getHandlePosition(node: FlowchartNode, handleID: string) {
        const nodeStyle = getComputedStyle(node.shape.svgEl)
        const strokeWidth = parseFloat(nodeStyle.strokeWidth)  || 0
        const x = node.x - node.width / 2 - strokeWidth / 2
        const y = node.y - node.height / 2 - strokeWidth / 2
        const width =  node.width + strokeWidth
        const height = node.height + strokeWidth

        switch(handleID) {
            case "middle-left":
                return { 
                    x: x - this.options.handleSize / 4, 
                    y: y + height / 2 - this.options.handleSize / 2,
                    width: this.options.handleSize / 2,
                    height: this.options.handleSize,
                }
            case "middle-right":
                return { 
                    x: x + width - this.options.handleSize / 4, 
                    y: y + height / 2 - this.options.handleSize / 2,
                    width: this.options.handleSize / 2,
                    height: this.options.handleSize,
                }
            default:
                return { x: node.x, y: node.y, width: node.width, height: node.height }
        }
    }

    private updateSelectionBox = (node: FlowchartNode) => {
        if (!this.selectBox) return
        const nodeStyle = getComputedStyle(node.shape.svgEl)
        const strokeWidth = parseFloat(nodeStyle.strokeWidth)  || 0
        const x = node.x - node.width / 2 - strokeWidth / 2
        const y = node.y - node.height / 2 - strokeWidth / 2
        const width =  node.width + strokeWidth
        const height = node.height + strokeWidth

        const outerBox = this.selectBox.querySelector("rect")
        if (outerBox) {
            outerBox.setAttribute("x", x.toString())
            outerBox.setAttribute("y", y.toString())
            outerBox.setAttribute("width", width.toString())
            outerBox.setAttribute("height", height.toString())
        }

        // Update handle positions
        
        const handles = this.selectBox.querySelectorAll(".handle")
        handles.forEach(handle => {
            const handleId = handle.getAttribute("id")
            if (!handleId) return
            const pos = this.getHandlePosition(node, handleId)
            handle.setAttribute("x", pos.x.toString())
            handle.setAttribute("y", pos.y.toString())
            handle.setAttribute("width", pos.width.toString())
            handle.setAttribute("height", pos.height.toString())
        })
    }

    private removeSelectionBox() {
        if (this.selectBox) {
            this.selectBox.remove()
            this.selectBox = undefined
        }
    }

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onNodeAdded = (fec: FlowchartEventContext) => {
        if (!fec.originalEvent) return
        const nodeEvent = fec.originalEvent as FlowchartNodeEvent
        const node = nodeEvent.node
        if (!node) return

        node.addEventListener("selected", this.onNodeSelected)
        node.addEventListener("deselected", this.onNodeDeselected)
    }

    private onNodeSelected = (node: FlowchartNode) => {
        if (!this.flowchart) return
        this.createResizeHandles(node)

        node.addEventListener("positionChange", this.updateSelectionBox)
        console.log("Node selected", node)   
    }

    private onNodeDeselected = (node: FlowchartNode) => {
        console.log("Node deselected", node)   
        this.removeSelectionBox()
    }
}

export default ResizeNodeTool