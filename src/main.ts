import { FederatedPointerEvent, Point } from "pixi.js";
import "./style.css";

import { Block, GroupingApplication } from "../lib/main";

const app = new GroupingApplication({
  antialias: true,
  view: document.querySelector("canvas")!,
  groupNameStyle: { fill: 0x000 },
  borderColor: 0x000,
  shadowColor: 0x000,
  backgroundColor: 0xeeeeee,
});

const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    app.resizeCanvas(entry.contentRect.width, entry.contentRect.height);
  }
});

resizeObserver.observe(document.querySelector(".canvas-container")!);

document.querySelector(".canvas-container")?.appendChild(app.view);
const blocks = [
  new Block(200, 200, 0xff0000), //red
  new Block(300, 250, 0x00ff00), //green
  new Block(750, 725, 0x0000ff), //blue
  new Block(800, 800, 0xffff00), //yellow
  new Block(800, 300, 0xff00ff), //pink
];
app.addBlocks(blocks);

app.stage.on("viewport-rightclick", (e: FederatedPointerEvent) => {
  const block = app.randomBlock();
  block.position = e.global;
  app.addBlock(block);
});

document.querySelector("#button")?.addEventListener("click", () => {
  // app.groups[0].updateName("Dit is mijn nieuwe naam en hij is best lang");
  // app.addBlock(new Block(700, 700, 0x00ffff));
  console.log(app.getLocations());

  blocks[4].moveTo(new Point(0, 0), 1000);
});

document.querySelector("#home")?.addEventListener("click", () => {
  console.log(app.getLocations());
  app.panToHome();
  console.log(app.getLocations());
});

document.querySelector("#lightdark")?.addEventListener("click", () => {
  app.updateStyles({
    groupNameStyle: { fill: 0xffffff },
    borderColor: 0xffffff,
    shadowColor: 0xffffff,
    backgroundColor: 0x333333,
  });
});

let clicky = false;

document.querySelector("body")?.addEventListener("mousedown", () => {
  clicky = true;
});
document.querySelector("body")?.addEventListener("mouseup", () => {
  clicky = false;
});
document.querySelector("canvas")?.addEventListener("mouseenter", (e) => {
  if (clicky) {
    const newRisk = new Block(e.offsetX, e.offsetY, 0xffaa00);
    app.addBlock(newRisk);
    newRisk.pointerdown(new Point(e.offsetX, e.offsetY));
  }
});
