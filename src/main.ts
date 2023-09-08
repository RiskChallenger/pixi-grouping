import { Block } from "./classes/Block";
import { GroupingApplication } from "./classes/GroupingApplication";
import "./style.css";

const app = new GroupingApplication({
  background: "#333",
  resizeTo: window,
  antialias: true,
});

document.querySelector(".canvas-container")?.appendChild(app.view);
const blocks = [
  new Block(200, 200, 0xff0000), //red
  new Block(300, 250, 0x00ff00), //green
  new Block(750, 725, 0x0000ff), //blue
  new Block(800, 800, 0xffff00), //yellow
  new Block(800, 300, 0xff00ff), //pink
];
app.addBlocks(blocks);

document.querySelector("#button")?.addEventListener("click", () => {
  app.groups[0].updateName("Dit is mijn nieuwe naam en hij is best lang");
  // app.addBlock(new Block(700, 700, 0x00ffff));
  console.log(app.getLocations());
});

document.querySelector("#home")?.addEventListener("click", () => {
  console.log(app.getLocations());
  app.panToHome();
  console.log(app.getLocations());
});
