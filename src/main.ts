import { FederatedPointerEvent, Point } from "pixi.js";
import { Block } from "./classes/Block";
import { GroupingApplication } from "./classes/GroupingApplication";
import "./style.css";

const app = new GroupingApplication({
  background: "#333",
  resizeTo: window,
  antialias: true,
});

document.body.appendChild(app.view);
const block1 = new Block(300, 300, 0xff0000); //red
const block2 = new Block(400, 380, 0x00ff00); //green
const block3 = new Block(750, 725, 0x0000ff); //blue
const block4 = new Block(1800, 800, 0xffff00); //yellow
app.addBlocks([block1, block2, block3, block4]);

app.stage.on("rightdown", addBlock);

for (let i = 0; i < 0; i++) {
  const newBlock = randomBlock();
  app.addBlock(newBlock);
}

function randomBlock(): Block {
  return new Block(
    Math.max(100, Math.random() * (app.screen.width - 100)),
    Math.max(110, Math.random() * (app.screen.height - 50)),
    Math.random() * 0xffffff
  );
}

function addBlock(e: FederatedPointerEvent): void {
  const block = randomBlock();
  block.position = new Point(e.global.x, e.global.y);
  app.addBlock(block);
}
