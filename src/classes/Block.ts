import { Graphics, Point, Rectangle } from "pixi.js";
import { Corners, getCornersFromBounds } from "../helpers";
import { DragContainer } from "./DragContainer";
import { Group } from "./Group";

export class Block extends DragContainer {
  protected blockGraphic = new Graphics();
  protected fillColor: number | string;
  // The group this risk is a member of, if any
  protected group: Group | null = null;
  // True when being dragged away from group, disregard in calculating group bounds
  protected awayFromGroup = false;
  // Other loose block this will fuse with on mouse up
  protected fusingBlock: Block | null = null;

  constructor(x = 0, y = 0, fillColor: number | string = "#fff") {
    super();

    this.fillColor = fillColor;
    this.createBlockGraphic();
    this.updateBoundary(false);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.click, this);

    this.x = x;
    this.y = y;
  }

  public move(point: Point) {
    if (this.nearFusingBlock()) {
      this.fusingBlock?.setBoundaryExtension(this.getBounds());
      this.fusingBlock?.updateBoundary();
    }

    if (this.hasGroup()) {
      this.group?.updateBoundary(false);
    }

    super.move(point);
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

  public fuse(oldPosition: Rectangle): void {
    if (!this.fusingGroup) {
      throw new Error("Cannot fuse without fusing group");
    }
    this.fusingGroup.addBlock(this);

    this.parent.toLocal(
      new Point(oldPosition.x, oldPosition.y),
      undefined,
      this.position
    );
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

  protected createBlockGraphic(): void {
    this.blockGraphic.beginFill(this.fillColor);
    this.blockGraphic.drawRoundedRect(0, 0, 200, 100, 5);
    this.blockGraphic.endFill();
    this.addChild(this.blockGraphic);
  }
}
