import Flowchart  from "../index"
import FlowchartTool from "./index"
import FlowchartNode from "../nodes/index"
import type { FlowchartEventContext } from "../events"

export class SelectTool extends FlowchartTool {
    name = "select"
    mouseStartPos = undefined as { x: number, y: number } | undefined
    startPan = { x: 0, y: 0 } 
    selectedNodes = [] as FlowchartNode[]
    
    constructor(flowchart: Flowchart) {
        super(flowchart)

        if (flowchart.parentElement) {
            if (!flowchart.parentElement.classList.contains("__toolSelect")) {
                flowchart.parentElement.classList.add("__toolSelect")
            }
        }

        this.flowchart.events.add("mouseDown", this.selectOnMouseDown)
        this.flowchart.events.add("mouseUp", this.deselectOnMouseUp)
    }

    // Extract the repeated hit-test
    private findNodeAtMouse() {
        const { x, y } = this.flowchart.events.mousePos
        return this.flowchart.nodes.find(node => node.shape.containsPoint(x, y))
    }
    
    selectOnMouseDown = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as MouseEvent
        const clickedNode = this.findNodeAtMouse()
        const isWithinChart = this.flowchart.events.isWithinChart

        if (!isWithinChart) return
        if (!clickedNode) return

        if (e.shiftKey) {
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

    deselectOnMouseUp = (fec: FlowchartEventContext) => {
        const e = fec.originalEvent as MouseEvent
        const clickedNode = this.findNodeAtMouse()
        const isWithinChart = this.flowchart.events.isWithinChart

        if (!isWithinChart) return
        if (!clickedNode) {
            if (!e.shiftKey) {
                this.clearSelection()
            }
            return
        }

        // Shift-click is fully handled in mouseDown, nothing to do here
        if (e.shiftKey) return

        // If mouse moved significantly, assume it was a drag, not a click — don't change selection
        if (Math.abs(this.flowchart.events.mouseDelta.x) >= 1 || Math.abs(this.flowchart.events.mouseDelta.y) >= 1) return

        // Plain click on an already-selected node (part of multi-selection):
        // now narrow selection to just this node
        this.clearSelection()
        clickedNode.isSelected = true
        this.selectedNodes.push(clickedNode)
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