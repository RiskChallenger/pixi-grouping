import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Point,
  Rectangle,
} from "pixi.js";
import { Corners, getCornersFromBounds } from "../helpers";
import { Group } from "./Group";

export class DragContainer extends Container {
  protected boundaryGraphic = new Graphics();
  protected relativeMousePosition: Point | undefined;
  // True if the mouse is currently pressed down on this
  protected active = false;
  // Group this will fuse with on mouse up
  protected fusingGroup: Group | null = null;
  // A rectangle that should be included when drawing the boundary
  private boundaryExtension: Rectangle | null = null;

  constructor() {
    super();
    this.createBoundaryGraphic();
    this.addChild(this.boundaryGraphic);
  }

  public click(e: FederatedPointerEvent): void {
    this.setRelativeMousePosition(e.client);
    this.active = true;
  }

  public move(e: FederatedPointerEvent) {
    if (this.nearFusingGroup()) {
      this.fusingGroup?.setBoundaryExtension(this.getBounds());
      this.fusingGroup?.updateBoundary();
    }

    const pos = new Point(
      e.global.x - (this.relativeMousePosition?.x ?? 0),
      e.global.y - (this.relativeMousePosition?.y ?? 0)
    );
    this.parent.toLocal(pos, undefined, this.position);
  }

  public end() {
    this.active = false;
  }

  public isActive(): boolean {
    return this.active;
  }

  public isNear(other: DragContainer): boolean {
    const myCorners = this.getCorners();
    const otherCorners = other.getCorners();
    const margin = 50;
    return (
      myCorners.left < otherCorners.right + margin &&
      myCorners.right + margin > otherCorners.left &&
      myCorners.top < otherCorners.bottom + margin &&
      myCorners.bottom + margin > otherCorners.top
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
    this.relativeMousePosition = new Point(p.x - this.x, p.y - this.y);
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
    const corners = this.getCorners();
    const extendedCorners = this.getExtendedCorners(corners);
    return new Rectangle(
      extendedCorners.left,
      extendedCorners.top,
      extendedCorners.right - extendedCorners.left,
      extendedCorners.bottom - extendedCorners.top
    );
  }

  protected getCorners(): Corners {
    const bounds = super.getBounds();
    return getCornersFromBounds(bounds);
  }

  protected getExtendedCorners(corners: Corners): Corners {
    if (this.boundaryExtension) {
      const combinedCorners = [
        corners,
        {
          left: this.boundaryExtension.x,
          top: this.boundaryExtension.y,
          right: this.boundaryExtension.x + this.boundaryExtension.width,
          bottom: this.boundaryExtension.y + this.boundaryExtension.height,
        },
      ];
      return {
        left: Math.min(...combinedCorners.map((c) => c.left)),
        top: Math.min(...combinedCorners.map((c) => c.top)),
        right: Math.max(...combinedCorners.map((c) => c.right)),
        bottom: Math.max(...combinedCorners.map((c) => c.bottom)),
      };
    } else {
      return corners;
    }
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
      10000
    );
    this.boundaryGraphic.visible = visible;
    this.boundaryGraphic.endFill();
  }

  // TODO TEMP
  public deactivate(): void {
    this.active = false;
  }
}
