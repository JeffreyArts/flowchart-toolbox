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
                            <strong>ID:</strong>
                            {{ selectedNode.id }} <br><br>
                            <strong>Type:</strong>
                            {{ selectedNode.type }}<br>
                            <select name="changeNode" id="" v-model="selectedNode.type" @change="changeSelectedNode">
                                <option value="start">Start</option>
                                <option value="end">End</option>
                                <option value="process">Process</option>
                                <option value="decision">Decision</option>
                            </select>
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
import { EndNode } from "./flowchart/nodes/end"
import { ProcessNode } from "./flowchart/nodes/process"
import SelectTool from "./flowchart/chart-tools/select"

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
            selectedNode: undefined as StartNode | ProcessNode | EndNode | undefined,
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
                this.node1 = this.flowchart.addNode("start", "Node 1")
                if (this.node1) {
                    this.node1.x = "20%"
                }
                this.node2 = this.flowchart.addNode("process", "Node 2")
                if (this.node2) {
                    this.node2.x = "80%"
                }

                this.setMouseEvents(this.node1)
                this.setMouseEvents(this.node2)
                
                
                this.flowchart.selectTool("pan")
                this.flowchart.selectTool("zoom")
                const selectTool = this.flowchart.selectTool("select")
                if (selectTool && selectTool instanceof SelectTool) {
                    selectTool.onClick = (e: MouseEvent) => {
                        this.selectedNode = undefined
                        this.flowchart?.nodes.forEach(node => {
                            if (!node.el) return
                            node.el.classList.remove("__isSelected")    
                            if (node.isHover) {
                                this.selectedNode = node    
                                node.el.classList.add("__isSelected")    
                            }
                        })
                    }
                }
            })
        }

        this.loadOptions()
    },
    unmounted() {
        this.flowchart?.destroy()
    },
    methods: {
        changeSelectedNode() {
            if (!this.selectedNode) return
            if (!this.flowchart) return


            let target = {
                node: this.node1,
                text: "Node 1",
                x: "20%",
                newType: ""
            }
            
            if (this.node2?.id == this.selectedNode.id) {
                target = {
                    node: this.node2,
                    text: "Node 2",
                    x: "80%",
                    newType: ""
                }
            }
            
            this.flowchart.removeNode(this.selectedNode.id)

            if (this.selectedNode.type == "start") {
                target.newType = "start"
            } else if (this.selectedNode.type == "process") {
                target.newType = "process"
            } else if (this.selectedNode.type == "end") {
                target.newType = "end"
            } else if (this.selectedNode.type == "decision") {
                target.newType = "decision"
            }

            if (target.text == "Node 1") {
                this.node1 = this.flowchart.addNode(target.newType, target.text)
                this.selectedNode = this.node1
            } else if (target.text == "Node 2") {
                this.node2 = this.flowchart.addNode(target.newType, target.text)
                this.selectedNode = this.node2
            }

            if (this.selectedNode) {
                this.selectedNode.x = target.x
                this.setMouseEvents(this.selectedNode)
            }

        },
        setMouseEvents(node: StartNode | ProcessNode | EndNode) {
            node.onMouseEnter = () => {
                const el = node.el
                if (el) {
                    // el.style.outline = "4px solid red"  
                }
            }    
            node.onMouseLeave = () => {
                const el = node.el
                if (el) {
                    // el.style.outline = ""  
                }
            }    
        },
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
        transition-duration: .8s;
        transition-property: scale, box-shadow;
        transition-timing-function: linear(0, 0.002 0.5%, 0.008 1.1%, 0.019 1.7%, 0.034 2.3%, 0.052 2.9%, 0.073 3.5%, 0.102 4.2%, 0.134 4.9%, 0.191 6%, 0.264 7.3%, 0.556 12.1%, 0.683 14.3%, 0.742 15.4%, 0.797 16.5%, 0.848 17.6%, 0.89 18.6%, 0.932 19.7%, 0.967 20.7%, 0.997 21.7%, 1.027 22.8%, 1.052 23.9%, 1.073 25%, 1.09 26.1%, 1.104 27.3%, 1.117 28.9%, 1.123 30.6%, 1.124 32.4%, 1.119 34.3%, 1.112 35.9%, 1.101 37.7%, 1.043 45.5%, 1.018 49.5%, 1.007 51.7%, 0.998 54%, 0.992 56.3%, 0.988 58.6%, 0.985 61.7%, 0.985 65.2%, 1 84.5%, 1.002 91.4%, 1);

        // Make text unselectable
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */

        &.start-node {
            border: 4px solid #ffccff;
            padding: 20px;
            border-radius: 50px;
            &.__isSelected {
                scale: 1.2;
                box-shadow: 0 3px 8px rgba(0, 0, 0, .1);
            }
        }
        
        &.end-node {
            border: 4px solid #444;
            padding: 20px;
            border-radius: 50px;
            &.__isSelected {
                scale: 1.2;
                box-shadow: 0 3px 8px rgba(0, 0, 0, .1);
            }
        }

        &.process-node {
            border: 4px solid #b2e0f9;
            padding: 20px;
            &.__isSelected {
                scale: 1.2;
                box-shadow: 0 3px 8px rgba(0, 0, 0, .1);
            }
        }
        &.decision-node {
            padding: 20px;
            
            &:before {
                content: "";
                transform: translate(-50%, -50%) rotate(45deg);
                border: 4px solid #fffa88;
                display: flex;
                align-items: center;
                justify-content: center;
                position: absolute;
                width: calc(100% - 20px);
                aspect-ratio: 1;
                top: 50%;
                left: 50%;
            }

            &.__isSelected {
                scale: 1.2;
                &:before {
                    box-shadow: 0 3px 8px rgba(0, 0, 0, .1);
                }
            }
        }
    }
}
</style>