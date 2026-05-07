import type { Flowchart } from ".."
import FlowchartTool from "."
import type { FlowchartEventContext,  FlowchartNodeEvent } from "../events"
import { FlowchartNode } from "../nodes"

export type EditNodeTextToolOptions = {
    autoFocus: boolean
}

export class EditNodeTextTool extends FlowchartTool {
    name = "edit-node-text"
    
    state = {
        active: true,
        focus: false,
        blinkInterval: undefined as ReturnType<typeof setInterval> | undefined,
        selectedNode: undefined as FlowchartNode | undefined,
        inputElement: undefined as HTMLInputElement | undefined,
        caretIndexX: 0,
    }

    options = new Proxy<EditNodeTextToolOptions>({
        autoFocus: true,
    }, {
        set: (target, prop, value) => {
            (target as Record<string, any>)[prop as string] = value

            return true
        }
    })
    
    constructor(flowchart: Flowchart, options?: EditNodeTextToolOptions) {
        super(flowchart)
        
        this.updateOptions(options)

        this.flowchart.events.add("nodeAdded", this.onNodeAdded)
        this.flowchart.events.add("mouseDown", this.onMouseDown, -1)
        this.flowchart.events.add("mouseMove", this.onMouseMove, -1)
        this.flowchart.events.add("keyDown", this.onKeyDown)
        this.flowchart.events.add("keyUp", this.onKeyUp)
    }
    
    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 

    private updateOptions(options?: Partial<EditNodeTextToolOptions>) {
        if (options) {
            Object.assign(this.options, options)
        }
    }

    private createEditableTextElement(node: FlowchartNode, caretPos: { x: number, y: number, index: number }) {
        const inputElement = document.createElement("input")
        inputElement.type = "text"
        inputElement.value = node.text
        inputElement.style.position = "absolute"
        inputElement.style.left = `${node.x}px`
        inputElement.style.top = `${node.y}px`
        inputElement.style.width = `${node.width}px`
        inputElement.style.height = `${node.height}px`
        document.body.appendChild(inputElement)
        inputElement.setSelectionRange(caretPos.index, caretPos.index)
        const onBlur = () => {
            node.text = inputElement.value
            
            this.state.inputElement = undefined
            this.state.selectedNode = undefined

            document.body.removeChild(inputElement)
            inputElement.removeEventListener("blur", onBlur)
            inputElement.removeEventListener("input", onInput)
            node.svgGroup.querySelector("#text-caret")?.remove() 
        }
        
        const onInput = (event: Event) => {
            // if (event.key === "Enter") {
            //     inputElement.blur()
            // } else {
            // }
            node.svgGroup.querySelector("#text-caret")?.remove()
            node.text = inputElement.value
            setTimeout(() => {
                const caretIndex = inputElement.selectionStart ?? node.text.length
                this.createBlinkingCursor(node, this.indexToPosition(node, caretIndex))
            }, 0)
        }

        inputElement.addEventListener("blur", onBlur)
        inputElement.addEventListener("input", onInput)
        this.state.inputElement = inputElement
        this.createBlinkingCursor(node, caretPos)

        if (!this.state.blinkInterval) {
            this.state.blinkInterval = setInterval(() => {
                if (!this.state.focus) { 
                    return clearInterval(this.state.blinkInterval)
                }
                const caret = node.svgGroup.querySelector("#text-caret")
                if (!caret) return
                
                const opacity = caret.getAttribute("opacity") === "0" ? "1" : "0"
                caret.setAttribute("opacity", opacity)
                
            }, 500)
        }
        setTimeout(() => inputElement.focus(), 0)
    }
    
    private getCaretPositionFromClick(node: FlowchartNode, pos: { x: number, y: number }): { x: number, y: number, index: number } {
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        if (!textEl) return { x: node.x, y: node.y, index: 0 }

        const tspanArray = Array.from(textEl.querySelectorAll("tspan"))
        let globalIndex = 0

        for (const tspan of tspanArray) {
            const tspanLength = tspan.textContent?.length ?? 0

            for (let i = 0; i < tspanLength; i++) {
                const extent = textEl.getExtentOfChar(globalIndex)
                const inRow = pos.y >= extent.y && pos.y <= extent.y + extent.height

                if (inRow && pos.x < extent.x + extent.width / 2) {
                    return this.indexToPosition(node, globalIndex)
                }

                if (inRow) {
                // past midpoint of this char, keep scanning
                    globalIndex++
                    continue
                }

                globalIndex++
            }
        }

        // Click was past all characters — return end of text
        return this.indexToPosition(node, textEl.getNumberOfChars())
    }

