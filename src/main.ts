import { Application, FederatedPointerEvent } from "pixi.js";
import { Group } from "./classes/Group";
import { RiskBlock } from "./classes/Risk";
import "./style.css";

const app = new Application<HTMLCanvasElement>({
  background: "#eee",
  resizeTo: window,
});
app.stage.eventMode = "static";
app.stage.hitArea = app.screen;
app.stage.on("pointerup", end);
app.stage.on("pointerupoutside", end);
app.stage.on("pointermove", mousemove);
document.body.appendChild(app.view);

const risks: RiskBlock[] = [];
for (let i = 0; i < 2; i++) {
  risks.push(randomRisk());
}

const g = new Group("random", risks);
risks.forEach((r) => r.setGroup(g));
let groups: Group[] = [g];
let looseRisks: RiskBlock[] = [];

app.stage.addChild(...looseRisks, ...groups);

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
      activeGroup.drag(e);
      [...groups, ...looseRisks].forEach((g) => g.showBoundary());
    }
  }
  if (activeRisk) {
    activeRisk.drag(e);
    [...groups, ...looseRisks].forEach((g) => g.showBoundary());
    if (!activeRisk.hasGroup()) {
      groups.forEach((g) => {
        // Dragged into a group
        if (g.isNearMembers(activeRisk)) {
          // Dragged into an existing group
          // Remove risk from stage, will be shown via its (new) group
          activeRisk.hideBoundary();
          app.stage.removeChild(activeRisk);
          g.addRisk(activeRisk);
          activeRisk.setGroup(g);
          // Risk no longer loose
          looseRisks = looseRisks.filter((r) => r !== activeRisk);
        }
      });
      looseRisks
        .filter((lr) => lr !== activeRisk)
        .forEach((lr) => {
          if (lr.isNear(activeRisk)) {
            // Two loose risks dragged together
            // g refers to the other loose risk, not an actual group
            lr.hideBoundary();
            app.stage.removeChild(lr);
            activeRisk.hideBoundary();
            app.stage.removeChild(activeRisk);
            const newGroup = new Group("random", [lr, activeRisk]);
            app.stage.addChild(newGroup);
            lr.setGroup(newGroup);
            activeRisk.setGroup(newGroup);
            // Risks no longer loose
            looseRisks = looseRisks.filter((r) => r !== activeRisk && r !== lr);
            groups.push(newGroup);
          }
        });
    } else if (!activeRisk.inGroup()) {
      // Risk was dragged out of its group
      const formerGroup = activeRisk.getGroup();
      formerGroup?.removeRisk(activeRisk);
      activeRisk.removeFromGroup();
      app.stage.addChild(activeRisk);
      looseRisks.push(activeRisk);

      // If the group only has 1 member left, disbandon it
      if (formerGroup?.getLength() === 1) {
        groups = groups.filter((g) => g !== formerGroup);
        const lastMember = formerGroup.getOnlyMember();
        formerGroup.destroy();
        lastMember.removeFromGroup();
        app.stage.addChild(lastMember);
        looseRisks.push(lastMember);
      }
    }
  }
}

function randomRisk(): RiskBlock {
  const randomName =
    URL.createObjectURL(new Blob([])).split("/").pop()?.replaceAll("-", " ") ??
    "";
  return new RiskBlock(
    randomName + randomName,
    Math.floor(Math.random() * 0xffffff),
    Math.max(10, Math.random() * 30),
    Math.max(10, Math.random() * 50) + 300
  );
}
