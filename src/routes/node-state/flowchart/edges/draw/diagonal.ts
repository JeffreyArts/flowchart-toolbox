import { type DrawEdgeType } from "../index"

export const drawDiagonalEdge: DrawEdgeType = (start, end, edge) => {
    
    const strength = edge.options.curvatureStrength ?? 0.5
    
    let endPointHor = false
    if (edge.endNode.shape?.width) {
        if (end.x < edge.endNode.x - edge.endNode.shape.width / 2 || end.x > edge.endNode.x + edge.endNode.shape.width / 2) {
            endPointHor = true
        }
    }

    const remainX = end.x - start.x
    const remainY = end.y - start.y
    const diagOffset = Math.min(Math.abs(remainX), Math.abs(remainY))
    const signX = remainX > 0 ? 1 : -1
    const signY = remainY > 0 ? 1 : -1

    let midPoint = {
        x: start.x,
        y: end.y - signY * diagOffset
    }
    
    if (endPointHor) {
        midPoint = {
            x: end.x - signX * diagOffset,
            y: start.y
        }
    }

    // Punt op de lijn start→midPoint, dicht bij midPoint
    const t1x = midPoint.x + (start.x - midPoint.x) * strength
    const t1y = midPoint.y + (start.y - midPoint.y) * strength

    // Punt op de lijn midPoint→end, dicht bij midPoint
    const t2x = midPoint.x + (end.x - midPoint.x) * strength
    const t2y = midPoint.y + (end.y - midPoint.y) * strength

    return `M${start.x} ${start.y} L${t1x} ${t1y} Q${midPoint.x} ${midPoint.y} ${t2x} ${t2y} L${end.x} ${end.y}`
}
    
export default drawDiagonalEdge