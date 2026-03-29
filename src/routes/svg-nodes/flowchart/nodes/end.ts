import { FlowchartNode, type FlowchartNodeOptions } from "."
import { PillShape } from "../shapes/pill"

export class EndNode extends FlowchartNode {
    type = "end"
    shape = undefined as PillShape | undefined
        
    constructor(options: Partial<FlowchartNodeOptions>) {
        super(options)
    }
    
    init() {
        setTimeout(() => {
            this.shape = new PillShape(this, { 
                class: "end-node",
                // style: {
                //     maxWidth: "200px",
                //     fill:"white",
                //     stroke: "#444",
                //     strokeWidth: "4" 
                // }
            })
        }, 0)
    } 
}

export default EndNode