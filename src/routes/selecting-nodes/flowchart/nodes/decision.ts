import { type FlowchartType } from "@/routes/canvas-zoom/flowchart/types"
import { FlowchartNode } from "."

export class DecisionNode extends FlowchartNode {
    type = "decision"

    constructor(chart: FlowchartType, text: string) {
        super(chart, text)
    }

    init() {
        this.el.classList.add(`${this.type}-node`)
    }
}

export default DecisionNode