    private indexToPosition(node: FlowchartNode, index: number): { x: number, y: number, index: number } {
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        if (!textEl || node.text.length === 0) return { x: node.x, y: node.y, index }

        const clampedIndex = Math.min(index, textEl.getNumberOfChars() - 1)
    
        if (index >= textEl.getNumberOfChars()) {
        // End of text: use end of last character
            const last = textEl.getExtentOfChar(clampedIndex)
            return { x: last.x + last.width, y: last.y, index }
        }
        console.log("Index to position:", { index, clampedIndex })

        this.state.caretIndexX = index  // not clampedIndex
        const extent = textEl.getExtentOfChar(clampedIndex)
        return { x: extent.x, y: extent.y, index }
    }
    
    private createBlinkingCursor(node: FlowchartNode, caret: { x: number, y: number, index: number }): SVGLineElement {
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        const fontSize = parseFloat(getComputedStyle(textEl ?? node.svgGroup).fontSize) || 16

        const cursorX = caret.x
        const cursorY = caret.y  // already absolute SVG Y from getExtentOfChar

        const cursor = document.createElementNS("http://www.w3.org/2000/svg", "line")
        cursor.setAttribute("x1", `${cursorX}`)
        cursor.setAttribute("x2", `${cursorX}`)
        cursor.setAttribute("y1", `${cursorY}`)
        cursor.setAttribute("y2", `${cursorY + fontSize}`)
        cursor.setAttribute("stroke", "black")
        cursor.setAttribute("stroke-width", ".5")
        cursor.setAttribute("id", "text-caret")
        cursor.style.animation = "blink 1s step-start infinite"

        node.svgGroup.appendChild(cursor)
        return cursor
    }

    // ██████ ▄▄ ▄▄ ▄▄▄▄▄ ▄▄  ▄▄ ▄▄▄▄▄▄ ▄▄▄▄ 
    // ██▄▄   ██▄██ ██▄▄  ███▄██   ██  ███▄▄ 
    // ██▄▄▄▄  ▀█▀  ██▄▄▄ ██ ▀██   ██  ▄▄██▀ 

    private onKeyDown = (_fec: FlowchartEventContext) => {
        if (!this.state.active) return

        // console.log("EditNodeTextTool: Key down")
    }
    
    private onKeyUp = (_fec: FlowchartEventContext) => {
        if (!this.state.active) return
        if (!this.state.inputElement) return
        if (!this.state.selectedNode) return

        const event = _fec.originalEvent as KeyboardEvent
        if (!event.key) return

        if (event.key === "Enter") {
            this.state.inputElement.blur()
            return
        }

        if (event.key === "ArrowLeft") {
            this.state.selectedNode?.svgGroup.querySelector("#text-caret")?.remove()
            this.state.caretIndexX = Math.max(0, this.state.caretIndexX - 1)
            this.createBlinkingCursor(this.state.selectedNode, this.indexToPosition(this.state.selectedNode, this.state.caretIndexX))
        } else if (event.key === "ArrowRight") {
            this.state.selectedNode?.svgGroup.querySelector("#text-caret")?.remove()
            this.state.caretIndexX = Math.min(this.state.selectedNode.text.length, this.state.caretIndexX + 1)
            this.createBlinkingCursor(this.state.selectedNode, this.indexToPosition(this.state.selectedNode, this.state.caretIndexX))
        }
    }

    private onMouseDown = (fec: FlowchartEventContext) => {  
        console.log("EditNodeTextTool: Mouse down", fec)
        if (!this.state.active) return
        const event = fec.originalEvent as MouseEvent
        const target = event.target as SVGTSpanElement || undefined
        const mousePos = this.flowchart.events.mousePos
        if (!target || target.nodeName.toLowerCase() !== "tspan") return

        const selectedNode = this.flowchart.nodes.find(node => node.shape.containsPoint(mousePos))
        if (!selectedNode) {
            this.state.focus = false
            this.state.blinkInterval = undefined
            return
        }

        fec.stopPropagation()
        
        const caretPos = this.getCaretPositionFromClick(selectedNode, mousePos)
        this.state.selectedNode = selectedNode
        this.state.focus = true
        
        this.createEditableTextElement(selectedNode, caretPos)
    }

    private onMouseMove = (fec: FlowchartEventContext) => {
        if (!this.state.active) return
        if (!this.state.focus) return
        if (this.state.focus) {
            fec.stopPropagation()
        }
    }
    
    private onNodeAdded = (fec: FlowchartEventContext) => {
        if (!fec.originalEvent) return
        const nodeEvent = fec.originalEvent as FlowchartNodeEvent
        const node = nodeEvent.node
        if (!node) return
    
        node.addEventListener("selected", this.onNodeSelected)
        node.addEventListener("deselected", this.onNodeDeselected)
    }
    
    private onNodeSelected = (_node: FlowchartNode) => {
        if (!this.state.active) return
        
        // console.log("EditNodeTextTool: Node selected")
    }
    
        
    private onNodeDeselected = (_node: FlowchartNode) => {
        if (!this.state.active) return

        console.log("EditNodeTextTool: Node deselected")
    }
}

export default EditNodeTextTool