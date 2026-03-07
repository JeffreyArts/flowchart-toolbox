import type { FlowchartType } from "@/routes/canvas-zoom/flowchart/types"

export class FlowchartNode {
    type: string = "unknown"
    x: number | string
    y: number | string
    width: number = 0
    height: number = 0

    offsetPadding = 40

    id: string = crypto.randomUUID()
    el: HTMLElement
    flowchart: FlowchartType | null = null

    
    pos = { x: "", y: "" }
    
    private _isHover: boolean = false
    private _isVisible: boolean = false
    private _text: string = ""

    init?(): void

    constructor(chart: FlowchartType, text: string) {
        this.x = "50%"
        this.y = "50%"
        
        this.flowchart = chart
        
        this.el = document.createElement("div")
        this.el.style.opacity = "0"
        this.flowchart.chart.appendChild(this.el)
        this.el.classList.add("flowchart-node")
        this.text = text

        // container.appendChild(this.flowchart.canvas)
        this.updatePosition()
        this.#init()

        if (this.flowchart.el) {
            this.flowchart.el.addEventListener("mousemove", this.setIsHover)
        }
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

    set isVisible(value: boolean) {
        if (value) {
            this.el.style.opacity = "1"
        } else {
            this.el.style.opacity = "0"
        }
        this._isVisible = value
    }

    get isVisible() {
        return this._isVisible
    }

    set isHover(value: boolean) {
        if (value) {
            this.onMouseEnter()
        } else {
            this.onMouseLeave()
        }
        this._isHover = value
    }

    get isHover() {
        return this._isHover
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

    onMouseEnter() {}
    onMouseLeave() {}

    destroy() {
        if (this.flowchart?.el) {
            this.flowchart.el.removeEventListener("mousemove", this.setIsHover)
        }
        this.el.remove()
    }

    setIsHover = (e: MouseEvent) => {
        if (!this.flowchart?.el) return

        const rect = this.el.getBoundingClientRect()
        const mouseX = e.clientX
        const mouseY = e.clientY

        if (this.type === "process") {
            this.isHover = mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom
        } else if (this.type === "start" || this.type === "end") {
            const radius = rect.height / 2
            const centerLeftX = rect.left + radius
            const centerRightX = rect.right - radius
            const centerY = rect.top + radius
            const distToLeftCenter = Math.sqrt((mouseX - centerLeftX) ** 2 + (mouseY - centerY) ** 2)
            const distToRightCenter = Math.sqrt((mouseX - centerRightX) ** 2 + (mouseY - centerY) ** 2)

            this.isHover = (distToLeftCenter <= radius || distToRightCenter <= radius) || (mouseX >= centerLeftX && mouseX <= centerRightX && mouseY >= rect.top && mouseY <= rect.bottom)
        } else if (this.type === "decision") {
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2
            const dx = Math.abs(mouseX - centerX)
            const dy = Math.abs(mouseY - centerY)
            const thresholdX = rect.width / 2 * Math.SQRT1_2
            const thresholdY = rect.height / 2 * Math.SQRT1_2
            this.isHover = dx + dy <= thresholdX && dx + dy <= thresholdY
        }
        // this.isHover = mouseX >= rect.left && mouseX <= rect.right && mouseY >= rect.top && mouseY <= rect.bottom

    }
}

export default FlowchartNode