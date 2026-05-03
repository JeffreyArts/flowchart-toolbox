import FlowchartGrid, { FlowchartGridAbstract } from "./index"


export type PlusGridOptions = {
    cellWidth?: number
    cellHeight?: number
    lineColor?: string
    lineThickness?: number
}

export class PlusGrid extends FlowchartGridAbstract {
    type = "plus"
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
        this.parseOptions(options as PlusGridOptions)
    }

    parseOptions(options?: PlusGridOptions) {
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

    get flowchart() {
        return this.grid?.flowchart
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

        const horizontalLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
        horizontalLine.setAttribute("x1", this.cell.width *.4 + "")
        horizontalLine.setAttribute("y1", this.cell.height / 2 + "")
        horizontalLine.setAttribute("x2", this.cell.width *.6 + "")
        horizontalLine.setAttribute("y2", this.cell.height / 2 + "")
        horizontalLine.setAttribute("stroke",this.cell.lineColor)
        horizontalLine.setAttribute("stroke-width", this.cell.lineThickness.toString())

        const verticalLine = document.createElementNS("http://www.w3.org/2000/svg", "line")
        verticalLine.setAttribute("x1", this.cell.width / 2 + "")
        verticalLine.setAttribute("y1", this.cell.height *.4 + "")
        verticalLine.setAttribute("x2", this.cell.width / 2 + "")
        verticalLine.setAttribute("y2", this.cell.height *.6 + "")
        verticalLine.setAttribute("stroke",this.cell.lineColor)
        verticalLine.setAttribute("stroke-width", this.cell.lineThickness.toString())

        svgEl.appendChild(verticalLine)
        svgEl.appendChild(horizontalLine)
        
        return svgEl
    }
}

export default PlusGrid