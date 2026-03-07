import { type FlowchartType } from "./../../flowchart/types"
import { FlowchartNode } from "."

export class EndNode extends FlowchartNode {
    type = "end"
    
    constructor(chart: FlowchartType, text: string) {
        super(chart, text)
    }

    init() {
        this.el.classList.add(`${this.type}-node`)
    }

}

export default EndNode