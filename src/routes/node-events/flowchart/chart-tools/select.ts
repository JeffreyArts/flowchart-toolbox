import Flowchart  from "../index"
import FlowchartTool from "./index"
import FlowchartNode from "../nodes/index"
import type { FlowchartEventContext } from "../events"

export class SelectTool extends FlowchartTool {
    name = "select"
    mouseStartPos = undefined as { x: number, y: number } | undefined
    startPan = { x: 0, y: 0 } 
    selectedNodes = [] as FlowchartNode[]
    selectionBox = undefined as SVGRectElement | undefined

    options = {
        // Different methods of zooming
        mouseClick: true,
        multipleClick: true, 
        selectBox: true,
    }

    constructor(flowchart: Flowchart) {
        super(flowchart)

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolSelect")) {
                flowchart.parentElement.classList.add("__toolSelect")
            }
        }

        this.flowchart.events.add("mouseDown", this.selectOnMouseDown)
        this.flowchart.events.add("mouseUp", this.deselectOnMouseUp)
        this.flowchart.events.add("mouseMove", this.updateSelectionBox)
    }

    // Extract the repeated hit-test
    private findNodeAtMouse() {
        const { x, y } = this.flowchart.events.mousePos
        return this.flowchart.nodes.find(node => node.shape.containsPoint(x, y))
    }

    private createSelectionBox = (fec: FlowchartEventContext) => {
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

    updateSelectionBox = (fec: FlowchartEventContext) => {
        if (!this.selectionBox) return
        if (!this.flowchart.events.mouseStartPos) return

        const startX = this.flowchart.events.mouseStartPos.x
        const startY = this.flowchart.events.mouseStartPos.y
        const currentX = this.flowchart.events.mousePos.x
        const currentY = this.flowchart.events.mousePos.y

        const width = Math.abs(currentX - startX)
        const height = Math.abs(currentY - startY)

        this.selectionBox.setAttribute("width", width.toString())
        this.selectionBox.setAttribute("height", height.toString())

        this.selectionBox.setAttribute("x", Math.min(this.flowchart.events.mouseStartPos.x, this.flowchart.events.mousePos.x).toString())
        this.selectionBox.setAttribute("y", Math.min(this.flowchart.events.mouseStartPos.y, this.flowchart.events.mousePos.y).toString())


        // Check which nodes are within the selection box and select them
        this.flowchart.nodes.forEach(node => {
            const nodeX = node.x
            const nodeY = node.y
            const nodeWidth = node.shape.width
            const nodeHeight = node.shape.height

            const withinX = (nodeX + nodeWidth / 2 >= Math.min(startX, currentX)) && (nodeX - nodeWidth / 2 <= Math.max(startX, currentX))
            const withinY = (nodeY + nodeHeight / 2 >= Math.min(startY, currentY)) && (nodeY - nodeHeight / 2 <= Math.max(startY, currentY))

            if (withinX && withinY) {
                if (!node.isSelected) {
                    node.isSelected = true
                    this.selectedNodes.push(node)
                }
            } else {
                if (node.isSelected) {
                    node.isSelected = false
                    this.selectedNodes = this.selectedNodes.filter(n => n !== node)
                }
            }
        })
    }
    
    selectOnMouseDown = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as MouseEvent
        const clickedNode = this.findNodeAtMouse()
        const isWithinChart = this.flowchart.events.isWithinChart
        if (!isWithinChart) return

        if (this.options.selectBox && !clickedNode) {
            this.clearSelection()
            this.createSelectionBox(fec)
        }
        
        if (this.options.mouseClick) {
            if (!clickedNode) return

            if (e.shiftKey && this.options.multipleClick) {
                // Toggle: if already selected, deselect and remove; otherwise select and add
                if (clickedNode.isSelected) {
                    clickedNode.isSelected = false
                    this.selectedNodes = this.selectedNodes.filter(n => n !== clickedNode)
                } else {
                    clickedNode.isSelected = true
                    this.selectedNodes.push(clickedNode)
                }
            } else {
                // If clicking an already-selected node, don't clear yet —
                // wait for mouseUp to decide (allows dragging multi-selection)
                if (!clickedNode.isSelected) {
                    this.clearSelection()
                    clickedNode.isSelected = true
                    this.selectedNodes.push(clickedNode)
                }
            }
        }
    }

    deselectOnMouseUp = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as MouseEvent
        const clickedNode = this.findNodeAtMouse()
        const isWithinChart = this.flowchart.events.isWithinChart
        
        if (this.options.selectBox && this.selectionBox) {
            this.removeSelectionBox()
            return
        }

        if (!isWithinChart) return

        if (this.options.mouseClick) {
            if (!clickedNode) {
                if (!e.shiftKey && this.options.multipleClick) {
                    this.clearSelection()
                }
                return
            }
            
            // Shift-click is fully handled in mouseDown, nothing to do here
            if (e.shiftKey && this.options.multipleClick) return
            
            // If mouse moved significantly, assume it was a drag, not a click — don't change selection
            if (Math.abs(this.flowchart.events.mouseDelta.x) >= 1 || Math.abs(this.flowchart.events.mouseDelta.y) >= 1) return
            
            // Plain click on an already-selected node (part of multi-selection):
            // now narrow selection to just this node
            this.clearSelection()
            clickedNode.isSelected = true
            this.selectedNodes.push(clickedNode)
        }
    }

    clearSelection() {
        this.selectedNodes.length = 0
        this.flowchart.nodes.forEach(node => {
            node.isSelected = false
        })
    }

    destroy() {
        if (this.flowchart?.parentElement) {
            this.flowchart.parentElement.classList.remove("__toolSelect")
        }
    }
}

export default SelectTool