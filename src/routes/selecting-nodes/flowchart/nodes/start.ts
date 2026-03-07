import { type FlowchartType } from "@/routes/canvas-zoom/flowchart/types"
import { FlowchartNode } from "."

export class StartNode extends FlowchartNode {
    type = "start"
    
    constructor(chart: FlowchartType, text: string) {
        super(chart, text)
    }

    init() {
        this.el.classList.add(`${this.type}-node`)
    }

}

export default StartNode