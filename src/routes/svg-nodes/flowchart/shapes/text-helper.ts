import type FlowchartShape  from "./index"

class TextHelper {
    parentEl: HTMLDivElement
    el: HTMLDivElement
    leftEl = undefined as  HTMLDivElement | undefined
    rightEl = undefined as  HTMLDivElement | undefined
    private text: string = ""

    constructor(text: string = "", shape: FlowchartShape, styles?: Partial<CSSStyleDeclaration>) {
        
        this.text = text
        this.parentEl = document.createElement("div")
        this.el = document.createElement("div")
        
        this.leftEl = document.createElement("div")
        this.leftEl.style.float = "left"
        this.leftEl.classList.add("text-helper-left")

        this.rightEl = document.createElement("div")
        this.rightEl.style.float = "right"
        this.rightEl.classList.add("text-helper-right")
        this.parentEl.appendChild(this.leftEl)
        this.parentEl.appendChild(this.rightEl)
        
        if (shape.afterTextHelperCreated) {
            shape.afterTextHelperCreated(this)
        }

        // Plaats de helper off-screen en onzichtbaar zodat het geen invloed heeft op de layout
        Object.assign(this.parentEl.style, {
            position: "fixed",
            // pointerEvents: "none",
            // visibility: "hidden",
            // right: "-100vw",
            // bottom: "-100vh",
            right: "0vw",
            bottom: "0vh",
            textAlign: "center",
            wordWrap: "break-word"
        })

        // Voeg overige styling toe
        Object.assign(this.parentEl.style, styles)
        this.parentEl.appendChild(this.el)
        
        if (!this.parentEl.style.maxWidth) {
            this.parentEl.style.maxWidth = "200px"
        }

        this.el.style.minWidth = "100px"

        document.body.appendChild(this.parentEl)
    }

    get lines() {
        const lines = []
        const range = document.createRange()
        range.selectNodeContents(this.el)
        const rects = range.getClientRects()

        // return rects.length
        let startOffset = 0
        for (let i = 0; i < rects.length; i++) {
            
            // DOMRange API om substring te vinden
            // Hier gebruiken we een kleine heuristiek: selecteer steeds 1 karakter vooruit tot rect verandert
            let line = ""
            for (let j = startOffset; j < this.text.length; j++) {
                range.setStart(this.el.firstChild!, startOffset)
                range.setEnd(this.el.firstChild!, j + 1)
                const r = range.getClientRects()

                if (r.length > 1) break // nieuwe visual line
                line += this.text[j]
            }

            startOffset += line.length
            lines.push(line)
        }
    
        return lines
    }

    measure(): { width: number, height: number, lines: string[],  lineHeight: number } {
        
        if (!this.text.length) return { width: 0, height: 0, lines: [], lineHeight: 0 }
        this.el.textContent = this.text
    
        
        const rectParent = this.parentEl.getBoundingClientRect()
        const rectText = this.el.getBoundingClientRect()
        
        
        const rectParentHeight = rectParent.height //- parseFloat(this.parentEl.style.paddingTop) - parseFloat(this.parentEl.style.paddingBottom)
        if (this.leftEl) {
            this.leftEl.style.height = rectParentHeight + "px"
        }
        if (this.rightEl) {
            this.rightEl.style.height = rectParentHeight + "px"
        }
        
        this.el.style.paddingTop = (rectParent.height - rectText.height) / 2  + "px"

        const computedStyle = getComputedStyle(this.parentEl)
        const paddingTop = parseFloat(computedStyle.paddingTop || "0")
        const paddingBottom = parseFloat(computedStyle.paddingBottom || "0")
        
        const cleanHeight = this.parentEl.getBoundingClientRect().height - paddingTop - paddingBottom
        if (Math.floor(rectParentHeight) < Math.floor(cleanHeight) && rectParentHeight < 300) {
            return this.measure() 
        }
        
        const lineHeight = parseFloat(getComputedStyle(this.parentEl).lineHeight || "16px")
        
        return {
            width: rectParent.width,
            height: rectParent.height,
            lines: this.lines, 
            lineHeight
        }
    }

    destroy() {
        this.el.remove()
        this.parentEl.remove()
    }
}

export { TextHelper }
export default TextHelper