import { type DrawEdgeType } from "../index"

export const drawDiagonalEdge: DrawEdgeType = (start, end, edge) => {
    // Max = .99 to prevent `end` object to be equal to `t2` object 
    const strength = Math.min(edge.options.curvatureStrength ?? 0.5, .99) 
    
    let horizontal = false
    if (edge.endNode.shape?.width) {
        if (end.x < edge.endNode.x - edge.endNode.shape.width / 2 || end.x > edge.endNode.x + edge.endNode.shape.width / 2) {
            horizontal = true
        }
    }

    const remainX = end.x - start.x
    const remainY = end.y - start.y
    const diagOffset = Math.min(Math.abs(remainX), Math.abs(remainY))
    const signX = remainX > 0 ? 1 : -1
    const signY = remainY > 0 ? 1 : -1

    let offset = 4
    if (edge.markerEl) {
        if (horizontal) {
            offset = parseInt(edge.markerEl.getAttribute("markerWidth") || "", 10)
        } else {
            offset = parseInt(edge.markerEl.getAttribute("markerHeight") || "", 10) 
        }
    }

    if (diagOffset < offset) {
        return `M${start.x} ${start.y} L${end.x} ${end.y}`
    }

    let breakPoint = {
        x: start.x,
        y: end.y - signY * diagOffset
    }
    
    if (horizontal) {
        breakPoint = {
            x: end.x - signX * diagOffset,
            y: start.y
        }
    }

    // Punt op de lijn start→breakPoint, dicht bij breakPoint
    const t1 = {
        x: breakPoint.x + (start.x - breakPoint.x) * strength,
        y: breakPoint.y + (start.y - breakPoint.y) * strength
    }

    // Punt op de lijn breakPoint→end, dicht bij breakPoint
    const t2 = {
        x: breakPoint.x + (end.x - breakPoint.x) * strength,
        y: breakPoint.y + (end.y - breakPoint.y) * strength
    }

    return `M${start.x} ${start.y} L${t1.x} ${t1.y} Q${breakPoint.x} ${breakPoint.y} ${t2.x} ${t2.y} L${end.x} ${end.y}`
}
    
export default drawDiagonalEdge