import type Flowchart  from "../index"

export abstract class FlowchartGridAbstract {
    type = "unknown"
    grid = undefined as FlowchartGrid | undefined
    cell = {
        width: 32,
        height: 32,
        svg: undefined as SVGPatternElement | undefined
    }
    protected constructor(grid: FlowchartGrid, _options?: { [key: string]: any }) {
        this.grid = grid
    }
    
    abstract snap(x: number, y: number): { x: number, y: number } 
    abstract drawCell(): SVGPatternElement
} 

export interface FlowchartGridAbstractConstructor {
    new (grid: FlowchartGrid, options?: { [key: string]: any }): FlowchartGridAbstract
}

export type FlowchartGridOptions = {
    snap: boolean
    visible: boolean
    gridType: string
}

export class FlowchartGrid {
    flowchart: Flowchart
    backgroundSvg: SVGElement | undefined
    cell = {
        width: 32,
        height: 32,
        svg: undefined as SVGPatternElement | undefined
    }
    options = new Proxy<FlowchartGridOptions>({ 
        visible: true,
        snap: true,
        gridType: "none"
    }, {
        set: (target, prop, value) => {
            // Type forcing
            (target as Record<string, any>)[prop as string] = value

            if (prop == "visible") {
                if (value) {
                    this.showGrid()
                } else {
                    this.hideGrid()
                }
            }

            if (prop === "gridType") {
                this.updateGridType()
            }

            return true
        }
    })

    constructor(flowchart: Flowchart, _options?: { [key: string]: any }) {
        this.flowchart = flowchart
        this.createGrid()
    }

    private getGridObject() {
        const registeredGrid = this.flowchart.registered.grids.find(grid => grid.type === this.options.gridType)

        if (registeredGrid) {
            return registeredGrid.object
        }
        
        throw new Error(`Grid type "${this.options.gridType}" is not a registered gridType, please validate if it is correctly registered and/or check for typos.`)
    }
    
    private updateGridType() {
        const registeredGrid = this.flowchart.registered.grids.find(grid => grid.type === this.options.gridType)
        if (registeredGrid) {
            this.removeOldGrid()

            const gridObject = registeredGrid.object
            this.cell = gridObject.cell
            this.createGrid()
        }
    }

    snap(x: number, y: number) {
        const gridObject = this.getGridObject()
        return gridObject.snap(x, y)
    }

    onViewBoxChange = () => {
        this.updateGrid()
    }

    hideGrid() {
        if (this.backgroundSvg) {
            this.backgroundSvg.style.opacity = "0"
        }
    }

    showGrid() {
        if (this.backgroundSvg) {
            this.backgroundSvg.style.opacity = "1"
        }
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
        
        const gridObject = this.getGridObject()
        this.cell.svg = gridObject.drawCell()
        this.cell.svg.setAttribute("id", "grid-pattern")

        if (!this.cell.svg) return
        this.flowchart.chart.appendChild(this.cell.svg)
    }

    removeOldGrid() {
        if (this.backgroundSvg) {
            this.backgroundSvg.remove()
            this.backgroundSvg = undefined
        }
        if (this.cell.svg) {
            this.cell.svg.remove()
            this.cell.svg = undefined
        }
    }
}

export default FlowchartGrid