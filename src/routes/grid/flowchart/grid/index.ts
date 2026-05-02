import type Flowchart  from "../index"

export type FlowchartGridOptions = {
    type: string
    cellWidth: number
    cellHeight: number
    fixToGrid: boolean
}

export class FlowchartGrid {
    type = "unknown"
    flowchart: Flowchart
    isActive = true
    backgroundSvg: SVGElement | undefined
    cell = {
        width: 32,
        height: 32,
        svg: undefined as SVGElement | undefined
    }
    options = {
        fixToGrid: true
    } as Partial<FlowchartGridOptions>

    constructor(flowchart: Flowchart) {
        this.flowchart = flowchart
    }

    onViewBoxChange = () => {
        this.updateGrid()
    }

    fixCoordinate(x: number, y: number) {
        const gridX = Math.round(x / this.cell.width) * this.cell.width
        const gridY = Math.round(y / this.cell.height) * this.cell.height
        return { x: gridX, y: gridY }
    }

    updateGrid() {

        if (!this.flowchart) return
        if (!this.flowchart.chart) return
        if (!this.backgroundSvg) return
        const viewBox = this.flowchart.chart.getAttribute("viewBox")
        if (!viewBox) return
        
        const [x, y, width, height] = viewBox.split(" ").map(Number)
        if (!x || !y || !width || !height) return

        this.backgroundSvg.setAttribute("width", width.toString())
        this.backgroundSvg.setAttribute("height", height.toString())
        this.backgroundSvg.setAttribute("x", x.toString())
        this.backgroundSvg.setAttribute("y", y.toString())
    }

    createGrid() {
        if (!this.flowchart) return
        if (!this.flowchart.chart) return
        if (!this.cell.svg) { this.drawCell() }
        
        this.backgroundSvg = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        this.backgroundSvg.setAttribute("fill", "url(#grid-pattern)")
        this.flowchart.chart.insertBefore(this.backgroundSvg, this.flowchart.chart.firstChild)

        this.updateGrid()
        this.flowchart.events.add("viewBoxChange", this.onViewBoxChange)
    }

    drawCell() {
        if (!this.flowchart) return
        if (!this.flowchart.chart) return
        
        this.cell.svg = document.createElementNS("http://www.w3.org/2000/svg", "pattern")
        this.cell.svg.setAttribute("id", "grid-pattern")
        this.cell.svg.setAttribute("width", this.cell.width.toString())
        this.cell.svg.setAttribute("height", this.cell.height.toString())
        this.cell.svg.setAttribute("patternUnits", "userSpaceOnUse")

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        rect.setAttribute("width", this.cell.width.toString())
        rect.setAttribute("height", this.cell.height.toString())
        rect.setAttribute("fill", "none")
        rect.setAttribute("stroke", "#e0e0e0")
        rect.setAttribute("stroke-width", "1")

        this.cell.svg.appendChild(rect)
        this.flowchart.chart.appendChild(this.cell.svg)
    }

    activate() {
        this.isActive = true
    }

    deactivate() {
        this.isActive = false
    }
}

export default FlowchartGrid