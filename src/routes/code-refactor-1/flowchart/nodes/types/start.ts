import { FlowchartNode } from "./../index"
import PillShape from "../../shapes/pill"

export const StartNode = (node: FlowchartNode) => {
    return new PillShape(node, { 
        class: "start-node",
        style: {
            maxWidth: "360px",
        }
    })
}

export default StartNode