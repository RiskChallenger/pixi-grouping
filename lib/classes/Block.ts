import { DropShadowFilter } from "pixi-filters";
import { Filter, Graphics, Point, Rectangle } from "pixi.js";
import { distanceBetweenPoints, moveToNewParent } from "../helpers";
import { DragContainer } from "./DragContainer";
import { Group } from "./Group";

export class Block extends DragContainer {
  protected blockGraphic = new Graphics();
  protected overlayFilter = new DropShadowFilter({
    color: this.styleService.getShadowColor(),
    blur: 5,
    quality: 10,
    resolution: 10,
    alpha: 0.8,
    offset: { x: 0, y: 0 },
  });
  protected fillColor: number | string;
  // The group this risk is a member of, if any
  protected group: Group | null = null;
  // True when being dragged away from group, disregard in calculating group bounds
  protected awayFromGroup = false;
  // Other loose block this will form a group with on mouse up
  protected fusingBlock: Block | null = null;
  protected overlayBlock: Block | null = null;

  constructor(x = 0, y = 0, fillColor: number | string = "#fff") {
    super();
    this.stopListeners.push(
      this.styleService.on(
        "changed-shadow-color",
        (color: number) => (this.overlayFilter.color = color)
      )
    );

    this.fillColor = fillColor;
    this.createBlockGraphic();
    this.updateBoundary(false);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", (e) => this.pointerdown(e.global), this);

    this.overlayFilter.padding = 30;

    this.x = x;
    this.y = y;
  }

  public pointerdown(p: Point): void {
    if (this.group) {
      this.group.zIndex = 100;
    }
    super.pointerdown(p);
  }

  public pointerup(): void {
    if (this.group) {
      this.group.resetZIndex();
    }
    super.pointerup();
  }

  public drag(point: Point) {
    if (this.nearFusingBlock()) {
      this.fusingBlock?.setBoundaryExtension(this.getBounds());
      this.fusingBlock?.updateBoundary();
    }

    if (this.hasGroup()) {
      this.group?.updateBoundary(false);
    }

    super.drag(point);
  }

  protected getCustomBounds(): Rectangle {
    if (!this.blockGraphic) {
      return super.getCustomBounds();
    }
    return this.blockGraphic.getBounds();
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

  public addToGroup(group: Group): void {
    this.hideBoundary();
    this.unsetFusingBlock();
    this.group = group;
    this.group.updateBoundary();
    this.emit("join-group", this.group);
  }

  public removeFromGroup(): void {
    this.group = null;
    this.awayFromGroup = false;
    this.emit("leave-group");
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

    moveToNewParent(this, this.fusingGroup);
    this.fusingGroup.addBlock(this);
    this.addToGroup(this.fusingGroup);

    this.unsetFusingGroup();
  }

  public isOverlaying(other: Block): boolean {
    const myBounds = this.getBounds();
    const myCenter = new Point(
      myBounds.x + myBounds.width / 2,
      myBounds.y + myBounds.height / 2
    );
    const otherBounds = other.getBounds();
    const otherCenter = new Point(
      otherBounds.x + otherBounds.width / 2,
      otherBounds.y + otherBounds.height / 2
    );
    const distance = distanceBetweenPoints(myCenter, otherCenter);

    // Seems about right, total magic number
    const threshold = 15;
    return distance <= threshold;
  }

  public setOverlayBlock(block: Block): void {
    this.overlayBlock = block;
    this.showHighlight();
    this.overlayBlock?.showHighlight();
  }

  public getOverlayBlock(): Block | null {
    return this.overlayBlock;
  }

  public unsetOverlayBlock(): void {
    this.hideHighlight();
    this.overlayBlock?.hideHighlight();
    this.overlayBlock = null;
  }

  public hasOverlayBlock(): boolean {
    return this.overlayBlock !== null;
  }

  /**
   * If two blocks are overlaying when the mouse is released, this function is called.
   * It can very well be extended when implementing this library to add more functionality
   */
  public overlay(): void {
    this.emit("overlay", this.overlayBlock);
  }

  public showHighlight(): void {
    this.filters = [this.overlayFilter as unknown as Filter];
  }

  public hideHighlight(): void {
    this.filters?.pop();
  }

  protected createBlockGraphic(): void {
    this.blockGraphic.beginFill(this.fillColor);
    this.blockGraphic.drawRoundedRect(0, 0, 200, 100, 5);
    this.blockGraphic.endFill();
    this.addChild(this.blockGraphic);
  }
}
