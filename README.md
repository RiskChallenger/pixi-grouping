# Pixi Grouping

This library provides an extended implementation of the Pixi Application and Containers that provide drag/drop ability together with grouping blocks.

## Features

- Drag blocks
- Drag blocks together to create groups
- Drag groups by their name
- Drag groups together to merge
- Separate blocks from groups
- Events

## Customization

To use this library, your blocks, whatever they may be, must extend the Block class from this library. You can customize the look of the blocks by overriding the `createBlockGraphic` method.

Groups are currently not customizable, please open an issue if you would like that specifying what you would like to customize.

## Events

This library adds some extra events to Blocks, Groups and the Application stage.

### Application stage events

This events can be accessed through `application.stage.on('<event>')`.

- `new-group`

### Block events

- `joined-group`
- `left-group`
- `no-drag-click` - when clicking on a block and not dragging it

### Group events

- `block-added`
- `block-removed`
- `name-changed`
- `disbandoned` - this event is emitted when the last two risks in a group are separated
- `no-drag-click` - when clicking on the name of a group and not dragging it

## Development

```
git clone git@github.com:RiskChallenger/pixijs-grouping.git &&
cd pixijs-grouping &&
npm install &&
npm run dev
```
