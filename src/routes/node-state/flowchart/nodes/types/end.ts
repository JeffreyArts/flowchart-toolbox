import { FlowchartNode } from "../index"
import PillShape from "../../shapes/pill"

export const EndNode = (node: FlowchartNode) => {
    let maxWidth = "360px"
    if (typeof node.options.maxWidth === "number") {
        maxWidth = node.options.maxWidth + "px"
    } else {
        maxWidth = node.options.maxWidth
    }
    return new PillShape(node, { 
        class: "end-node",
        style: {
            maxWidth
        }
    })
}

export default EndNode