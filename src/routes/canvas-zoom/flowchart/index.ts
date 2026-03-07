import { PanTool } from "./chart-tools/pan"
import { StartNode } from "./start"

export class Flowchart {
    el = null as HTMLElement | null
    nodes = [] as Array<StartNode>
    chart: HTMLDivElement

    _tool = {
        name: "none",
        object: null as PanTool | null
    } 
    
    pan = new Proxy({ x: 0, y: 0 }, {
        set: (target, prop, value) => {
            target[prop as "x" | "y"] = value
            this.chart.style.translate = `${target.x}px ${target.y}px`
            return true
        }
    })

    constructor(el?: HTMLElement | string, options?: {}) { 
        if (!el) {
            this.el = document.createElement("div")
            this.el.classList.add("flowchart")
        } else if (typeof el === "string") {
            this.el = document.querySelector(el)
            if (!this.el) {
                throw new Error(`Failed to initialize flowchart: No element found with selector "${el}"`)
            }
        } else if (el instanceof HTMLElement) {
            this.el = el
        }

        if (!this.el) {
            throw new Error("Failed to initialize flowchart: Invalid element")
        }

        if (!this.el.classList.contains("flowchart")) {
            this.el?.classList.add("flowchart")
        }

        const oldChart = this.el.querySelector(".flowchart-chart")
        if (oldChart) {
            this.el.removeChild(oldChart)
        }

        this.chart = document.createElement("div")
        this.chart.className = "flowchart-chart"
        this.el.appendChild(this.chart)
    }

    set tool(value: string) {

        if (this._tool.object) {
            this._tool.object.destroy()
        }

        this._tool.name = value
        

        if (value == "pan") {
            this._tool.object = new PanTool(this)
        }

        if (this.el) {
            this.el.setAttribute("data-tool", value)
        }
    }

    get width() {
        return this.el?.clientWidth || 0
    }

    get height() {
        return this.el?.clientHeight || 0
    }

    add(type: string, text?: string | number) {
        if (!this.el) return
        if (!text) text = ""
        if (typeof text === "number") text = text.toString()

        let node
        if (type === "start") {
            node = new StartNode(this, text)
        }

        if (node) {
            this.nodes.push(node)
        }

        return node
    }

    selectTool(tool: string) {
        if (this._tool.name === tool) {
            return
        } 
        
        this.tool = tool
    }

    destroy() {
        this.nodes = []
        this.chart.remove()

        this.el = null
    }
}

export default Flowchart