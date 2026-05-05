import Flowchart  from "../index"
import FlowchartTool from "./index"
import FlowchartNode from "../nodes/index"
import type { FlowchartEventContext,  FlowchartNodeEvent } from "../events"

export type ResizeNodeToolOptions = {
    handleSize: number
    minWidth: number
}

export class ResizeNodeTool extends FlowchartTool {
    name = "resize-node"
    selectedNode = undefined as FlowchartNode | undefined
    selectBox = undefined as SVGElement | undefined
    handles = [ "middle-left", "middle-right" ]

    startWidth = undefined as number | undefined
    startX = undefined as number | undefined
    
    state = {
        resizing: "" as "" | "horizontal-left" | "horizontal-right" | "vertical" | "both",
    }

    options = {
        handleSize: 8,
        minWidth: 32,
    }

    constructor(flowchart: Flowchart, options?: ResizeNodeToolOptions) {
        super(flowchart)
        this.parseOptions(options)

        this.flowchart.events.add("nodeAdded", this.onNodeAdded)
        this.flowchart.events.add("mouseDown", this.onmouseDown)
        this.flowchart.events.add("mouseUp", this.onMouseUp)
        this.flowchart.events.add("mouseMove", this.onMouseMove, -1)
    }

    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 

    private parseOptions(options?: Partial<ResizeNodeToolOptions>) {
        if (!options) return

        this.options = { ...this.options, ...options }
    }

    private createResizeHandles(node: FlowchartNode) {
        if (this.selectBox) return
        this.selectBox = document.createElementNS("http://www.w3.org/2000/svg", "g")
        this.selectBox.setAttribute("tool", "resize-node-tool")
        this.selectBox.setAttribute("name", "select-box")
        
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
            handle.setAttribute("rx", (pos.width / 2).toString())
            handle.setAttribute("ry", (pos.width / 2).toString())
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

    private isLeftHandle() {
        const mousePos = this.flowchart.events.mousePos
        const leftHandle = this.selectBox?.querySelector("#middle-left")
        if (!leftHandle) return false
        const x = parseFloat(leftHandle.getAttribute("x") || "0")
        const y = parseFloat(leftHandle.getAttribute("y") || "0")
        const width = parseFloat(leftHandle.getAttribute("width") || "0")
        const height = parseFloat(leftHandle.getAttribute("height") || "0")

        return mousePos.x >= x && mousePos.x <= x + width && mousePos.y >= y && mousePos.y <= y + height
    }

    private isRightHandle() {
        const mousePos = this.flowchart.events.mousePos
        const rightHandle = this.selectBox?.querySelector("#middle-right")
        if (!rightHandle) return false
        const x = parseFloat(rightHandle.getAttribute("x") || "0")
        const y = parseFloat(rightHandle.getAttribute("y") || "0")
        const width = parseFloat(rightHandle.getAttribute("width") || "0")
        const height = parseFloat(rightHandle.getAttribute("height") || "0")

        return mousePos.x >= x && mousePos.x <= x + width && mousePos.y >= y && mousePos.y <= y + height
    }

    private resizeNodeHorizontal( event: MouseEvent) {
        if (!this.selectedNode) return
        if (!this.startWidth) return
        if (!this.startX) return
        if (!this.selectedNode.shape) return


        const mouseDelta = this.flowchart.events.mouseDelta

        let newX = 0
        let newWidth = 0

        if (this.state.resizing.includes("left")) {
            if (event.altKey) {
                newX = this.startX
                newWidth = Math.max(0, this.startWidth - (mouseDelta.x * 2))
            } else {
                newX = Math.max(0, this.startX + mouseDelta.x / 2)
                newWidth = Math.max(0, this.startWidth - (mouseDelta.x ))

            }
        } 
        if (this.state.resizing.includes("right")) {
            if (event.altKey) {
                newX = this.startX
                newWidth = Math.max(0, this.startWidth + (mouseDelta.x * 2))
            } else {
                newX = Math.max(0, this.startX + mouseDelta.x / 2)
                newWidth = Math.max(0, this.startWidth + (mouseDelta.x ))
            }
        }
        
        if (newWidth > this.options.minWidth) {
            this.selectedNode.x = newX
            this.selectedNode.shape.style.width = newWidth + "px"
            this.selectedNode.textBox.width = newWidth
        } else {
            this.selectedNode.shape.style.width = this.options.minWidth + "px"
            this.selectedNode.textBox.width = this.options.minWidth
        }
        
        this.updateSelectionBox(this.selectedNode)
    }

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onmouseDown = (_fec: FlowchartEventContext) => {
        if (this.isLeftHandle() || this.isRightHandle()) {
            if (this.isLeftHandle()) {
                this.state.resizing = "horizontal-left"
            } else if (this.isRightHandle()) {
                this.state.resizing = "horizontal-right"
            }

            if (!this.selectedNode) return
            
            this.startX = this.selectedNode.x
            this.startWidth = this.selectedNode.width
            document.body.style.cursor = "ew-resize"
        }
    }

    private onMouseUp = (fec: FlowchartEventContext) => {
        if (!this.selectBox) return
        if (!this.selectedNode) return
        if (!fec.originalEvent) return

        if (this.state.resizing.includes("horizontal")) {
            this.startX = this.selectedNode.x
            this.startWidth = this.selectedNode.width
            this.state.resizing = ""
            this.selectedNode.state.selected = true
            document.body.style.cursor = ""
        }
    }

    private onMouseMove = (fec: FlowchartEventContext) => {
        if (!this.selectBox) return
        if (!this.selectedNode) return
        if (!fec.originalEvent) return

        // If resizing, prevent events from other tools. Otherwise change the cursor when hovering over handles
        if (this.state.resizing) {
            fec.stopPropagation()
        } else {
            if (this.isLeftHandle() || this.isRightHandle()) {
                document.body.style.cursor = "ew-resize"
            } else {
                document.body.style.cursor = ""
            }
        }

        // Trigger resize if mouse is down and handle is active
        if (this.state.resizing.includes("horizontal")) {
            this.resizeNodeHorizontal(fec.originalEvent as MouseEvent)
            return
        }

    }

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
        this.selectedNode = node
        this.startX = node.x
        this.startWidth = node.width
    }

    private onNodeDeselected = (node: FlowchartNode) => {

        if (this.isLeftHandle()) return
        if (this.isRightHandle()) return
        

        this.state.resizing = ""
        this.removeSelectionBox()
    }
}

export default ResizeNodeTool