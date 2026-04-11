import { FlowchartNode } from "./../index"
import PillShape from "../../shapes/pill"

export const EndNode = (node: FlowchartNode) => {
    return new PillShape(node, { 
        class: "end-node",
        style: {
            maxWidth: "360px",
        }
    })
}

export default EndNode