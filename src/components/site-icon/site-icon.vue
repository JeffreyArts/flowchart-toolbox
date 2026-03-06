<template>
    <svg class="site-icon" version="1.1" :viewBox="`0 0 ${svgWidth} ${svgHeight}`" xmlns="http://www.w3.org/2000/svg">
        <g v-if="displayGrid.length > 0">
            <rect class="site-icon-cell" v-for="(cell,x) in displayGrid" :key="x"
                :x="1 + cell.x * 10" 
                :y="1+ cell.y * 10" 
                width="8" 
                height="8"
                :style="`fill:${cell.color};`"
                />
        </g>
    </svg>
</template>

<script lang="ts">
import {defineComponent, PropType} from "vue"
import _ from "lodash"
import gsap from "gsap"

// Small
import smallCheckboxCheck from "./small/checkbox-check.json"
import smallCheckboxCross from "./small/checkbox-cross.json"
import smallCheckboxEmpty from "./small/checkbox-empty.json"
import smallChristmasTree from "./small/christmas-tree.json"
import smallCircle from "./small/circle.json"
import smallCross from "./small/cross.json"
import smallExpand from "./small/expand.json"
import smallExpandWithBorder from "./small/expand-w-border.json"
import smallEye from "./small/eye.json"
import smallHeart from "./small/heart.json"
import smallHeartOutline from "./small/heart-outline.json"
import smallOff from "./small/off.json"
import smallOn from "./small/on.json"
import smallSmileyFace from "./small/smiley-face.json"
import smallTerminal from "./small/terminal.json"

// Medium
import mediumCircle from "./medium/circle.json"
import mediumCross from "./medium/cross.json"
import mediumEmpty from "./medium/empty.json"
import mediumHamburger from "./medium/hamburger.json"
import mediumLeave from "./medium/leave.json"
import mediumSpeechBubble from "./medium/speech-bubble.json"
import mediumWrench from "./medium/wrench.json"

// Large
import largeCross from "./large/cross.json"
import largeEmpty from "./large/empty.json"

/* 
This icon component uses a two-dimensional grid, with cells of 8x8 pixels - with a gap of 1px around each cell

You'll use it by specifing a size (small, medium or large), in combination with the name of the icon you'd like to display
You can also specify entire custom icons by specifying a two-dimensional array with truthy/falsey values

small = 9x9
medium = 13x13
large = 21x21

*/

interface CustomGridPoint {
    x: number;
    y: number;
    value: any;
}
interface transitEffect {
    duration?: number;
    ease?: string;
    delay?: number,
    effect?: "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top" | "shuffle"
}

