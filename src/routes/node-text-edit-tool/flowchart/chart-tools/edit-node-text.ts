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

    private createEditableTextElement(node: FlowchartNode, caretPos: number) {
        const inputElement = document.createElement("input")
        inputElement.type = "text"
        inputElement.value = node.text
        inputElement.style.position = "absolute"
        inputElement.style.left = `${node.x}px`
        inputElement.style.top = `${node.y}px`
        inputElement.style.width = `${node.width}px`
        inputElement.style.height = `${node.height}px`
        document.body.appendChild(inputElement)
        inputElement.setSelectionRange(caretPos, caretPos)
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
            const newCaretPos = inputElement.selectionStart ?? node.text.length
            this.createBlinkingCursor(node, newCaretPos)
            node.text = inputElement.value
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
    
    private getCaretPositionFromClick(node: FlowchartNode, clickX: number): number {
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
        if (!textEl) return node.text.length
        
        for (let i = 0; i < node.text.length; i++) {
            const extent = textEl.getExtentOfChar(i)
            if (clickX < extent.x + extent.width / 2) return i
        }
        return node.text.length
    }

    private caretXPosition(node: FlowchartNode, caretPos: number): number {
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null

        if (!textEl) return node.x

        // Use SVG's own measurement for the full text width
        const fullWidth = textEl.getComputedTextLength()
        const fullText = node.text

        if (fullText.length === 0) return textEl.getBBox().x

        // Scale factor between canvas pixels and SVG units
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        ctx.font = getComputedStyle(textEl).font

        const canvasFullWidth = ctx.measureText(fullText).width
        const scale = fullWidth / canvasFullWidth  // SVG units per canvas pixel

        const textUpToCaret = fullText.substring(0, caretPos)
        const canvasCaretWidth = ctx.measureText(textUpToCaret).width

        return textEl.getBBox().x + canvasCaretWidth * scale
    }

    private createBlinkingCursor(node: FlowchartNode, caretPos: number): SVGLineElement {
        const textEl = this.flowchart.chart.querySelector(`[id="${node.id}"] text`) as SVGTextElement | null
    
        // Bereken de X positie van de cursor
        let cursorX = this.caretXPosition(node, caretPos)
        // if (textEl && node.text.length > 0) {
        //     const svgCharCount = textEl.getNumberOfChars()

        //     if (caretPos >= node.text.length || caretPos >= svgCharCount) {
        //         if (svgCharCount > 0) {
        //         // Use the end position of the last visible character
        //             const lastIndex = svgCharCount - 1
        //             cursorX = textEl.getStartPositionOfChar(lastIndex).x + textEl.getSubStringLength(lastIndex, 1)
        //         } else {
        //         // No visible characters at all (e.g. all spaces)
        //             cursorX = textEl.getBBox().x
        //         }
        //     } else if (caretPos > 0) {
        //         cursorX = textEl.getStartPositionOfChar(caretPos - 1).x + textEl.getSubStringLength(caretPos - 1, 1)
        //     } else {
        //         cursorX = textEl.getStartPositionOfChar(0).x
        //     }
        // }
        // caretXPosition

        const fontSize = parseFloat(getComputedStyle(textEl ?? node.svgGroup).fontSize) || 16
        
        // Maak een SVG lijn als cursor
        const cursor = document.createElementNS("http://www.w3.org/2000/svg", "line")
        cursor.setAttribute("x1", `${cursorX}`)
        cursor.setAttribute("x2", `${cursorX}`)
        cursor.setAttribute("y1", `${node.y - fontSize/2}`)
        cursor.setAttribute("y2", `${node.y + fontSize/2}`)
        cursor.setAttribute("stroke", "black")
        cursor.setAttribute("stroke-width", ".5")
        cursor.setAttribute("id", "text-caret")
        // CSS animatie voor knipperen
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

        this.state.selectedNode?.svgGroup.querySelector("#text-caret")?.remove()
        const newCaretPos = this.state.inputElement?.selectionStart ?? this.state.selectedNode?.text.length
        this.createBlinkingCursor(this.state.selectedNode, newCaretPos)
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
        
        const caretPos = this.getCaretPositionFromClick(selectedNode, mousePos.x)
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