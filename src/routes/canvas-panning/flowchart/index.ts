import { StartNode } from "./start"


export class Flowchart {
    el = null as HTMLElement | null
    nodes = [] as Array<StartNode>
    canvas: HTMLDivElement

    pointerStartPos = { x: 0, y: 0 }
    _pointerDown = false
    
    pan = new Proxy({ x: 0, y: 0 }, {
        set: (target, prop, value) => {
            target[prop as "x" | "y"] = value
            this.canvas.style.transform = `translate(${target.x}px, ${target.y}px)`
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

        const oldCanvas = this.el.querySelector(".flowchart-canvas")
        if (oldCanvas) {
            this.el.removeChild(oldCanvas)
        }

        this.canvas = document.createElement("div")
        this.canvas.className = "flowchart-canvas"
        this.el.appendChild(this.canvas)


        this.el.addEventListener("pointerdown", this.#handlePointerDown)
        this.el.addEventListener("pointermove", this.#handlePointerMove)
        document.addEventListener("pointerup", this.#handlePointerUP)
    }

    set pointerDown(value: boolean) {
        this._pointerDown = value
        if (this.el) {
            if (value) {
                this.el.classList.add("__isPanning")
            } else {
                this.el.classList.remove("__isPanning")
            }
        }
    }
    
    get pointerDown() {
        return this._pointerDown
    }

    #handlePointerDown = (e: PointerEvent) => {
        this.pointerDown = true
        this.pointerStartPos = { x: e.clientX, y: e.clientY }
    }

    #handlePointerUP = (e: PointerEvent) => {
        this.pointerDown = false
        this.pointerStartPos = { x: 0, y: 0 }
    }

    #handlePointerMove = (e: PointerEvent) => {
        if (!this.pointerDown) return

        const deltaX = e.clientX - this.pointerStartPos.x
        const deltaY = e.clientY - this.pointerStartPos.y

        this.pan.x += deltaX
        this.pan.y += deltaY

        this.canvas.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px)`

        this.pointerStartPos = { x: e.clientX, y: e.clientY }
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

    destroy() {
        this.nodes = []
        this.canvas.remove()

        if (this.el) {
            this.el.removeEventListener("pointerdown", this.#handlePointerDown)
            this.el.removeEventListener("pointermove", this.#handlePointerMove)
            document.removeEventListener("pointerup", this.#handlePointerUP)
        }

        this.el = null
    }
}