import { FlowchartNode, type FlowchartNodeOptions } from "."
import DiamondShape from "../shapes/diamond"

export class DecisionNode extends FlowchartNode {
    type = "decision"
    shape = undefined as DiamondShape | undefined

    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
        this.shape = new DiamondShape(this, { 
            class: `${this.type}-node`,
            style: {
                maxWidth: "320px",
            }
        })
    } 

}

export default DecisionNode