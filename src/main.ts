import { Block } from "./classes/Block";
import { GroupingApplication } from "./classes/GroupingApplication";
import "./style.css";

const app = new GroupingApplication({
  background: "#333",
  resizeTo: window,
  antialias: true,
});

document.body.appendChild(app.view);
const block1 = new Block(200, 200, 0xff0000); //red
const block2 = new Block(300, 250, 0x00ff00); //green
const block3 = new Block(750, 725, 0x0000ff); //blue
const block4 = new Block(800, 800, 0xffff00); //yellow
const block5 = new Block(800, 300, 0xff00ff); //pink
app.addBlocks([block1, block2, block3, block4, block5]);
