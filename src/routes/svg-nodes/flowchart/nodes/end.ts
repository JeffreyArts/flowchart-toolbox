import { FlowchartNode, type FlowchartNodeOptions } from "."
import { PillShape } from "../shapes/pill"

export class EndNode extends FlowchartNode {
    type = "end"
    shape = undefined as PillShape | undefined
        
    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }
    
    init() {
        this.shape = new PillShape(this, { 
            class: `${this.type}-node`,
            style: {
                maxWidth: "400px",
            }
        })
    } 
}

export default EndNode