import { Container, FederatedPointerEvent, Graphics, Point } from "pixi.js";

export class RiskContainer extends Container {
  protected boundaryGraphic = new Graphics();
  protected relativeMousePosition: Point | undefined;
  // True if the mouse is currently pressed down on this
  protected active = false;

  constructor() {
    super();
    this.createBoundaryGraphic();
    this.addChild(this.boundaryGraphic);
  }

  public click(e: FederatedPointerEvent): void {
    this.setRelativeMousePosition(e.client);
    this.active = true;
  }

  public drag(e: FederatedPointerEvent) {
    const pos = new Point(
      e.global.x - (this.relativeMousePosition?.x ?? 0),
      e.global.y - (this.relativeMousePosition?.y ?? 0)
    );

    this.parent.toLocal(pos, undefined, this.position);
  }

  public end(_: FederatedPointerEvent) {
    this.active = false;
  }

  public isActive(): boolean {
    return this.active;
  }

  public isNear(other: RiskContainer): boolean {
    const myBounds = this.getBounds();
    const otherBounds = other.getBounds();

    const margin = 50;

    return (
      myBounds.x < otherBounds.x + otherBounds.width + margin &&
      myBounds.x + myBounds.width > otherBounds.x - margin &&
      myBounds.y < otherBounds.y + otherBounds.height + margin &&
      myBounds.y + myBounds.height > otherBounds.y - margin
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

  private createBoundaryGraphic(visible = false): void {
    const indicatorMargin = 150;
    this.boundaryGraphic.lineStyle(1, "#ccc");
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

  public setRelativeMousePosition(p: Point) {
    this.relativeMousePosition = new Point(p.x - this.x, p.y - this.y);
  }
}
