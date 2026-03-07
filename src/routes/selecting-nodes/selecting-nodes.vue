<template>
    <div class="selecting-nodes">
        <header class="title">
            <h1>Selecting nodes</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="selecting-nodes-canvas"> 

                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Options" >
                    <div class="option">
                        <label for="option-tool">Selected node</label>
                        <span v-if="selectedNode">
                            {{ selectedNode.id }}
                        </span>
                        <span v-if="!selectedNode" style="font-style: italic; color: #666; font-size: .8em;">
                            No node selected
                        </span>
                    </div>

                </div>


                <div class="option-group" name="Actions" >
                    <div class="option">
                        <label for="options-resetPan">Reset zoom/pan</label>
                        <div class="row">
                            <button class="button" id="options-resetBoth" @click="resetZoom($event); resetPan($event)">Reset</button>
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
import { StartNode } from "./flowchart/nodes/start"
import { ProcessNode } from "./flowchart/nodes/process"

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
            node1: undefined as StartNode | undefined,
            node2: undefined as ProcessNode | undefined,
            flowchart: undefined as Flowchart | undefined,
            selectedNode: undefined as StartNode | undefined,
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
                this.flowchart = markRaw(new Flowchart("#selecting-nodes-canvas"))
                this.node1 = this.flowchart.add("start", "Node 1")
                if (this.node1) {
                    this.node1.x = "20%"
                }
                this.node2 = this.flowchart.add("process", "Node 2")
                if (this.node2) {
                    this.node2.x = "80%"
                }
                
                console.print("Flowchart instance:", this.flowchart)
                this.flowchart.selectTool("pan")
                this.flowchart.selectTool("zoom")
                
            })
        }

        this.loadOptions()
    },
    unmounted() {
        this.flowchart?.destroy()
    },
    methods: {
        updateText() {
            if (this.node1) {
                this.node1.text = this.options.text || ""
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
                _.forOwn(this.options, (value,key) => {
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
.selecting-nodes { 
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

        &.process-node {
            border: 4px solid #b2e0f9;
            padding: 20px;
        }
    }
}
</style>