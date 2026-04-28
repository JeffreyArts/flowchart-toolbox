# Joffa
Jeffrey's Opinionated Flowchart Framework

### Index:
1. Features overview
2. General usage
3. Flowchart (options)
4. Node (options)
5. Edge (options)
6. Tools

# 1. Features present at step 22: code-cleanup-1
* Flowchart
* Nodes
* Edges
* Tools
* Shapes
* TextHelper shape

## Nodes
Nodes are the points that can be connected with each other to form a flow. Each node can have multiple children and parents. It has an x/y position and it displays a text within a shape.

## Edges
Edges are the lines that are being drawn between the nodes. It has 1 direction, flowing from the parent towards the child. It can be drawn in different styles, hidden and shown with or without an arrow head.

## Tools
Tools are specialised sets of actions to interact with the flowchart. The current tools are for adding new nodes, moving existing nodes around, selecting 1 or more nodes and zooming/panning across the canvas.

## Shapes
Shapes are the (mathematical) shapes that are being used with the nodes in conjuction with the textHelper shape. Currently it supports rectangular, diamond and pill shapes.


# 2. General usage
The base flowchart class does not have any nodes, edges or tools available for you to be used. You'll have to register them yourself after initialisation

```ts
import ZoomTool from "./chart-tools/zoom"
const Chart = new Flowchart(<target>, <options>)
Chart.register("tool", "zoom", ZoomTool)
```
* \<target> is either a _string_ or a _domElement_
* \<options> is an object with all the possible option attributes for the flowchart. 

---

Best practice is to extend the original Flowchart class with a custom one and use this one. This allows you to have control over which nodes, edges and tools should be included in your implementation and which default configuration settings they should adhere to.

``` ts
import Flowchart, { type FlowchartOptions } from "."
import ZoomTool from "./chart-tools/zoom"
import ProcessNode from "./nodes/types/process"
import drawStraightEdge from "./edges/draw/straight"

export default class Joffa extends Flowchart {
    constructor(container: HTMLElement, options?: FlowchartOptions) {
        super(container, options)
        
        // Default tools
        this.register("tool","zoom", ZoomTool, { /* ...zoomTool options */})
        
        // Default Nodes
        this.register("node", "process", ProcessNode, { /* ...node options */})

        // Default edges
        this.register("edge", "straight", drawStraightEdge)
    }
}

// It doesn't really matter if you pass the options like described below or if you just do it within the Joffa class. It all depends on your desired implementation goals
new Joffa("#chart-container", { nodes: { segments: 4}})
```

# 3. Flowchart
The flowchart options object is just a wrapper for setting default values for the edges & nodes.

### FlowchartOptions
#### edges: \<FlowchartEdgeOptions>
Object with default values for all edges. See Edge.FlowchartEdgeOptions for details

#### nodes: \<FlowchartNodeOptions>
Object with default values for all nodes. See Node.FlowchartNodeOptions for details


# 4. Node

## FlowchartNodeOptions

``` ts
{
    parent?: FlowchartNode
    flowchart?: Flowchart
    x?: number | string
    y?: number | string
    event?: FlowchartNodeEvent
    events?: FlowchartNodeEvent[]
    class?: string | string[]
    shape?: {
        style?: Partial<CSSStyleDeclaration>
        class?: string | string[]
    }
    text?: {
        style?: Partial<CSSStyleDeclaration>
        class?: string | string[]
        value?: string
    } | string
    options?: Partial<FlowchartNodeOptions>
}
```
#### parent: _\<FlowchartNode>_
, this will connect the node with the parentNode and it will also inherit the flowchart object from the parentNode so it doesn't have to be set manually.

#### flowchart:  _\<Flowchart>_
Required if parentNode is not passed along via the parent option.

#### x: _number_ | _string_
Horizontal position of the node in percentages or pixels

#### y: _number_ | _string_
Vertical position of the node in percentages or pixels

#### event: _\<FlowchartNodeEvent>_
An object that consists of two parameters:
``` ts
{ 
    name: FlowchartNodeEventType,
    handler: (node: FlowchartNode) => void 
}
```
This way you can pass along methods to be exucuted when an event is triggered. See also: FlowchartNodeEventTypes.

#### events: _[\<FlowchartNodeEvent>]_
Same as event, but with an array of FlowchartNodeEventType's rather then a single object.

#### class: _string_ | _string[]_
Classnames provided with the class attribute will be passed along to be applied on the node group (node.svgGroup)

#### shape: { style?: Partial\<CSSStyleDeclaration>, class?: string | string[]}
An object with two parameters:

* __style:__ An object with CSS style properties to be applied on the shape SVG element
* __class:__ One or more strings be applied as class values for the shape SVG element

#### text: _Object_ | _string_
An object with three parameters or just a text string that 

