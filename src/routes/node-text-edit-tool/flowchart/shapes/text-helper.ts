import type FlowchartShape  from "./index"

class TextHelper {
    parentEl: HTMLDivElement
    el: HTMLDivElement
    leftEl = undefined as  HTMLDivElement | undefined
    rightEl = undefined as  HTMLDivElement | undefined

    constructor(text: string = "", shape: FlowchartShape, style?: Partial<CSSStyleDeclaration>) {
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
            right: "0vw",
            bottom: "0vh",
            textAlign: "center",
            wordWrap: "break-word",
            ...style
        })
        
        this.parentEl.appendChild(this.el)
        
        // Max width is required
        if (!this.parentEl.style.maxWidth) {
            this.parentEl.style.maxWidth = "200px"
        }
        
        this.el.style.minWidth = "100px"
        
        document.body.appendChild(this.parentEl)
    }
                                        
    // █████▄ ▄▄▄▄  ▄▄ ▄▄ ▄▄  ▄▄▄ ▄▄▄▄▄▄ ▄▄▄▄▄ 
    // ██▄▄█▀ ██▄█▄ ██ ██▄██ ██▀██  ██   ██▄▄  
    // ██     ██ ██ ██  ▀█▀  ██▀██  ██   ██▄▄▄ 
    
    private text: string = "" 

    // █████▄ ▄▄ ▄▄ ▄▄▄▄  ▄▄    ▄▄  ▄▄▄▄ 
    // ██▄▄█▀ ██ ██ ██▄██ ██    ██ ██▀▀▀ 
    // ██     ▀███▀ ██▄█▀ ██▄▄▄ ██ ▀████   

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
        
        
        const rectParentHeight = rectParent.height 
        if (this.leftEl) {
            this.leftEl.style.height = rectParentHeight + "px"
        }
        if (this.rightEl) {
            this.rightEl.style.height = rectParentHeight + "px"
        }
        
        this.parentEl.style.paddingTop = (rectParent.height - rectText.height) / 2  + "px"
        
        // Dit zorgt ervoor dat de zijkanten niet verkeerd de tekst-mask formatten
        if (rectText.width < parseFloat(this.parentEl.style.maxWidth)*.8 ) {
            if (this.rightEl && this.leftEl) {
                this.rightEl.style.display = "none"
                this.leftEl.style.display = "none"
            }
        }
        
        // Als de parent height kleiner is dan de text height, dan is er waarschijnlijk een nieuwe line bijgekomen. Meet dan opnieuw, 
        // tot we stabiel zijn (of we een maxHeight van bv 640px bereiken om infinite loops te voorkomen)
        if (Math.floor(rectParentHeight) < Math.floor(rectParent.height) && rectParentHeight < 640) {
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