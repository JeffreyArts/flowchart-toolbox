<template>
    <div class="cytoscape">
        <header class="title">
            <h1>Cytoscape</h1>
        </header>

        <hr>
        <section class="viewport">
            <div class="viewport-content" ratio="1x1" >
                <div id="cytoscape-canvas"> 

                </div>
            </div>
        </section>

        <aside class="sidebar">
            <div class="options">
                <div class="option-group" name="Info" >
                    <div class="option">
                        <p>
                            Leuke library, zou snel mee ontwikkelt kunnen worden. Maar is té opinionated (in een andere richting dan ik wil). Is wel onwijs 
                            populair en heeft een universitaire achtergrond dus heeft veel features. Denk dat de library veel gebruikt
                            kan worden voor de structuur van de flowchat lib die ik zelf aan het bouwen ben.

                            Zoals het veranderen van de input/output concept in mijn nodes class gewoon vervangen met alleen <a href="https://js.cytoscape.org/#collection/compound-nodes">parent/child relaties</a>.
                        </p>

                        <p>
                            De tekenmethode moet trouwens ook los getrokken worden uit de flowchart, met daarnaast een shape class.
                            Nodes hebben dan een shape type, en op basis van de shape kunnen er interacties en tekenmogelijkheden worden gerealiseerd.
                            Ik zal in de basis gebruik blijven maken van HTML elementen, maar de structuur moet zo gebouwd worden dat er ook een canvas of svg element gebruikt kan worden in de toekomst. 
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
import cytoscape from "cytoscape"

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
            cytoscape: undefined as undefined | cytoscape,
            graph: undefined as undefined | cytoscape.Graph,
            node1: undefined as undefined | cytoscape.NodeSingular,
            node2: undefined as undefined | cytoscape.NodeSingular,
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
            
            const jointJsCanvas = document.getElementById("cytoscape-canvas")
            if (!jointJsCanvas) {
                console.error("Could not find cytoscape-canvas element")
                return
            }
            
            this.cytoscape = markRaw(cytoscape({
                container: jointJsCanvas,
                elements: [
                    { data: { id: "a", label: "Node 1" }, classes: "node1", position: { x: 50, y: 50 }},
                    { data: { id: "b", label: "Node 2" }, classes: "node2", position: { x: 200, y: 200 }},
                    { data: { id: "ab", source: "a", target: "b" }}
                ],
                style: [
                    {
                        selector: ".node1",
                        style: {
                            "background-color": "#fff",
                            "border-width": 4,
                            "border-color": "#b2e0f9",
                            "label": "data(label)"
                        }
                    },
                    {
                        selector: ".node2",
                        style: {
                            "background-color": "#fff",
                            "border-width": 4,
                            "border-color": "#ffccff",
                            "label": "data(label)"
                        }
                    },
                    {
                        selector: "edge",
                        style: {
                            "width": 4,
                            "line-color": "#333"
                        }
                    },
                    {
                        selector: "core", // Disable the default grey circle when panning the canvas
                        style: {
                            "active-bg-color": "transparent",
                            "active-bg-opacity": 0,
                            "active-bg-size": 0,
                        }
                    },
                ],
                layout: {
                    name: "grid",
                    rows: 1
                }
            }))
        },


        //     this.node1 = new Joint.shapes.standard.Rectangle()
        //     this.node1.position(25, 25)
        //     this.node1.resize(128, 64)
        //     this.node1.attr("label", { text: "Node 1", fill: "#353535" })
        //     this.node1.addTo(this.graph)
        //     this.node1.attr("body", { stroke: "#b2e0f9", strokeWidth: 4 })


        //     this.node2 = new Joint.shapes.standard.Rectangle()
        //     this.node2.position(95, 225)
        //     this.node2.resize(128, 64)
        //     this.node2.attr("label", { text: "Node 2", fill: "#353535" })
        //     this.node2.addTo(this.graph)
        //     this.node2.attr("body", { stroke: "#ffccff", strokeWidth: 4, rx: 32, ry: 32 })
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


<style lang="css">
.cytoscape { 
}
#cytoscape-canvas {
    width: 100%;
    aspect-ratio: 1 / 1;
}
</style>