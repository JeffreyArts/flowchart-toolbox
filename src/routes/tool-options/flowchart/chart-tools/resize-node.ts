import Flowchart  from "../index"
import FlowchartTool from "./index"
import FlowchartNode from "../nodes/index"
import type { SelectTool } from "./select-node"
import type { FlowchartEventContext,  FlowchartNodeEvent } from "../events"

export type ResizeNodeToolOptions = {
    handleSize: number
    roundedHandles: boolean
    minWidth: number
    minHeight: number
    resizeHorizontal: boolean
    resizeVertical: boolean
}

export class ResizeNodeTool extends FlowchartTool {
    name = "resize-node"
    selectedNode = undefined as FlowchartNode | undefined
    selectBox = undefined as SVGElement | undefined
    handles = [ ] as Array<"middle-left" | "middle-right" | "middle-top" | "middle-bottom">

    start = {
        x: undefined as number | undefined,
        y: undefined as number | undefined,
        width: undefined as number | undefined,
        height: undefined as number | undefined,
    }
    
    state = {
        active: true,
        resizing: "" as "" | "horizontal-left" | "horizontal-right" | "vertical-top" | "vertical-bottom",
    }

    options = new Proxy<ResizeNodeToolOptions>({
        handleSize: 8,
        minWidth: 32,
        minHeight: 32,
        roundedHandles: true,
        resizeHorizontal: false, // This is being set in the constructor so it will trgger the handles to be set correctly
        resizeVertical: false, // This is being set in the constructor so it will trgger the handles to be set correctly
    }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value

            if (prop === "resizeHorizontal") {
                if (value) {
                    this.handles.push("middle-left", "middle-right")
                } else {
                    this.handles = this.handles.filter(h => h !== "middle-left" && h !== "middle-right")
                }
            }

            if (prop === "resizeVertical") {
                if (value) {
                    this.handles.push("middle-top", "middle-bottom")
                } else {
                    this.handles = this.handles.filter(h => h !== "middle-top" && h !== "middle-bottom")
                }
            }

            if (prop === "handleSize" || prop === "roundedHandles") {
                this.removeSelectionBox()
                if (this.selectedNode) {
                    this.createResizeHandles()
                }
            }

            return true
        }
    })
    

    constructor(flowchart: Flowchart, options?: ResizeNodeToolOptions) {
        super(flowchart)

        this.options.resizeHorizontal = true
        this.options.resizeVertical = true

        this.updateOptions(options)

        this.flowchart.events.add("nodeAdded", this.onNodeAdded)
        this.flowchart.events.add("mouseDown", this.onmouseDown)
        this.flowchart.events.add("mouseUp", this.onMouseUp)
        this.flowchart.events.add("mouseMove", this.onMouseMove, -1)
    }

    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 

    private updateOptions(options?: Partial<ResizeNodeToolOptions>) {
        if (options) {
            Object.assign(this.options, options)
        }
    }
    
    private createResizeHandles() {
        if (this.selectBox) return
        if (!this.selectedNode) return

        const node = this.selectedNode

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
            handle.setAttribute("width", pos.width.toString())
            handle.setAttribute("height", pos.height.toString())
            handle.setAttribute("class", "handle")
            handle.setAttribute("id", handleId)

            if (this.options.roundedHandles) {
                if (handleId === "middle-left" || handleId === "middle-right") {
                    handle.setAttribute("rx", (pos.width / 2).toString())
                    handle.setAttribute("ry", (pos.width / 2).toString())
                } else if (handleId === "middle-top" || handleId === "middle-bottom") {
                    handle.setAttribute("rx", (pos.height / 2).toString())
                    handle.setAttribute("ry", (pos.height / 2).toString())
                }
            }
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
            case "middle-top":
                return { 
                    x: x + width / 2 - this.options.handleSize / 2, 
                    y: y - this.options.handleSize / 4,
                    width: this.options.handleSize,
                    height: this.options.handleSize / 2,
                }
            case "middle-bottom":
                return {    
                    x: x + width / 2 - this.options.handleSize / 2, 
                    y: y + height - this.options.handleSize / 4,
                    width: this.options.handleSize,
                    height: this.options.handleSize / 2,
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
        if (!this.options.resizeHorizontal) return false

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
        if (!this.options.resizeHorizontal) return false

        const mousePos = this.flowchart.events.mousePos
        const rightHandle = this.selectBox?.querySelector("#middle-right")
        if (!rightHandle) return false
        const x = parseFloat(rightHandle.getAttribute("x") || "0")
        const y = parseFloat(rightHandle.getAttribute("y") || "0")
        const width = parseFloat(rightHandle.getAttribute("width") || "0")
        const height = parseFloat(rightHandle.getAttribute("height") || "0")

        return mousePos.x >= x && mousePos.x <= x + width && mousePos.y >= y && mousePos.y <= y + height
    }

    private isTopHandle() {
        if (!this.options.resizeVertical) return false

        const mousePos = this.flowchart.events.mousePos
        const topHandle = this.selectBox?.querySelector("#middle-top")
        if (!topHandle) return false
        const x = parseFloat(topHandle.getAttribute("x") || "0")
        const y = parseFloat(topHandle.getAttribute("y") || "0")
        const width = parseFloat(topHandle.getAttribute("width") || "0")
        const height = parseFloat(topHandle.getAttribute("height") || "0")

        return mousePos.x >= x && mousePos.x <= x + width && mousePos.y >= y && mousePos.y <= y + height
    }

    private isBottomHandle() {
        if (!this.options.resizeVertical) return false

        const mousePos = this.flowchart.events.mousePos
        const bottomHandle = this.selectBox?.querySelector("#middle-bottom")
        if (!bottomHandle) return false
        const x = parseFloat(bottomHandle.getAttribute("x") || "0")
        const y = parseFloat(bottomHandle.getAttribute("y") || "0")
        const width = parseFloat(bottomHandle.getAttribute("width") || "0")
        const height = parseFloat(bottomHandle.getAttribute("height") || "0")   
     
        return mousePos.x >= x && mousePos.x <= x + width && mousePos.y >= y && mousePos.y <= y + height
    }

    get horizontalHandle() {
        return this.isLeftHandle() || this.isRightHandle()
    }

    get verticalHandle() {
        return this.isTopHandle() || this.isBottomHandle()
    }


    private resizeNodeHorizontal( event: MouseEvent) {
        if (!this.selectedNode) return
        if (!this.start.width) return
        if (!this.start.x) return
        if (!this.selectedNode.shape) return


        const mouseDelta = this.flowchart.events.mouseDelta

        let newX = 0
        let newWidth = 0

        if (this.state.resizing.includes("left")) {
            if (event.altKey) {
                newX = this.start.x
                newWidth = Math.max(0, this.start.width - (mouseDelta.x * 2))
            } else {
                newX = Math.max(0, this.start.x + mouseDelta.x / 2)
                newWidth = Math.max(0, this.start.width - (mouseDelta.x ))

            }
        } 
        if (this.state.resizing.includes("right")) {
            if (event.altKey) {
                newX = this.start.x
                newWidth = Math.max(0, this.start.width + (mouseDelta.x * 2))
            } else {
                newX = Math.max(0, this.start.x + mouseDelta.x / 2)
                newWidth = Math.max(0, this.start.width + (mouseDelta.x ))
            }
        }
        
        if (newWidth > this.options.minWidth) {
            this.selectedNode.x = newX
            this.selectedNode.shape.svgEl.setAttribute("width", newWidth + "px")
            this.selectedNode.textBox.width = newWidth
        } else {
            this.selectedNode.shape.svgEl.setAttribute("width", this.options.minWidth + "px")
            this.selectedNode.textBox.width = this.options.minWidth
        }
        
        this.updateSelectionBox(this.selectedNode)
    }

    private resizeNodeVertical( event: MouseEvent) {
        if (!this.selectedNode) return
        if (!this.start.height) return
        if (!this.start.y) return
        if (!this.selectedNode.shape) return
        
        const mouseDelta = this.flowchart.events.mouseDelta

        let newY = 0
        let newHeight = 0

        if (this.state.resizing.includes("top")) {
            if (event.altKey) {
                newY = this.start.y
                newHeight = Math.max(0, this.start.height - (mouseDelta.y * 2))
            } else {
                newY = Math.max(0, this.start.y + mouseDelta.y / 2)
                newHeight = Math.max(0, this.start.height - (mouseDelta.y ))
            }
        } 
        if (this.state.resizing.includes("bottom")) {
            if (event.altKey) {
                newY = this.start.y
                newHeight = Math.max(0, this.start.height + (mouseDelta.y * 2))
            } else {
                newY = Math.max(0, this.start.y + mouseDelta.y / 2)
                newHeight = Math.max(0, this.start.height + (mouseDelta.y ))
            }
        }
        
        if (newHeight > this.options.minHeight) {
            this.selectedNode.y = newY
            this.selectedNode.shape.svgEl.setAttribute("height", newHeight + "px")
            this.selectedNode.shape.style.height = newHeight + "px"
            this.selectedNode.textBox.height = newHeight
        } else {
            this.selectedNode.shape.svgEl.setAttribute("height", this.options.minHeight + "px")
            this.selectedNode.shape.style.height = this.options.minHeight + "px"
            this.selectedNode.textBox.height = this.options.minHeight
        }
        
        this.updateSelectionBox(this.selectedNode)
        
    }

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onmouseDown = (_fec: FlowchartEventContext) => {
        if (!this.state.active) return
        let cursor = ""
        if (this.isLeftHandle()) {
            this.state.resizing = "horizontal-left"
        } else if (this.isRightHandle()) {
            this.state.resizing = "horizontal-right"
        } else if (this.isTopHandle()) {
            this.state.resizing = "vertical-top"
        } else if (this.isBottomHandle()) {
            this.state.resizing = "vertical-bottom"
        }

        
        if (this.horizontalHandle) {
            cursor = "ew-resize"
        } else if (this.verticalHandle) {
            cursor = "ns-resize"
        }

        if (cursor) {
            document.body.style.cursor = cursor
        }
        
        if (!this.selectedNode) return
        
        this.start.x = this.selectedNode.x
        this.start.y = this.selectedNode.y
        this.start.width = this.selectedNode.width
        this.start.height = this.selectedNode.height
    }

    private onMouseUp = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        if (!this.selectBox) return
        if (!this.selectedNode) return
        if (!fec.originalEvent) return

        if (this.state.resizing.includes("horizontal") || this.state.resizing.includes("vertical")) {
            this.start.x = this.selectedNode.x
            this.start.y = this.selectedNode.y
            this.start.width = this.selectedNode.width
            this.start.height = this.selectedNode.height
            this.state.resizing = ""
            this.selectedNode.state.selected = true
            document.body.style.cursor = ""
        } 
    }

    private onMouseMove = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        if (!this.selectBox) return
        if (!this.selectedNode) return
        if (!fec.originalEvent) return

        // If resizing, prevent events from other tools. Otherwise change the cursor when hovering over handles
        if (this.state.resizing) {
            fec.stopPropagation()
        } else {
            if (this.horizontalHandle) {
                document.body.style.cursor = "ew-resize"
            } else if (this.verticalHandle) {
                document.body.style.cursor = "ns-resize"
            } else {
                document.body.style.cursor = ""
            }
        }

        // Trigger resize if mouse is down and handle is active
        if (this.state.resizing.includes("horizontal")) {
            this.resizeNodeHorizontal(fec.originalEvent as MouseEvent)
            return
        } else if (this.state.resizing.includes("vertical")) {
            this.resizeNodeVertical(fec.originalEvent as MouseEvent)
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
        if (!this.state.active) return
        if (!this.flowchart) return
        // If multiple selection is not allowed, deselect other nodes
        const selectTool = this.flowchart.getTool("select-node") as SelectTool | undefined
        if (selectTool && selectTool.selectedNodes.length !== 0) {
            return
        }
        
        node.addEventListener("positionChange", this.updateSelectionBox)
        this.selectedNode = node
        this.start.x = node.x
        this.start.width = node.width

        this.createResizeHandles()
    }

    
    private onNodeDeselected = (_node: FlowchartNode) => {
        if (this.horizontalHandle || this.verticalHandle) return
        
        this.state.resizing = ""
        this.removeSelectionBox()
    }
}

export default ResizeNodeTool