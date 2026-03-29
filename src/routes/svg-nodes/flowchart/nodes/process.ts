import { FlowchartNode, type FlowchartNodeOptions } from "."
import { RectangleShape } from "../shapes/rectangle"

export class ProcessNode extends FlowchartNode {
    type = "process"
    shape = undefined as RectangleShape | undefined

    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
        this.svgGroup.classList.add("process-node")
    }

    init() {
        setTimeout(() => {
            this.shape = new RectangleShape(this, { maxWidth: 200 })
        }, 0)
    }
}

export default ProcessNode