import { PanTool } from "./chart-tools/pan"
import { ZoomTool } from "./chart-tools/zoom"
import { StartNode } from "./nodes/start"
import { ProcessNode } from "./nodes/process"

export class Flowchart {
    el = null as HTMLElement | null
    nodes = [] as Array<StartNode | ProcessNode>
    chart: HTMLDivElement

    _tools = [] as Array<{ name: string, object: PanTool | ZoomTool | null }>


    _zoom = 1
    
    pan = new Proxy({ x: 0, y: 0 }, {
        set: (target, prop, value) => {
            target[prop as "x" | "y"] = value
            this.chart.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`
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

    get width() {
        return this.el?.clientWidth || 0
    }

    get height() {
        return this.el?.clientHeight || 0
    }

    set zoom(value: number) {
        this._zoom = value
        this.chart.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`
    }

    get zoom() {
        return this._zoom
    }

    add(type: string, text?: string | number) {
        if (!this.el) return
        if (!text) text = ""
        if (typeof text === "number") text = text.toString()

        let node
        if (type === "start") {
            node = new StartNode(this, text)
        } else if (type === "process") {
            node = new ProcessNode(this, text)
        }

        if (node) {
            this.nodes.push(node)
        }

        return node
    }

    selectTool(tool: string) {
        // Check if tool already exists in _tools
        const existingTool = this._tools.find(t => t.name === tool)
        if (existingTool) {
            return
        }

        // Add new tool to _tools
        let newTool: PanTool | ZoomTool | null = null
        if (tool === "pan") {
            newTool = new PanTool(this)
        } else if (tool === "zoom") {
            newTool = new ZoomTool(this)
        }
        if (newTool) {
            this._tools.push({ name: tool, object: newTool })
        }

        if (this.el) {

            // if this.el.classList has a class that starts with "__tool", remove it
            const toolClasses = Array.from(this.el.classList).filter(c => c.startsWith("__tool"))
            toolClasses.forEach(c => this.el?.classList.remove(c))

            // Add class for the current tool
            this.el.classList.add(`__tool${tool.charAt(0).toUpperCase() + tool.slice(1)}`)

            this.el.setAttribute("data-tool", tool)
        }
    }

    deselectTool(toolName: string) {
        // Remove tool from _tools
        const tool = this._tools.find(t => t.name === toolName)
        if (tool) {
            if (tool.object) {
                tool.object.destroy()
            }
            this._tools = this._tools.filter(t => t.name !== toolName)
        }

        if (this.el) {

            // Remove class for the current tool
            this.el.classList.remove(`__tool${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`)

            this.el.removeAttribute("data-tool")
        }
    }

    destroy() {
        this.nodes = []
        this.chart.remove()

        this._tools.forEach(t => t.object?.destroy())

        this.el = null
    }
}

export default Flowchart