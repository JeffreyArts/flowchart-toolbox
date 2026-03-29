import { FlowchartNode, type FlowchartNodeOptions } from "."
import { RectangleShape } from "../shapes/rectangle"

export class ProcessNode extends FlowchartNode {
    type = "process"
    shape = undefined as RectangleShape | undefined

    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
        setTimeout(() => {
            this.shape = new RectangleShape(this, { 
                class: "process-node",
                // style: {
                //     maxWidth: "200px",
                //     fill: "white",
                //     stroke: "#b2e0f9",
                //     strokeWidth: "4"
                // }
            })
        }, 0)
    }
}

export default ProcessNode