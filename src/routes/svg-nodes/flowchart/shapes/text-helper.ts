class TextHelper {
    private el: HTMLDivElement
    private text: string = ""

    constructor(text: string = "", styles?: Partial<CSSStyleDeclaration>) {
        
        this.text = text
        this.el = document.createElement("div")

        // Plaats de helper off-screen en onzichtbaar zodat het geen invloed heeft op de layout
        Object.assign(this.el.style, {
            position: "fixed",
            pointerEvents: "none",
            // visibility: "hidden",
            // right: "-100vw",
            // bottom: "-100vh",
            right: "0vw",
            bottom: "00vh",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word"
        })

        // Voeg overige styling toe
        Object.assign(this.el.style, styles)

        document.body.appendChild(this.el)
    }

    get lines() {
        const lines = []
        const range = document.createRange()
        range.selectNodeContents(this.el)
        
        const rects = range.getClientRects() // DOMRectList van alle fragmenten

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
            if (line.trim().length > 0) {
                lines.push(line)
            }
        }
    
        return lines
    }

    measure() {
        
        if (!this.text.length) return { width: 0, height: 0, lines: [], lineHeight: 0 }

        this.el.textContent = this.text

        const rect = this.el.getBoundingClientRect()
        const lineHeight = parseFloat(getComputedStyle(this.el).lineHeight || "16px")

        return {
            width: rect.width,
            height: rect.height,
            lines: this.lines, 
            lineHeight
        }
    }

    destroy() {
        this.el.remove()
    }
}

export { TextHelper }
export default TextHelper