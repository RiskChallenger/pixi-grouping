# Pixi Grouping

This library provides an extended implementation of the Pixi Application and Containers that provide drag/drop ability together with grouping blocks.

## Features

- Drag blocks
- Drag blocks together to create groups
- Drag groups by their name
- Drag groups together to merge
- Separate blocks from groups
- Overlay blocks, to combine/fuse for example
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

- `join-group`
- `leave-group`
- `no-drag-click` - when clicking on a block and not dragging it
- `overlay` - when overlaying another block, contains the other block in the event
- `drag`

### Group events

- `block-add`
- `block-remove`
- `name-change`
- `disbandon` - this event is emitted when the last two risks in a group are separated
- `no-drag-click` - when clicking on the name of a group and not dragging it

## Development

```
git clone git@github.com:RiskChallenger/pixi-grouping.git &&
cd pixi-grouping &&
npm install &&
npm run dev
```
