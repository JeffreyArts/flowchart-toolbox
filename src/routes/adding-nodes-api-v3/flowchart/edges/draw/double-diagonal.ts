import { type DrawEdgeType } from "../index"

export const drawDoubleDiagonalEdge: DrawEdgeType = (start, end, edge) => {
    
    const strength = edge.options.curvatureStrength / 2 
    
    let endPointHor = false
    if (edge.endNode.shape?.width) {
        if (end.x < edge.endNode.x - edge.endNode.shape.width / 2 || end.x > edge.endNode.x + edge.endNode.shape.width / 2) {
            endPointHor = true
        }
    }
    
    const dx = Math.abs(end.x - start.x)
    const dy = Math.abs(end.y - start.y)
    const diagOffset = Math.min(dx, dy) / 2

    const signX = end.x > start.x ? 1 : -1
    const signY = end.y > start.y ? 1 : -1

    const mid1 = { 
        x: start.x + signX * diagOffset, 
        y: start.y + signY * diagOffset 
    }
    const mid2 = { 
        x: end.x - signX * diagOffset, 
        y: end.y - signY * diagOffset 
    }

    // Punten op lijn start→mid1, dicht bij mid1
    const t1x = mid1.x + (start.x - mid1.x) * strength
    const t1y = mid1.y + (start.y - mid1.y) * strength

    // Punten op lijn mid1→mid2, dicht bij mid1
    const t2x = mid1.x + (mid2.x - mid1.x) * strength
    const t2y = mid1.y + (mid2.y - mid1.y) * strength

    // Punten op lijn mid1→mid2, dicht bij mid2
    const t3x = mid2.x + (mid1.x - mid2.x) * strength
    const t3y = mid2.y + (mid1.y - mid2.y) * strength

    // Punten op lijn mid2→end, dicht bij mid2
    const t4x = mid2.x + (end.x - mid2.x) * strength
    const t4y = mid2.y + (end.y - mid2.y) * strength

    return `M${start.x} ${start.y} L${t1x} ${t1y} Q${mid1.x} ${mid1.y} ${t2x} ${t2y} L${t3x} ${t3y} Q${mid2.x} ${mid2.y} ${t4x} ${t4y} L${end.x} ${end.y}`
}
    
export default drawDoubleDiagonalEdge