import { ease } from "pixi-ease";
import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Point,
  Rectangle,
} from "pixi.js";
import { Group } from "./Group";

export class DragContainer extends Container {
  protected boundaryGraphic = new Graphics();
  protected relativeMousePosition: Point = new Point();
  protected dragged = false;
  protected DEFAULT_ZINDEX = 0;

  // True if the mouse is currently pressed down on this
  protected active = false;

  // Group this will fuse with on mouse up
  protected fusingGroup: Group | null = null;

  // A rectangle that should be included when drawing the boundary
  protected boundaryExtension: Rectangle | null = null;

  constructor() {
    super();
    this.createBoundaryGraphic();
    this.addChild(this.boundaryGraphic);
    this.zIndex = this.DEFAULT_ZINDEX;
  }

  public pointerup(): void {
    if (!this.dragged) {
      this.emit("no-drag-click");
    }
    this.dragged = false;
    this.resetZIndex();
  }

  public pointerdown(e: FederatedPointerEvent): void {
    this.setRelativeMousePosition(e.global);
    this.active = true;
    this.zIndex = 100;
  }

  public move(point: Point, easeTime = 0) {
    this.dragged = true;
    if (this.nearFusingGroup()) {
      this.fusingGroup?.setBoundaryExtension(this.getBounds());
      this.fusingGroup?.updateBoundary();
    }

    const pos = new Point(
      point.x - (this.relativeMousePosition?.x ?? 0),
      point.y - (this.relativeMousePosition?.y ?? 0)
    );

    const newPosition = this.parent.toLocal(pos, undefined);
    if (easeTime > 0) {
      ease.add(
        this,
        { position: newPosition },
        { duration: easeTime, wait: 0, ease: "linear" }
      );
    } else {
      this.position = newPosition;
    }
  }

  public end() {
    this.active = false;
  }

  public isActive(): boolean {
    return this.active;
  }

  public isNear(other: DragContainer): boolean {
    // Use custom bounds to ignore boundary extensions
    const myBounds = this.getCustomBounds();
    const otherBounds = other.getCustomBounds();

    const margin = 30;
    return (
      myBounds.left < otherBounds.right + margin &&
      myBounds.right + margin > otherBounds.left &&
      myBounds.top < otherBounds.bottom + margin &&
      myBounds.bottom + margin > otherBounds.top
    );
  }

  public showBoundary(): void {
    this.boundaryGraphic.visible = true;
  }
  public hideBoundary(): void {
    this.boundaryGraphic.visible = false;
  }

  public updateBoundary(visible = true): void {
    this.boundaryGraphic.clear();
    this.createBoundaryGraphic(visible);
  }

  public setFusingGroup(group: Group): void {
    this.fusingGroup = group;
  }

  public unsetFusingGroup(): void {
    this.fusingGroup?.unsetBoundaryExtension();
    this.fusingGroup = null;
  }

  public hasFusingGroup(): boolean {
    return this.fusingGroup !== null;
  }

  public nearFusingGroup(): boolean {
    return this.fusingGroup?.isNearMembers(this) ?? false;
  }

  public setRelativeMousePosition(p: Point) {
    this.parent.toLocal(p, undefined, this.relativeMousePosition);
    this.relativeMousePosition.x -= this.x;
    this.relativeMousePosition.y -= this.y;
  }

  public setBoundaryExtension(area: Rectangle): void {
    this.boundaryExtension = area;
    this.updateBoundary();
  }

  public unsetBoundaryExtension(): void {
    this.boundaryExtension = null;
    this.updateBoundary();
  }

  public getBounds(): Rectangle {
    const bounds = this.getCustomBounds();
    if (this.boundaryExtension) {
      const combinedBounds = [bounds, this.boundaryExtension];
      const x = Math.min(...combinedBounds.map((b) => b.x));
      const y = Math.min(...combinedBounds.map((b) => b.y));
      const width = Math.max(...combinedBounds.map((b) => b.right - x));
      const height = Math.max(...combinedBounds.map((b) => b.bottom - y));
      return new Rectangle(x, y, width, height);
    } else {
      return bounds;
    }
  }

  public resetZIndex(): void {
    this.zIndex = this.DEFAULT_ZINDEX;
  }

  protected getCustomBounds(): Rectangle {
    return super.getBounds();
  }

  private createBoundaryGraphic(visible = false): void {
    const indicatorMargin = 150;
    this.boundaryGraphic.lineStyle(1, "#fff");
    this.boundaryGraphic.beginFill("#ffffff", 0);

    const bounds = this.getBounds();
    const pos = this.toLocal(new Point(bounds.x, bounds.y), undefined);
    this.boundaryGraphic.drawRoundedRect(
      pos.x - indicatorMargin / 2,
      pos.y - indicatorMargin / 2,
      bounds.width + indicatorMargin,
      bounds.height + indicatorMargin,
      1000000
    );
    this.boundaryGraphic.visible = visible;
    this.boundaryGraphic.endFill();
  }
}