export default defineComponent ({
    name: "SiteMenu", 
    props: {
        size: {
            type: String,
            required: false
        },
        
        activeColor: {
            type: String,
            required: false
        },
        inactiveColor: {
            type: String,
            required: false
        },
        name: {
            type: String,
            required: false
        },
        custom: {
            type: Array as PropType<CustomGridPoint[]>,
            required: false
        },
        transitEffect: {
            type: Object as PropType<transitEffect>,
            required: false
        }
    },
    data() {
        return {
            originalIcon: [] as Array<Array<any>>,
            icon: [] as Array<Array<any>>,
            originalGrid: [] as Array<{x:number, y:number, color: string}>,
            displayGrid: [] as Array<{x:number, y:number, color: string}>,
            transitions: [] as Array<gsap.core.Tween>,
        }
    },
    computed: {
        svgWidth() {
            if (this.icon.length <= 0) {
                return 0
            }
            return this.icon.length * 10
        },
        svgHeight() {
            if (this.icon.length <= 0) {
                return 0
            }
            return this.icon[0].length * 10
        },
    },
    watch:{
        "size":{
            handler: function (val) {
                this.updateIcon()
            },
            immediate: true
        },
        "name":{
            handler: function (val) {
                this.updateIcon()
            },
            immediate: true
        },
        "custom":{
            handler: function (val) {
                if (this.custom && this.custom.length > 0) {
                    this.originalGrid = []
                    const activeColor = this.activeColor ? this.activeColor : "#333"
                    const inactiveColor = this.inactiveColor ? this.inactiveColor : "#efefef"
                    this.custom.forEach((val) => {
                        const data = {
                            x: val.x,
                            y: val.y,
                            color: val.value ? activeColor : inactiveColor
                        }
                        this.originalGrid.push(data)
                    })
                    this.transit({duration: 0, delay: 0})
                }
            },
            deep: true,
            immediate: true
        },
    },
    mounted() {
        //
    },
    unmounted() {
        //
    },
    methods: {
        updateIcon(custom?: boolean) {
            if (this.size === "small") {
                switch (this.name) {
                case "eye": 
                case "eyes":        this.icon = smallEye; break
                case "cross":       this.icon = smallCross; break
                case "terminal":    this.icon = smallTerminal; break
                case "smiley":
                case "smiley-face": 
                case "smileyFace":      this.icon = smallSmileyFace; break
                case "expand":          this.icon = smallExpand; break
                case "expand-outline":  
                case "expand-border":   this.icon = smallExpandWithBorder; break
                case "circle":          this.icon = smallCircle; break
                case "christmas":       
                case "christmas-tree":  this.icon = smallChristmasTree; break
                case "checkbox":  
                case "checkbox-empty":  this.icon = smallCheckboxEmpty; break
                case "checkbox-checked":this.icon = smallCheckboxCheck; break
                case "checkbox-cross":  this.icon = smallCheckboxCross; break
                case "heart":           this.icon = smallHeart; break
                case "heart-outline":   this.icon = smallHeartOutline; break
                case "on":              this.icon = smallOn; break
                case "off":             this.icon = smallOff; break
        
                default: this.icon = []; break
                }
            } else if (this.size === "medium") {
                switch (this.name) {
                case "leave": 
                case "exit":            this.icon = mediumLeave; break
                case "empty":           this.icon = mediumEmpty; break
                case "hamburger":       this.icon = mediumHamburger; break
                case "speech-bubble":   this.icon = mediumSpeechBubble; break
                case "settings":        
                case "wrench":          this.icon = mediumWrench; break
                case "close":           
                case "cross":           this.icon = mediumCross; break
                case "circle":          this.icon = mediumCircle; break
                
                default: this.icon = []; break
                }
            } else if (this.size === "large") {
                switch (this.name) {
                case "cross":           this.icon = largeCross; break
                case "empty":           this.icon = largeEmpty; break
        
                default: this.icon = []; break
                }
            }
                
            
            this.originalGrid = []
            const activeColor = this.activeColor ? this.activeColor : "#333"
            const inactiveColor = this.inactiveColor ? this.inactiveColor : "#efefef"
            
            if (this.icon.length <= 0 && this.custom) {
                this.customGridToIcon()
            }

            this.icon.forEach((row,y) => {
                row.forEach((val,x) => {
                    const data = {
                        x,
                        y,
                        color: val ? activeColor : inactiveColor
                    }
                    this.originalGrid.push(data)
                })
            })


            if (this.displayGrid.length !== this.originalGrid.length) {
                this.displayGrid = []
                this.originalGrid.forEach((grid, index) => {
                    this.displayGrid.push({x:grid.x,y:grid.y,color: grid.color})
                })
            }
                    
            this.transit(this.transitEffect)
        },
        customGridToIcon() {
            if (!this.custom) {
                console.warn("No custom grid to be transform to icon")
                return []
            }

            const sortedArray = _.sortBy(this.custom, ["y", "x"]);

            sortedArray.forEach(point => {
                if (!this.icon[point.y]) {
                    this.icon.push([])
                }
                this.icon[point.y].push(!!point.value)
            })
        },
        transit(opts = {
            duration: .4,
            delay: 0,
            ease: "",
            effect: "" as "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top" | "shuffle"
        } as transitEffect) {

            if (this.transitions.length > 0) {
                this.transitions.forEach(t => {t.kill()})
                this.transitions = []
            }

            let effect = _.isString(opts.effect) ? opts.effect : "fade-in"
            let ease = _.isString(opts.ease) ? opts.ease : "linear"
            let duration = _.isNumber(opts.duration) ? opts.duration : .4
            let delay = _.isNumber(opts.delay) ? opts.delay : 0

            let collection = this.originalGrid
            if (effect == "shuffle") {
                collection = _.shuffle(this.originalGrid)
            } else if (effect == "top-to-bottom") {
                collection = this.originalGrid
            } else if (effect == "bottom-to-top") {
                collection = _.reverse(this.originalGrid)
            } else if (effect == "left-to-right") {
                collection = _.sortBy(this.originalGrid, "x")
            } else if (effect == "right-to-left") {
                collection = _.reverse(_.sortBy(this.originalGrid, "x"))
            } 

            collection.forEach((grid, index) => {
                const cell = _.find(this.displayGrid, {x:grid.x, y:grid.y})
                if (cell) {
                    this.transitions.push(gsap.to(cell, {
                        color: grid.color,
                        ease: ease,
                        delay: delay * index,
                        duration
                    }))
                }
            })
        
                
        }
    }
})

</script>

<style lang="scss">
@forward '@/assets/scss/variables.scss';


</style>