<template>
    <div class="canvas-zoom">
        <header class="title">
            <h1>Canvas zoom</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="canvas-panning"> 

                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Options" >
                    <div class="option">
                        <label for="options-text">Text</label>
                        <textarea id="options-text" v-model="options.text" @input="updateText()"></textarea>
                    </div>
                    <div class="option">
                        <label for="option-tool">Tool</label>

                        <div class="row">
                            <div v-for="(tool,k) in tools" :key="k" :value="tool">
                                <input type="radio" :id="`tool-${k}`" :value="tool" v-model="options.tool" @change="updateTool()">
                                <label :for="`tool-${k}`">
                                    {{ tool }}
                                </label>
                            </div>
                        </div>
                    </div>

                    <form class="option" @submit="resetOptions">
                        <label for="options-reset">Reset options</label>
                        <button class="button" id="options-reset">Reset</button>
                    </form>
                </div>


                <div class="option-group" name="Actions" >
                    <div class="option">
                        <label for="options-resetPan">Reset</label>
                        <div class="row">
                            <button class="button __isSmall" id="options-resetPan" @click="resetPan">pan</button>
                            <button class="button __isSmall" id="options-resetZoom" @click="resetZoom">zoom</button>
                            <button class="button __isSmall" id="options-resetBoth" @click="resetZoom($event); resetPan($event)">both</button>

                        </div>
                    </div>
                </div>
            </div>
        </aside>
    </div>
</template>


<script lang="ts">
import { defineComponent, markRaw } from "vue"
import _ from "lodash"
import gsap from "gsap"
import { Flowchart } from "./flowchart"
import { StartNode } from "./flowchart/start"

interface Options {
    text: string
    tool: string
}

export default defineComponent ({ 
    components: {},
    props: [],
    data() {
        return {
            options: {
                text: "Test",
                tool: "zoom",
            } as Partial<Options>,
            tools: ["pan", "zoom"],
            startNode: undefined as StartNode | undefined,
            flowchart: undefined as Flowchart | undefined,
            ignoreOptionsUpdate: true,
        }
    },
    watch: {
        "options": {
            handler(){
                if (this.ignoreOptionsUpdate) {
                    return
                }
                
                let newOptions = {} as any
                const localStorageOptions = localStorage.getItem("options")
                if (localStorageOptions) {
                    newOptions = _.cloneDeep(JSON.parse(localStorageOptions))
                }
                _.forOwn(this.options, (value, key) => {
                    if (_.isArray(value)) {
                        // If the value is an array, copy it directly
                        newOptions[key] = [...value]
                    } else if (_.isObject(value)) {
                        if (!_.isObject(newOptions[key])) {
                            newOptions[key] = {}
                        }
                        // Recursively copy the object properties
                        _.forOwn(value, (v, k) => {
                            newOptions[key][k] = v
                        })
                    } else {
                        newOptions[key] = value
                    }
                })
                localStorage.setItem("options", JSON.stringify(newOptions))
            },
            deep: true
        },
    },
    mounted() {
        if (this.$el && !this.flowchart) {
            setTimeout(() => {
                this.flowchart = markRaw(new Flowchart("#canvas-panning"))
                console.print("Flowchart instance:", this.flowchart)
                this.startNode = this.flowchart.add("start", this.options.text)
                
                this.flowchart.selectTool("pan")
                if (this.options.tool) {
                    this.flowchart.selectTool(this.options.tool)
                }
            })
        }

        this.loadOptions()
    },
    unmounted() {
        this.flowchart?.destroy()
    },
    methods: {
        updateText() {
            if (this.startNode) {
                this.startNode.text = this.options.text || ""
            }
        },
        updateTool() {
            if (this.flowchart) {
                this.flowchart.selectTool("pan")

                if (this.options.tool == "zoom") {
                    this.flowchart.selectTool(this.options.tool)
                } else {
                    this.flowchart.deselectTool("zoom")
                }
            }
        },
        resetPan(e:Event) {
            e.preventDefault()
            if (this.flowchart) {
                gsap.to(this.flowchart.pan, { x: 0, y: 0, duration: 0.5 })
            }
        },
        resetZoom(e:Event) {
            e.preventDefault()
            if (this.flowchart) {
                gsap.to(this.flowchart, { zoom: 1, duration: 0.5 })
            }
        },
        loadOptions() {
            this.ignoreOptionsUpdate = true
            const optionsString = localStorage.getItem("options")
            if (optionsString) {
                const localOptions = JSON.parse(optionsString)
                _.forOwn(this.options, (_value,key) => {
                    const typedKey = key as keyof Options
                    if (localOptions[typedKey]) {
                        this.options[typedKey] = localOptions[key]
                    }
                })
            }
            setTimeout(() => {
                this.ignoreOptionsUpdate = false
            })
        },
        resetOptions(e:Event) {
            e.preventDefault()
            this.options = {
                text: "Test",
                tool: "pan",
            }
        },
    }
})
</script>


<style lang="scss">

.canvas-zoom { 
    .flowchart {
        color: #333;
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;

        &.__toolPan {
            cursor: grab;
        
            &.__isPanning {
                cursor: grabbing;
            }
        }
    }

    .flowchart-chart {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        outline: 10px solid orange;
    }

    .flowchart-node {
        position: absolute;
        border: 4px solid transparent;
        box-sizing: border-box;
        text-align: center;
        min-width: 5em;

        // Make text unselectable
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */

        &.start-node {
            border: 4px solid #ffccff;
            padding: 20px;
            border-radius: 50px;
        }
    }
}
</style>