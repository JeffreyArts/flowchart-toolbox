import { FlowchartNode } from "./../index"
import RectangleShape from "../../shapes/rectangle"

export const ProcessNode = (node: FlowchartNode) => {
    return new RectangleShape(node, { 
        class: "process-node",
        style: {
            maxWidth: "360px",
        }
    })
}

export default ProcessNode