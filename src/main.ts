import { Application, FederatedPointerEvent, Point, Texture } from "pixi.js";
import { Group } from "./classes/Group";
import { Risk } from "./classes/Risk";
import "./style.css";

import commentIconUrl from "./images/comment-alt-light.png";
import infoIconUrl from "./images/info-light.png";
import thumbIconUrl from "./images/thumbs-up-light.png";

const app = new Application<HTMLCanvasElement>({
  background: "#eee",
  resizeTo: window,
  antialias: true,
});
app.stage.eventMode = "static";
app.stage.hitArea = app.screen;
app.stage.on("pointerup", end);
app.stage.on("pointerupoutside", end);
app.stage.on("pointermove", mousemove);
app.stage.on("rightdown", addRisk);
app.view.addEventListener("contextmenu", (e) => e.preventDefault());
document.body.appendChild(app.view);

const commentIconTexture = Texture.from(commentIconUrl);
const infoIconTexture = Texture.from(infoIconUrl);
const thumbIconTexture = Texture.from(thumbIconUrl);
const textures = {
  comment: commentIconTexture,
  info: infoIconTexture,
  thumb: thumbIconTexture,
};

const risks: Risk[] = [];
let groups: Group[] = [];
let looseRisks: Risk[] = [];
await document.fonts.load("lighter 16px Roboto");
for (let i = 0; i < 1; i++) {
  risks.push(randomRisk());
}
risks.push(
  new Risk(
    "006. Onvoldoende ruimte (tijd/geld) voor inpassingswensen.",
    "Peter",
    Math.floor(Math.random() * 0xffffff),
    textures,
    Math.max(400, Math.random() * app.screen.width - 400),
    Math.max(150, Math.random() * app.screen.height - 150)
  )
);
looseRisks = [...risks];
app.stage.addChild(...risks);

function end(e: FederatedPointerEvent) {
  risks.forEach((r) => {
    r.end(e);
  });
  looseRisks.forEach((r) => r.hideBoundary());
  groups.forEach((g) => {
    g.hideBoundary();
    g.end(e);
  });
}

/* Called on every mouse move
 * Would be better to only listen to this event if there's an active risk
 */
function mousemove(e: FederatedPointerEvent) {
  const activeRisk = risks.find((r) => r.isActive());
  if (!activeRisk) {
    const activeGroup = groups.find((g) => g.isActive());
    if (activeGroup) {
      activeGroup.move(e);
      [...groups, ...looseRisks].forEach((g) => g.showBoundary());
      groups
        .filter((g) => g !== activeGroup)
        .find((g) => {
          // Dragged into a group
          if (g.isNearOtherGroup(activeGroup)) {
            console.log("colliding groups");
            return true;
          }
        });
    }
  }
  if (activeRisk) {
    activeRisk.move(e);
    [...groups, ...looseRisks].forEach((g) => g.showBoundary());
    if (!activeRisk.hasGroup()) {
      groups.find((g) => {
        // Dragged into a group
        if (g.isNearMembers(activeRisk)) {
          // Remove risk from stage, add to group
          app.stage.removeChild(activeRisk);
          g.addRisk(activeRisk);
          activeRisk.addToGroup(g, e.global);
          // Risk no longer loose
          looseRisks = looseRisks.filter((r) => r !== activeRisk);
          return true;
        }
      });
      looseRisks
        .filter((lr) => lr !== activeRisk)
        .find((lr) => {
          // Two loose risks dragged together
          if (lr.isNear(activeRisk)) {
            app.stage.removeChild(lr);
            app.stage.removeChild(activeRisk);
            const newGroup = new Group("random", [lr, activeRisk]);
            app.stage.addChild(newGroup);
            lr.addToGroup(newGroup, e.global);
            activeRisk.addToGroup(newGroup, e.global);
            // Risks no longer loose
            looseRisks = looseRisks.filter((r) => r !== activeRisk && r !== lr);
            groups.push(newGroup);
            return true;
          }
        });
    } else if (!activeRisk.inGroup()) {
      // Risk was dragged out of its group
      const formerGroup = activeRisk.getGroup();
      const globalPos = activeRisk.parent.toGlobal(activeRisk.position);
      formerGroup?.removeRisk(activeRisk);
      app.stage.addChild(activeRisk);
      activeRisk.removeFromGroup(globalPos, e.global);
      looseRisks.push(activeRisk);

      // If the group only has 1 member left, disbandon it
      if (formerGroup?.getLength() === 1) {
        groups = groups.filter((g) => g !== formerGroup);
        const lastMember = formerGroup.getOnlyMember();
        const lastMemberGlobalPos = lastMember.parent.toGlobal(
          lastMember.position
        );
        formerGroup.destroy();
        app.stage.addChild(lastMember);
        lastMember.removeFromGroup(lastMemberGlobalPos, e.global);
        looseRisks.push(lastMember);
      }
    }
  }
}

function randomRisk(): Risk {
  const randomName =
    URL.createObjectURL(new Blob([])).split("/").pop()?.replaceAll("-", " ") ??
    "";
  return new Risk(
    randomName + randomName,
    "Peter Pelikaan",
    Math.floor(Math.random() * 0xffffff),
    textures,
    Math.max(400, Math.random() * app.screen.width - 400),
    Math.max(150, Math.random() * app.screen.height - 150)
  );
}

function addRisk(e: FederatedPointerEvent): void {
  const risk = randomRisk();
  risks.push(risk);
  app.stage.addChild(risk);
  const middleOfRisk = new Point(
    e.global.x - risk.width / 2,
    e.global.y - risk.height / 2
  );
  risk.parent.toLocal(middleOfRisk, undefined, risk.position);
  groups.find((g) => {
    if (g.isNearMembers(risk)) {
      // Spawned inside a group
      app.stage.removeChild(risk);
      g.addRisk(risk);
      risk.addToGroup(g, e.global);
      return true;
    }
  });
  looseRisks.find((lr) => {
    if (lr.isNear(risk)) {
      // Spawned near a loose risk
      app.stage.removeChild(lr);
      app.stage.removeChild(risk);
      const newGroup = new Group("random", [lr, risk]);
      app.stage.addChild(newGroup);
      lr.addToGroup(newGroup, e.global);
      risk.addToGroup(newGroup, e.global);
      // Risk no longer loose
      looseRisks = looseRisks.filter((r) => r !== lr);
      groups.push(newGroup);
      return true;
    }
  });
  if (!risk.hasGroup()) {
    looseRisks.push(risk);
  }
}
