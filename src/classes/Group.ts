import { Rectangle, Text } from "pixi.js";
import { RiskBlock } from "./Risk";
import { RiskContainer } from "./RiskContainer";
export class Group extends RiskContainer {
  private risks: RiskBlock[] = [];
  private nameText: Text;

  constructor(name: string, risks: RiskBlock[]) {
    super();
    this.risks = risks;
    this.addChild(...risks);

    this.nameText = new Text(name);
    this.addChild(this.nameText);
    this.updateName();
    this.nameText.cursor = "pointer";
    this.nameText.eventMode = "static";
    this.nameText.on("pointerdown", this.click, this);
  }

  public addRisk(risk: RiskBlock) {
    this.risks.push(risk);
    this.addChild(risk);
    this.updateName();
  }

  public removeRisk(risk: RiskBlock) {
    this.risks = this.risks.filter((r) => r !== risk);
    this.removeChild(risk);
    this.updateName();
  }

  public getLength(): number {
    return this.risks.length;
  }

  public isNearMembers(risk: RiskBlock): boolean {
    return this.risks.filter((r) => r !== risk && risk.isNear(r)).length > 0;
  }

  public getOnlyMember(): RiskBlock {
    if (this.risks.length > 1) {
      throw new Error("Has multiple members");
    }
    return this.risks[0];
  }

  public getBounds(): Rectangle {
    if (!this.risks) {
      return super.getBounds();
    }

    const allCorners = this.risks
      .map((r) => r.getBounds())
      .map((r) => {
        return new Rectangle(r.x, r.y, r.x + r.width, r.y + r.height);
      });
    console.log(allCorners);

    const bounds = new Rectangle(
      Math.min(...allCorners.map((r) => r.x)),
      Math.min(...allCorners.map((r) => r.y)),
      Math.max(...allCorners.map((r) => r.width)),
      Math.max(...allCorners.map((r) => r.height))
    );
    console.log(bounds);
    return new Rectangle(
      bounds.x,
      bounds.y,
      bounds.width - bounds.x,
      bounds.height - bounds.y
    );
  }

  public updateName(): void {
    this.removeChild(this.nameText);
    this.updateBoundary();
    console.time("getBounds");
    const bounds = this.getBounds();
    console.timeEnd("getBounds");

    this.nameText.x = bounds.x + bounds.width / 2;
    this.nameText.y = bounds.y - 60;
    this.addChild(this.nameText);
  }
}
