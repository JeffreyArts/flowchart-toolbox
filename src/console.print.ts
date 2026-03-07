const STYLES = {
    1: { bg: "#b2e0f9", text: "#333", border: "#7ac8f0" },
    2: { bg: "#ffccff", text: "#333", border: "#e066e0" },
    3: { bg: "#fffa88", text: "#333",  border: "#d4cf00" },
} as const

type StyleKey = keyof typeof STYLES

declare global {
    interface Console {
        print(header: string, body: unknown, style?: StyleKey | string): void
    }
}

// @ts-ignore
console.__proto__.print = function (header: string, body: unknown, style: StyleKey = 1, textColor?: string) {
    let bg = "#eee" 
    let text = "#333"
    let border = "transparent"

    if (typeof style === "number") {
        bg = STYLES[style].bg
        text = STYLES[style].text
        border = STYLES[style].border
    } else if (typeof style === "string") {
        bg = style
        border = style
        
        if (textColor) {
            text = textColor
        }
    }


    if (typeof body === "object" && body !== null) {
        this.log(
            `%c ${header}%c
            `,
            `background:${bg}; color:${text}; font-weight:bold; border-radius:3px; padding:2px 6px;`,
            "",
            body
        )
    } else {

        this.log(
            `%c ${header} %c

%c ${body}`,
            `background:${bg}; color:${text}; font-weight:bold; border-radius:3px; padding:2px 6px`,
            "",
            `border-left:3px solid ${border}; padding:0 6px; color:${border}`
        )
    }
}

export default console