import { Block } from "./classes/Block";
import { GroupingApplication } from "./classes/GroupingApplication";
import "./style.css";

const app = new GroupingApplication({
  background: "#333",
  resizeTo: window,
  antialias: true,
});

document.body.appendChild(app.view);
const blocks = [
  new Block(200, 200, 0xff0000), //red
  new Block(300, 250, 0x00ff00), //green
  new Block(750, 725, 0x0000ff), //blue
  new Block(800, 800, 0xffff00), //yellow
  new Block(800, 300, 0xff00ff), //pink
];
app.addBlocks(blocks);

document.querySelector("#button")?.addEventListener("click", () => {
  console.log(blocks.map((b) => app.stage.toGlobal(b.getBounds())));
});
