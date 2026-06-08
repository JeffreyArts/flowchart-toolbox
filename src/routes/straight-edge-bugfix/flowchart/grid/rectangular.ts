import FlowchartGrid, { FlowchartGridAbstract } from "./index"


export type RectangularGridOptions = {
    cellWidth?: number
    cellHeight?: number
    lineColor?: string
    lineThickness?: number
}

export class RectangularGrid extends FlowchartGridAbstract {
    type = "rectangular"
    grid = undefined as FlowchartGrid | undefined
    cell = {
        width: 32,
        height: 32,
        lineColor: "#e0e0e0",
        lineThickness: .33,
        svg: undefined as SVGPatternElement | undefined
    }

    constructor(grid: FlowchartGrid, options?: { [key: string]: any }) {
        super(grid)

        this.parseOptions(options as RectangularGridOptions)
    }

    get flowchart() {
        return this.grid?.flowchart
    }

    parseOptions(options?: RectangularGridOptions) {
        if (!options) return

        if (options.cellWidth) {
            this.cell.width = options.cellWidth
        }

        if (options.cellHeight) {
            this.cell.height = options.cellHeight
        }

        if (options.lineColor) {
            this.cell.lineColor = options.lineColor
        }

        if (options.lineThickness) {
            this.cell.lineThickness = options.lineThickness
        }
    }

    snap(x: number, y: number) {
        const gridX = Math.round(x / this.cell.width) * this.cell.width
        const gridY = Math.round(y / this.cell.height) * this.cell.height
        return { x: gridX, y: gridY }
    }

    drawCell() {
        const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "pattern")
        svgEl.setAttribute("width", this.cell.width.toString())
        svgEl.setAttribute("height", this.cell.height.toString())
        svgEl.setAttribute("patternUnits", "userSpaceOnUse")

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        rect.setAttribute("width", this.cell.width.toString())
        rect.setAttribute("height", this.cell.height.toString())
        rect.setAttribute("fill", "none")
        rect.setAttribute("stroke", this.cell.lineColor)
        rect.setAttribute("stroke-width", this.cell.lineThickness.toString())

        svgEl.appendChild(rect)
        
        return svgEl
    }
}

export default RectangularGrid