import { FederatedPointerEvent, Graphics, Point } from "pixi.js";
import { Corners, getCornersFromBounds } from "../helpers";
import { DragContainer } from "./DragContainer";
import { Group } from "./Group";

export class Block extends DragContainer {
  private blockGraphic = new Graphics();
  private fillColor: number | string;
  // The group this risk is a member of, if any
  private group: Group | null = null;
  // True when being dragged away from group, disregard in calculating group bounds
  private awayFromGroup = false;
  // Other loose block this will fuse with on mouse up
  private fusingBlock: Block | null = null;

  constructor(x = 0, y = 0, fillColor: number | string = "#fff") {
    super();

    this.fillColor = fillColor;
    this.createBlockGraphic();
    this.updateBoundary(false);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.click);

    this.x = x;
    this.y = y;
  }

  public move(e: FederatedPointerEvent) {
    if (this.nearFusingBlock()) {
      this.fusingBlock?.setBoundaryExtension(this.getBounds());
      this.fusingBlock?.updateBoundary();
    }

    const pos = new Point(
      e.global.x - (this.relativeMousePosition?.x ?? 0),
      e.global.y - (this.relativeMousePosition?.y ?? 0)
    );

    if (this.hasGroup()) {
      this.group?.updateBoundary();
      this.parent.toLocal(pos, this.group!, this.position);
    } else {
      this.parent.toLocal(pos, undefined, this.position);
    }
  }

  public getCorners(): Corners {
    if (!this.blockGraphic) {
      return super.getCorners();
    }
    return getCornersFromBounds(this.blockGraphic.getBounds());
  }

  public getGroup(): Group | null {
    return this.group;
  }

  public hasGroup(): boolean {
    return this.group !== null;
  }

  public nearGroup(): boolean {
    return this.group?.isNearMembers(this) ?? false;
  }

  public setFusingBlock(block: Block): void {
    this.fusingBlock = block;
  }

  public getFusingBlock(): Block | null {
    return this.fusingBlock;
  }

  public unsetFusingBlock(): void {
    this.fusingBlock?.unsetBoundaryExtension();
    this.fusingBlock = null;
  }

  public hasFusingBlock(): boolean {
    return this.fusingBlock !== null;
  }

  public nearFusingBlock(): boolean {
    return this.fusingBlock?.isNear(this) ?? false;
  }

  public nearFusing(): boolean {
    return this.nearFusingBlock() || this.nearFusingGroup();
  }

  public fuse(): void {
    if (!this.fusingGroup) {
      throw new Error("Cannot fuse without fusing group");
    }
    this.fusingGroup.addBlock(this);
    console.log("fuse risk in group");

    this.parent.toLocal(this.position, undefined, this.position);
    this.addToGroup(this.fusingGroup);
    this.unsetFusingGroup();
  }

  public addToGroup(group: Group): void {
    this.hideBoundary();
    this.group = group;
    this.group.updateBoundary();
  }

  public removeFromGroup(): void {
    this.group = null;
    this.awayFromGroup = false;
  }

  public setAwayFromGroup(): void {
    this.awayFromGroup = true;
  }

  public unsetAwayFromGroup(): void {
    this.awayFromGroup = false;
  }

  public isAwayFromGroup(): boolean {
    return this.awayFromGroup;
  }

  private createBlockGraphic(): void {
    this.blockGraphic.beginFill(this.fillColor);
    this.blockGraphic.drawRoundedRect(0, 0, 200, 100, 5);
    this.blockGraphic.endFill();
    this.addChild(this.blockGraphic);
  }
}
