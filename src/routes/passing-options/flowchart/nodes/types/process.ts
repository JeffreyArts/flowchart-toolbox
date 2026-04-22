import { FlowchartNode } from "../index"
import RectangleShape from "../../shapes/rectangle"

export const ProcessNode = (node: FlowchartNode) => {
    let maxWidth = "360px"
    if (typeof node.options.maxWidth === "number") {
        maxWidth = node.options.maxWidth + "px"
    } else {
        maxWidth = node.options.maxWidth
    }
    return new RectangleShape(node, { 
        class: "process-node",
        style: {
            maxWidth
        }
    })
}

export default ProcessNode