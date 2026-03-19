<template>
    <div class="joint-js">
        <header class="title">
            <h1>JointJS</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="joint-js-canvas"> 

                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Options" >
                    <div class="option">
                     <p>
                        Interesting library. Was very easy to setup this demo. But support for zooming and panning cost $3500. So this library ain't cutting it
                     </p>
                    </div>
                </div>
            </div>
        </aside>
    </div>
</template>


<script lang="ts">
//@ts-nocheck
import { defineComponent, markRaw } from "vue"
import _ from "lodash"
import Joint from "@joint/core"

interface Options {
    none: undefined
}

export default defineComponent ({ 
    components: {},
    props: [],
    data() {
        return {
            options: {
                none: undefined
            } as Partial<Options>,
            paper: undefined as undefined | Joint.dia.Paper,
            graph: undefined as undefined | Joint.dia.Graph,
            node1: undefined as undefined | Joint.dia.Element,
            node2: undefined as undefined | Joint.dia.Element,
            flowchart: undefined as undefined,
            selectedNode: undefined as undefined,
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
            this.setFlowchart()
        }

        this.loadOptions()
    },
    unmounted() {
        // this.flowchart?.destroy()
    },
    methods: {
        setFlowchart() {
            const namespace = Joint.shapes

            this.graph = new Joint.dia.Graph({}, { cellNamespace: namespace })

            const jointJsCanvas = document.getElementById("joint-js-canvas")
            if (!jointJsCanvas) {
                console.error("Could not find joint-js-canvas element")
                return
            }
            

            this.paper = new Joint.dia.Paper({
                el: jointJsCanvas,
                model: this.graph,
                width: jointJsCanvas.clientWidth,
                height: jointJsCanvas.clientWidth,
                background: { color: "#F5F5F5" },
                cellViewNamespace: namespace
            })

            this.node1 = new Joint.shapes.standard.Rectangle()
            this.node1.position(25, 25)
            this.node1.resize(128, 64)
            this.node1.attr("label", { text: "Node 1", fill: "#353535" })
            this.node1.addTo(this.graph)
            this.node1.attr("body", { stroke: "#b2e0f9", strokeWidth: 4 })


            this.node2 = new Joint.shapes.standard.Rectangle()
            this.node2.position(95, 225)
            this.node2.resize(128, 64)
            this.node2.attr("label", { text: "Node 2", fill: "#353535" })
            this.node2.addTo(this.graph)
            this.node2.attr("body", { stroke: "#ffccff", strokeWidth: 4, rx: 32, ry: 32 })
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
            }
        },
    }
})
</script>


<style lang="scss">
.joint-js { 
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