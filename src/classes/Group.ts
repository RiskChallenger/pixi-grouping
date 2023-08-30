import { FederatedPointerEvent, Point, Text } from "pixi.js";
import { Risk } from "./Risk";
import { RiskContainer } from "./RiskContainer";
export class Group extends RiskContainer {
  private risks: Risk[] = [];
  private nameText: Text;

  constructor(name: string, risks: Risk[]) {
    super();
    this.risks = risks;
    this.addChild(...risks);

    this.nameText = new Text(name, {
      fontFamily: "Roboto",
      fontSize: 16,
      fontWeight: "lighter",
    });
    this.addChild(this.nameText);
    this.updateName();
    this.nameText.cursor = "pointer";
    this.nameText.eventMode = "static";
    this.nameText.on("pointerdown", this.click, this);
  }

  public addRisk(risk: Risk) {
    this.risks.push(risk);
    this.addChild(risk);
    this.updateName();
  }

  public move(e: FederatedPointerEvent) {
    super.move(e);
  }

  public removeRisk(risk: Risk) {
    this.risks = this.risks.filter((r) => r !== risk);
    this.removeChild(risk);
    this.updateName();
  }

  public getLength(): number {
    return this.risks.length;
  }

  public isNearMembers(risk: Risk): boolean {
    return this.risks.filter((r) => r !== risk && risk.isNear(r)).length > 0;
  }

  public isNearOtherGroup(group: Group): boolean {
    return this.risks.some((r) => group.isNearMembers(r));
  }

  public getOnlyMember(): Risk {
    if (this.risks.length > 1) {
      throw new Error("Has multiple members");
    }
    return this.risks[0];
  }

  public updateName(): void {
    this.removeChild(this.nameText);
    this.updateBoundary();
    const bounds = this.getBounds();

    let pos = this.toLocal(
      new Point(
        bounds.x + bounds.width / 2 - this.nameText.width / 2,
        bounds.y - 30
      ),
      undefined
    );
    this.nameText = new Text("random", {
      fontFamily: "Roboto",
      fontSize: 16,
      fontWeight: "lighter",
    });
    this.nameText.x = pos.x;
    this.nameText.y = pos.y;
    this.nameText.cursor = "pointer";
    this.nameText.eventMode = "static";
    this.nameText.on("pointerdown", this.click, this);
    this.addChild(this.nameText);
  }
}
