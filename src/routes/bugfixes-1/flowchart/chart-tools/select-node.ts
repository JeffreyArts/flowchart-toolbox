import Flowchart  from "../index"
import FlowchartTool from "./index"
import FlowchartNode from "../nodes/index"
import type { FlowchartEventContext } from "../events"

export type SelectToolOptions = {
    mouseClick: boolean // Allow nodes to be (de-)selected via mouse click
    doubleClick: boolean // Select all nodes on double click
    multipleClick: boolean // Allow multiple nodes to be selected via shift+click
    selectBox: boolean // Allow multiple nodes to be selected via click-and-drag selection box
}

export class SelectTool extends FlowchartTool {
    name = "select-node"
    selectionBox = undefined as SVGRectElement | undefined

    state = {
        active: true,
    }

    deselectNode = false

    options = new Proxy<SelectToolOptions>({
        mouseClick: true,
        doubleClick: true,
        multipleClick: true, 
        selectBox: true,
    }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value
            return true
        }
    })

    get selectedNodes() {
        return this.flowchart.nodes.filter(node => node.state.selected)
    }

    constructor(flowchart: Flowchart, options?: Partial<SelectToolOptions>) {
        super(flowchart)

        this.updateOptions(options)

        this.flowchart.events.add("doubleClick", this.doubleClickAction)
        this.flowchart.events.add("mouseDown", this.selectOnMouseDown)
        this.flowchart.events.add("mouseUp", this.deselectOnMouseUp)
        this.flowchart.events.add("mouseMove", this.onMouseMove)
        this.flowchart.events.add("keyDown", this.onKeyDown)
    }

    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 

    private updateOptions(options?: Partial<SelectToolOptions>) {
        if (options) {
            Object.assign(this.options, options)
        }
    }

    // Extract the repeated hit-test
    private findNodeAtMouse() {
        return this.flowchart.nodes.find(node => node.shape.containsPoint(this.flowchart.events.mousePos))
    }

    private clearSelection(selectedNode?: FlowchartNode) {
        this.flowchart.nodes.forEach(node => {
            if (node === selectedNode) return
            node.state.selected = false
        })
    }

    private createSelectionBox = (_fec: FlowchartEventContext) => {
        // Create svg rect element for selection box
        const svg = this.flowchart.chart
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        rect.setAttribute("fill", "rgba(0, 0, 0, 0.016)")
        rect.setAttribute("stroke", "rgba(0, 0, 0, 0.4)")
        rect.setAttribute("stroke-dasharray", "4")
        svg.appendChild(rect)
        
        this.selectionBox = rect
    }

    private removeSelectionBox() {
        if (this.selectionBox) {
            this.selectionBox.remove()
            this.selectionBox = undefined
        }
    }

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onMouseMove = (_fec: FlowchartEventContext) => {
        if (!this.state.active) return
        this.deselectNode = false
        
        // Handle selectBox option
        // Update selection box
        if (this.selectionBox && this.options.selectBox && this.flowchart.events.mouseStartPos) {
            const startX = this.flowchart.events.mouseStartPos.x
            const startY = this.flowchart.events.mouseStartPos.y
            const currentX = this.flowchart.events.mousePos.x
            const currentY = this.flowchart.events.mousePos.y
            
            
            // Check which nodes are within the selection box and select them
            this.flowchart.nodes.forEach(node => {
                const nodeX = node.x
                const nodeY = node.y
                const nodeWidth = node.shape.width
                const nodeHeight = node.shape.height
                
                const withinX = (nodeX + nodeWidth / 2 >= Math.min(startX, currentX)) && (nodeX - nodeWidth / 2 <= Math.max(startX, currentX))
                const withinY = (nodeY + nodeHeight / 2 >= Math.min(startY, currentY)) && (nodeY - nodeHeight / 2 <= Math.max(startY, currentY))

                if (withinX && withinY) {
                    if (!node.state.selected) {
                        node.state.selected = true
                    }
                } else {
                    if (node.state.selected) {
                        node.state.selected = false
                    }
                }

                if (this.flowchart.events.mouseStartPos) {
                    const width = Math.abs(currentX - startX)
                    const height = Math.abs(currentY - startY)

                    this.selectionBox.setAttribute("width", width.toString())
                    this.selectionBox.setAttribute("height", height.toString())
                    
                    this.selectionBox.setAttribute("x", Math.min(this.flowchart.events.mouseStartPos.x, this.flowchart.events.mousePos.x).toString())
                    this.selectionBox.setAttribute("y", Math.min(this.flowchart.events.mouseStartPos.y, this.flowchart.events.mousePos.y).toString())
                }
            })
        }
    }
    
    private selectOnMouseDown = (fec: FlowchartEventContext) => {
        if (!this.state.active) return

        const e = fec.originalEvent as MouseEvent
        const clickedNode = this.findNodeAtMouse()
        const isWithinChart = this.flowchart.events.isWithinChart
        if (!isWithinChart) return
        if (!this.options.mouseClick) return

        // Handle selectBox option
        if (this.options.selectBox && !clickedNode) {
            this.clearSelection()
            this.createSelectionBox(fec)
        }

        if (clickedNode) {
            if (this.options.multipleClick && this.selectedNodes.length > 0) {
                if (!e.shiftKey && !clickedNode.state.selected) {
                    this.clearSelection(clickedNode)
                }
                
                if (e.shiftKey) {
                    clickedNode.state.selected = !clickedNode.state.selected
                    return
                }

                if (clickedNode.state.selected) {
                    this.deselectNode = true
                }

                clickedNode.state.selected = true
                // clickedNode.state.selected = !clickedNode.state.selected
                return
            }

            clickedNode.state.selected = !clickedNode.state.selected
        } else {
            this.clearSelection()
        }
    }

    private deselectOnMouseUp = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as MouseEvent
        const clickedNode = this.findNodeAtMouse()
        const isWithinChart = this.flowchart.events.isWithinChart

        // Handle selectBox option
        if (this.options.selectBox && this.selectionBox) {
            this.removeSelectionBox()
            return
        }

        // If event happens outside chart, just skip
        if (!isWithinChart) return

        // Mouse has moved since mouseDown, so this is likely a drag, not a click — don't change selection
        if (this.flowchart.events.mouseDelta.x != 0 || this.flowchart.events.mouseDelta.y !== 0) {
            return
        }
        
        
        if (this.deselectNode) {
            clickedNode!.state.selected = false
        }
        this.deselectNode = false
        
        // Handle multipleClick option
        if (this.options.multipleClick) {
            if (!e.shiftKey) {
                this.clearSelection(clickedNode)
            } 
            return
        }
        
        // Default
        this.clearSelection(clickedNode)
    }

    private doubleClickAction = (_fec: FlowchartEventContext) => {
        if (!this.state.active) return
        if (!this.options.doubleClick) return

        setTimeout(() => {
            this.flowchart.nodes.forEach(node => {
                node.state.selected = true
            })

        }, 90)
    }

    private onKeyDown = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        const e = fec.originalEvent as KeyboardEvent
        if (e.key === "Escape") {
            this.flowchart.nodes.forEach(node => {
                node.state.selected = false
            })
        }
            
    }
}

export default SelectTool