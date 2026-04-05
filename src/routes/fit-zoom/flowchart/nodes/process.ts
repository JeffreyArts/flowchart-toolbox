import { FlowchartNode, type FlowchartNodeOptions } from "."
import { RectangleShape } from "../shapes/rectangle"

export class ProcessNode extends FlowchartNode {
    type = "process"
    shape = undefined as RectangleShape | undefined

    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }
    
    init() {
        this.shape = new RectangleShape(this, { 
            class: `${this.type}-node`,
            style: {
                maxWidth: "360px",
            }
        })
    }
}

export default ProcessNode