* __style__ An object with CSS style properties to be applied on the shape SVG element
* __class__ One or more strings be applied as class values for the shape SVG element
* __value__ The text value that would normally be used in the same way when a string is passed instead of an object.

### OPTIONS
The nodes have an interactive options object that can be changed on-the-fly, but also configured in advance.

#### options.maxWidth: _number_ | _string_
A value to determine the maximum width of the text-container and therefor the maximum width of the node(-shape)

#### options.segments: _number_
The edges can be positioned with fixed angles. Segments determines the size of the angle that the connection points will be distanced from each other. Using a value of 4 would imply that all connection points are 90 degrees of each other.

#### options.offsetPadding: _number_
The distance in pixels that the edge will be moved away from the edge of the shape

## FlowchartNodeEventTypes

#### positionChange
Fired whenever the x and or y position of a node have changed

#### dimensionChange
Fired whenever the width and or height position of a node(-shape) have changed

#### segmentsChange
Fired whenever the amount of segments of a node have changed

#### beforeTextChange
Triggered when the node.text value has been changed, but the actual dom has not yet been updated

#### afterTextChange
Triggered after the node.text value has changed and the actual dom has  been updated

#### mouseOver
Bound a method whenever you hover over a node. Usage of this method is not preferable. Creation of a tool is preferred. This event is mostly for internal operations.

#### mouseEntered
Bound a method whenever the mouse enters a node. Usage of this method is not preferable. Creation of a tool is preferred. This event is mostly for internal operations.

#### mouseLeft
Bound a method whenever the mouse leaves a node. Usage of this method is not preferable. Creation of a tool is preferred. This event is mostly for internal operations.

#### show
Via this event you can replace the default state switch via a custom one. For instance to create an fade-in animation.
``` ts
{ name: "show", handler: (node) => { gsap.to(node.svgGroup.style, { opacity: 1 })} }
```

#### hide
Via this event you can replace the default state switch via a custom one. For instance to create an fade-out animation.
``` ts
{ name: "hide", handler: (node) => { gsap.to(node.svgGroup.style, { opacity: 0 })} }
```


# 5. Edge

## FlowchartEdgeOptions
```ts
{
    showArrow: boolean
    isVisible: boolean
    type: string
    midpoint: number
    curvatureStrength: number 
}
```


#### showArrow: _boolean_
__Default value:__ true, 
Show or hide the arrowhead of the edge

#### isVisible: _boolean_
__Default value:__ true,
Show or hide the edge

#### type: _string_
A string value that equals one of the registered node types. The current available (default) values are:

* straight
* elbow
* zigzag
* diagonal
* double-diagonal


#### midpoint: _number_
__Default value:__ 0.5
All (default) edge types will have a possible bow in the line. This value determines wether it is at the start (0), the end (1) or somewhere in between. By default the bend is at the center ar 0.5.

#### curvatureStrength: _number_
__Default value:__ 0.5
All (default) edge types will have a possible bow in the line. This value determines the sharpness of the curvature. A value of 1 can be interpreted as the maximum curvature and makes the line smooth. 0 is the minimum and will make the bend very sharp

# 6. Tools
There are currently 5 tools available to interact with the flowchart.

1. Zoom
2. Pan
3. Select node
4. Move node
5. Add node

## Zoom
The zoom tool allows you to zoom in/out on the flowchart. How you can do this, depends on the options that you'll provide;
```ts
{
    fitPadding: number
    pinchZooming: boolean
    zHotkeyZooming: boolean
    cmdZooming: boolean
    cmdFit: boolean
    cmdReset: boolean
    scrollZooming: boolean
}
```

### Zoom Options
#### fitPadding: _number_
__Default value:__ 16,
When you trigger the zoom.fit() method, you can give some extra padding around the fit. Using 0 will give you no padding, 16 pixels is the default.

#### pinchZooming: _boolean_
__Default value:__ true,
When setting this to true, you will be able to zoom in/out via a pinching interaction (moving two fingers towards or apart from each other on a touch device)

#### zHotkeyZooming: _boolean_
__Default value:__ true,
When setting this to true, you will be able to zoom in by holding the `Z` key down and click on the chart. Holding `Z` + `alt` or `Z`+`option` will make you zoom out on click.

#### cmdZooming: _boolean_
__Default value:__ true,
When setting this to true, you will be able to zoom in with the hotkey `cmd` + `+` / `ctrl` + `+` or zoom out with the hotkey `cmd` + `-` / `ctrl` + `-`.

#### cmdFit: _boolean_
__Default value:__ true,
When setting this to true, you will be able to trigger the zoom.fit method by using the hotkey `cmd`+`0` or `control`+`0`.

