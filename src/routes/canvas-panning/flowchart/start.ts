// import { type FlowchartType } from "./types"

export class StartNode {
    x: number | string
    y: number | string
    width: number = 0
    height: number = 0

    id: string = crypto.randomUUID()
    el: HTMLElement
    chart: FlowchartType | null = null
    pos = { x: "", y: "" }
    
    isVisible: boolean = false
    
    // private contentEl: HTMLElement

    constructor(chart: FlowchartType, text: string) {
        this.x = "50%"
        this.y = "50%"
        
        this.chart = chart
        
        this.el = document.createElement("div")
        this.el.className = "flowchart-node start-node"
        this.el.style.opacity = "0"
        this.chart.canvas.appendChild(this.el)
 
        this.text = text

        // container.appendChild(this.chart.canvas)
        this.updatePosition()
    }

    get lines(): string[] {
        return this.text.split("\n")
    }

    private _text: string = ""

    get text(): string {
        return this._text
    }

    set text(value: string) {
        this._text = value
        this.renderLines()
        this.updatePosition()
    }

    private renderLines() {
        this.el.innerHTML = ""
        for (const line of this.lines) {
            const div = document.createElement("div")
            div.textContent = line
            this.el.appendChild(div)
        }
    }

    updatePosition(first = true) {
        const rect = this.el.getBoundingClientRect()
        this.width = rect.width
        this.height = rect.height

        setTimeout(() => {
            if (first) {
                this.updatePosition(false)
                setTimeout(() => {
                    this.setPosX()
                    this.setPosY()
                }, 0)
                this.isVisible = true
                this.el.style.opacity = "1"
            }
        }, 0)
    }

    setPosX() {
        if (!this.chart) return

        if (typeof this.x === "number") {
            this.pos.x = this.x + "px"
        } else if (this.x.includes("%")) {
            this.pos.x = this.chart.width * parseFloat(this.x) / 100 - this.width / 2 + "px"
        } else {
            this.pos.x = this.x
        }
        this.el.style.translate = `${this.pos.x} ${this.pos.y}`
    }

    setPosY() {
        if (!this.chart) return

        if (typeof this.y === "number") {
            this.pos.y = this.y + "px"
        } else if (this.y.includes("%")) {
            this.pos.y = this.chart.height * parseFloat(this.y) / 100 - this.height / 2 + "px"
        } else {
            this.pos.y = this.y
        }
        this.el.style.translate = `${this.pos.x} ${this.pos.y}`
    }
}