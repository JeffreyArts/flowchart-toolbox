import type { FlowchartType } from "@/routes/canvas-zoom/flowchart/types"

export class FlowchartNode {
    type: string = "unknown"
    x: number | string
    y: number | string
    width: number = 0
    height: number = 0

    id: string = crypto.randomUUID()
    el: HTMLElement
    flowchart: FlowchartType | null = null

    pos = { x: "", y: "" }
    
    isVisible: boolean = false

    init?(): void

    constructor(chart: FlowchartType, text: string) {
        this.x = "50%"
        this.y = "50%"
        
        this.flowchart = chart
        console.log("Creating node with text:", this.type)
        
        this.el = document.createElement("div")
        this.el.style.opacity = "0"
        this.flowchart.chart.appendChild(this.el)
        this.el.classList.add("flowchart-node")
        this.text = text

        // container.appendChild(this.flowchart.canvas)
        this.updatePosition()
        this.#init()
    }

    #init() {
        setTimeout(() => {
            if (this.init) {
                this.init()
            }
        }, 0)
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
        
        // Convert text to multiple lines
        this.el.innerHTML = ""
        for (const line of this.lines) {
            const div = document.createElement("div")
            div.textContent = line
            this.el.appendChild(div)
        }

        // Update position after text change to adjust for new size
        this.updatePosition()
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
        if (!this.flowchart) return

        if (typeof this.x === "number") {
            this.pos.x = this.x + "px"
        } else if (this.x.includes("%")) {
            this.pos.x = this.flowchart.width * parseFloat(this.x) / 100 - this.width / 2 + "px"
        } else {
            this.pos.x = this.x
        }
        this.el.style.translate = `${this.pos.x} ${this.pos.y}`
    }

    setPosY() {
        if (!this.flowchart) return

        if (typeof this.y === "number") {
            this.pos.y = this.y + "px"
        } else if (this.y.includes("%")) {
            this.pos.y = this.flowchart.height * parseFloat(this.y) / 100 - this.height / 2 + "px"
        } else {
            this.pos.y = this.y
        }
        this.el.style.translate = `${this.pos.x} ${this.pos.y}`
    }
}

export default FlowchartNode