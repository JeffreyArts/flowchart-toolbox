import { type FlowchartType } from "./../../flowchart/types"
import { FlowchartNode } from "."

export class ProcessNode extends FlowchartNode {
    type = "process"

    constructor(chart: FlowchartType, text: string) {
        super(chart, text)
    }

    init() {
        this.el.classList.add(`${this.type}-node`)
    }
}

export default ProcessNode