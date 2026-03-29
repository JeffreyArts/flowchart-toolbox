import { FlowchartNode, type FlowchartNodeOptions } from "."
import PillShape from "../shapes/pill"

export class StartNode extends FlowchartNode {
    type = "start"
    shape = undefined as PillShape | undefined
    
    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }

    init() {
        setTimeout(() => {
            this.shape = new PillShape(this, { 
                class: "start-node",
                // style: {
                //     maxWidth: "200px",
                //     fill:"white",
                //     stroke: "#ffccff",
                //     strokeWidth: "4" 
                // }
            })
        }, 0)
    } 
}

export default StartNode