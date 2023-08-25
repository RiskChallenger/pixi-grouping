import {
  FederatedPointerEvent,
  Graphics,
  Point,
  Rectangle,
  Text,
} from "pixi.js";
import { Group } from "./Group";
import { RiskContainer } from "./RiskContainer";

const TEXT_PADDING = 20;

export class RiskBlock extends RiskContainer {
  private description: Text;
  private blockGraphic = new Graphics();
  // The group this risk is a member of, if any
  private group: Group | null = null;

  constructor(description: string, borderColor: string | number, x = 0, y = 0) {
    super();

    this.description = new Text(description, {
      wordWrap: true,
      wordWrapWidth: 400,
    });
    this.description.x = TEXT_PADDING;
    this.description.y = TEXT_PADDING;

    this.createBlockGraphic(this.description, borderColor);
    this.addChild(this.blockGraphic);
    this.updateBoundary(false);
    this.addChild(this.description);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.click);

    this.x = x;
    this.y = y;
  }

  public drag(e: FederatedPointerEvent, screen: Rectangle) {
    const pos = new Point(
      e.global.x - (this.relativeMousePosition?.x ?? 0),
      e.global.y - (this.relativeMousePosition?.y ?? 0)
    );
    if (
      pos.x > 0 &&
      pos.x + this.width < screen.width &&
      pos.y > 0 &&
      pos.y + this.height < screen.height
    ) {
      this.position.set(pos.x, pos.y);
    } else {
      this.setRelativeMousePosition(e.client);
    }
    super.drag(e, screen);
    if (this.hasGroup()) {
      this.group?.updateName();
    }
  }

  public getBounds(): Rectangle {
    if (this.blockGraphic) {
      return this.blockGraphic?.getBounds();
    } else {
      console.log("bestaat niet");
      return super.getBounds();
    }
  }

  public getGroup(): Group | null {
    return this.group;
  }

  public hasGroup(): boolean {
    return this.group !== null;
  }

  public inGroup(): boolean {
    return this.group?.isNearMembers(this) ?? false;
  }

  public setGroup(group: Group): void {
    this.group = group;
  }

  public removeFromGroup(): void {
    this.group = null;
  }

  private createBlockGraphic(text: Text, borderColor: string | number): void {
    this.blockGraphic.lineStyle(4, borderColor);
    this.blockGraphic.beginFill("#fff");
    this.blockGraphic.drawRoundedRect(
      0,
      0,
      text.width + 2 * TEXT_PADDING,
      text.height + 2 * TEXT_PADDING + 50, // 50 for space for icons in risk-footer
      20
    );
    this.blockGraphic.endFill();
  }
}
