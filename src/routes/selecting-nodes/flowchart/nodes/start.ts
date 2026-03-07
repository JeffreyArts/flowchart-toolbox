import { type FlowchartType } from "./../../flowchart/types"
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