#### cmdReset: _boolean_
__Default value:__ true,
When setting this to true, you will reset the zoom level to its default state (1) when using the hotkey `cmd`+`1` or `control`+`1`.

#### scrollZooming: _boolean_
__Default value:__ true,
When setting this to true, you will be able to zoom by scrolling when you hold down the `cmd` or `control` button.

### Zoom Methods

#### fit(Array\<nodes>?)
This method allows you to adjust the viewport so that all nodes provided within the argument will fit inside the view. If no object is being provided, it will fit all the nodes in flowchart.nodes

#### zoomAtCenter(factor)
This method allows you to zoom in or out using the center of the viewport as the origin point. The factor value should be a number around 1. Below 1, and the method will zoom out, a value above will make the view zoom in. For instance, using a value of 1.5 will enlarge the objects with the viewport with 50% of their original size.

#### zoomAt(x,y,factor)
This method is similar as zoomAtCenter, but here you'll have to define the origin point by passing along the x & y values as pixels.

#### resetZoom()
Will set the flowchart.zoom value to 1. And updates the pan to its base value.

#### zoomIn(x,y, factor)
Wrapper for zoomAt method. 

#### zoomOut(x,y, factor)
Wrapper for zoomAt method. But now you'll have to use a positive number instead of a negative one.

## Pan
The pan tool allows you to navigate around the x & y axes of the flowchart canvas. Via the options you can have even more control in how you want the user to interact with more control.
```ts
{
    spaceBarPanning: boolean,
    middleMousePanning: boolean,
    scrollPanning: boolean,
}
```

### Pan Options
#### spaceBarPanning: _boolean_
__Default value:__ true,
This will allow you to pan by holding space bar and drag the viewport via mouse movement when you hold down the left mouse button

#### middleMousePanning: _boolean_
__Default value:__ true,
This will allow you drag the viewport via mouse movement when you hold down the middle mouse button

#### scrollPanning: _boolean_
__Default value:__ true,
Allows you to pan via horizontal & vertical scroll. This should also work for two finger scroll on touch devices, this is not tested however.


## Select node
Mandatory tool that will update the node.state.selected value.

```ts
{
    mouseClick: boolean,
    multipleClick: boolean, 
    selectBox: boolean,
}
```

### Select node Options
#### mouseClick: _boolean_
__Default value:__ true,
This will allow you to change the select state of a node by clicking on it.

#### multipleClick: _boolean_
__Default value:__ true,
This will allow you to select multiple nodes by holding down the `cmd` or `ctrl` button when you click on nodes.

#### selectBox: _boolean_
__Default value:__ true,
When pressing on the canvas, you can hold down the left mouse button and select multiple nodes by dragging a selection box around the screen. It is currently not possible to modify the styling of the selection box.

## Move node
Adding this tool to your flowchart will allow users to move around nodes by selecting them and move the mouse around while holding down the mouse button.

## Add node
Adding this tool to your flowchart will allow users add nodes via a plus icon that will appear when the mouse of the user nears a node. Clicking on it will create a new node as a child of selected parent node.

```ts
{
    buttonDiameter: number
    segments: number
    defaultNodeType: string
    defaultDistance: number
    autoFit: boolean
    smartNodes: {
        start: string
        normal: string
        decision: string
        end: string
    }
}
```

### Add node Options
#### buttonDiameter: _number_
__Default value:__ 25,
This will determine the size of the button in pixels at the normalised zoom level (1).

#### segments: _number_
__Default value:__ 8,
Just like the starting point of the edges, you can also determine the offset between button positions via the segments option.

#### defaultNodeType: _string_
__Default value:__ "end",
The name of the default nodeType. This is the value that will be used when smartNodes is not set (properly).

#### defaultDistance: _number_
__Default value:__ 100,
The distance that the new node will be apart from the parent node when it is being added.

#### autoFit: _boolean_
__Default value:__ true,
This will use the zoom tool to fit the viewport so that the newly added node will fit in the view when it is added.

#### smartNodes: _object_ | _undefined_
__Default value:__ _undefined_,
You can pass along a smartNodes object where you can specify which nodeTypes should be used when new ones are being added.
```
{
    start: "start",
    normal: "process",
    decision: "decision",
    end: "end"
}
```
* __start__ is the nodeType that is being used for nodes that are being added without a parent (currently not yet implemented).
* __normal__ is the nodeType that is being used for nodes that have a single parent and a single child
* __decision__ is the nodeType that is being used for nodes that have a single parent but multiple children
* __end__ is the nodeType that is being used for nodes that have a single parent and no children




# Helpful links for development
## Ascii code generator:
__ANSI+Compact__
https://patorjk.com/software/taag/#p=display&f=ANSI+Compact&t=Test&x=none&v=4&h=4&w=80&we=false
