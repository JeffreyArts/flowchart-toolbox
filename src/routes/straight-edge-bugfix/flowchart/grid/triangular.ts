import FlowchartGrid, { FlowchartGridAbstract } from "./index"


export type TriangularGridOptions = {
    cellDiameter?: number
    lineThickness?: number
    lineColor?: string
}

export class TriangularGrid extends FlowchartGridAbstract {
    type = "triangular"
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

        this.parseOptions(options as TriangularGridOptions)
    }

    get flowchart() {
        return this.grid?.flowchart
    }

    parseOptions(options?: TriangularGridOptions) {
        if (!options) return

        if (options.cellDiameter) {
            this.cell.width = options.cellDiameter
            this.cell.height = options.cellDiameter
        }
        
        if (options.lineThickness) {
            this.cell.lineThickness = options.lineThickness
        }
    }

    snap(x: number, y: number) {
        const s = this.cell.width
        const h = Math.sqrt(3) / 2 * s

        const row = Math.round(y / h)
        const isEvenRow = row % 2 === 0

        const offsetX = isEvenRow ? s / 2 : 0
        const col = Math.round((x - offsetX) / s)

        return {
            x: col * s + offsetX,
            y: row * h
        }
    }

    drawCell() {
        const width = this.cell.width
        const height = Math.sqrt(3) / 2 * width

        const patternWidth = width
        const patternHeight = height * 2

        const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "pattern")
        svgEl.setAttribute("width", patternWidth.toString())
        svgEl.setAttribute("height", patternHeight.toString())
        svgEl.setAttribute("patternUnits", "userSpaceOnUse")

        const stroke = this.cell.lineColor
        const strokeWidth = this.cell.lineThickness.toString()

        const lines = [
            // Horizontale lijnen
            { x1: 0,       y1: 0,           x2: width,       y2: 0      },
            { x1: 0,       y1: height,      x2: width,       y2: height      },
            { x1: 0,       y1: height * 2,  x2: width,       y2: height * 2  },

            // Rij 1: omhoog wijzende driehoek (\ en /)
            { x1: width/2, y1: 0,           x2: 0,           y2: height      },
            { x1: width/2, y1: 0,           x2: width,       y2: height      },

            // Rij 2: omlaag wijzende driehoek (/ en \)
            { x1: 0,       y1: height,      x2: width / 2,   y2: height * 2  },
            { x1: width,   y1: height,      x2: width / 2,   y2: height * 2  },
        ]

        for (const { x1, y1, x2, y2 } of lines) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
            line.setAttribute("x1", x1.toString())
            line.setAttribute("y1", y1.toString())
            line.setAttribute("x2", x2.toString())
            line.setAttribute("y2", y2.toString())
            line.setAttribute("stroke", stroke)
            line.setAttribute("stroke-width", strokeWidth)
            svgEl.appendChild(line)
        }

        return svgEl
    }
}

export default TriangularGrid