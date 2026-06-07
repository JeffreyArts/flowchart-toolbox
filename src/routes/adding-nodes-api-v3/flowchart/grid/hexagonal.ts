import FlowchartGrid, { FlowchartGridAbstract } from "./index"


export type HexagonalGridOptions = {
    cellDiameter?: number
    lineThickness?: number
    lineColor?: string
}

export class HexagonalGrid extends FlowchartGridAbstract {
    type = "hexagonal"
    grid = undefined as FlowchartGrid | undefined
    cell = {
        width: 32,
        height: 32,
        lineThickness: 1,
        lineColor: "#e0e0e0",
        svg: undefined as SVGPatternElement | undefined
    }

    constructor(grid: FlowchartGrid, options?: { [key: string]: any }) {
        super(grid)

        this.parseOptions(options as HexagonalGridOptions)
    }

    get flowchart() {
        return this.grid?.flowchart
    }

    parseOptions(options?: HexagonalGridOptions) {
        if (!options) return

        if (options.cellDiameter) {
            this.cell.width = options.cellDiameter
            this.cell.height = options.cellDiameter
        }
        
        if (options.lineThickness) {
            this.cell.lineThickness = options.lineThickness
        }
    }

    private hexPoints(cx: number, cy: number, r: number): string {
        return Array.from({ length: 6 }, (_, i) => {
            const angle = (Math.PI / 180) * (60 * i) // flat-top: 0°, 60°, 120°...
            const x = cx + r * Math.cos(angle)
            const y = cy + r * Math.sin(angle)
            return `${x},${y}`
        }).join(" ")
    }
    
    snap(x: number, y: number) {
        const diameter = this.cell.width
        const w = diameter
        const h = Math.sqrt(3) / 2 * diameter

        // Column and row in hex grid
        const col = Math.round(x / (w * 0.75))
        const isOddCol = col % 2 !== 0
        const offsetY = isOddCol ? h / 2 : 0

        const row = Math.round((y - offsetY) / h)

        // Convert back to pixel coordinates
        const snappedX = col * w * 0.75
        const snappedY = row * h + offsetY

        return { x: snappedX, y: snappedY }
    }

    drawCell() {
        const diameter = this.cell.width
        const r = diameter / 2
        const h = Math.sqrt(3) * r

        const patternWidth = r * 3
        const patternHeight = h

        const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "pattern")
        svgEl.setAttribute("width", patternWidth.toString())
        svgEl.setAttribute("height", patternHeight.toString())
        svgEl.setAttribute("patternUnits", "userSpaceOnUse")

        // Centreer de hexagonen BINNEN de tile
        const hexagons = [
            { cx: r,        cy: h / 2   },  // linker hex, gecentreerd in tile
            { cx: r * 2.5,  cy: 0       },  // rechter hex boven
            { cx: r * 2.5,  cy: h       },  // rechter hex onder
        ]

        for (const { cx, cy } of hexagons) {
            const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon")
            polygon.setAttribute("points", this.hexPoints(cx, cy, r))
            polygon.setAttribute("fill", "none")
            polygon.setAttribute("stroke",this.cell.lineColor)
            polygon.setAttribute("stroke-width", this.cell.lineThickness.toString())
            svgEl.appendChild(polygon)
        }

        return svgEl
    }
}

export default HexagonalGrid