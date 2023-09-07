import { ITextStyle, Point, Text } from "pixi.js";
import { Corners, getCornersFromBounds } from "../helpers";
import { Block } from "./Block";
import { DragContainer } from "./DragContainer";
export class Group extends DragContainer {
  private blocks: Block[] = [];
  private nameText: Text;

  constructor(
    name: string,
    blocks: Block[] = [],
    nameStyle: Partial<ITextStyle> = { fill: "#fff" }
  ) {
    super();
    this.blocks = blocks;
    this.addChild(...blocks);

    const bounds = this.getBounds();
    this.nameText = new Text(name, nameStyle);
    const textPos = new Point(
      bounds.x + bounds.width / 2 - this.nameText.width / 2,
      bounds.y - 60
    );
    this.nameText.x = textPos.x;
    this.nameText.y = textPos.y;
    this.addChild(this.nameText);
    this.updateBoundary();
    this.nameText.cursor = "pointer";
    this.nameText.eventMode = "static";
    this.nameText.on("pointerdown", this.click, this);
  }

  public move(point: Point) {
    if (this.nearFusingGroup()) {
      this.fusingGroup?.setBoundaryExtension(this.getBounds());
      this.fusingGroup?.updateBoundary();
    }

    const pos = new Point(
      point.x - (this.relativeMousePosition?.x ?? 0),
      point.y - (this.relativeMousePosition?.y ?? 0)
    );

    this.parent.toLocal(pos, undefined, this.position);
  }

  public addBlock(block: Block) {
    this.blocks.push(block);
    this.addChild(block);
    this.updateBoundary();
  }

  public removeBlock(block: Block) {
    this.blocks = this.blocks.filter((b) => b !== block);
    this.removeChild(block);
    this.updateBoundary();
  }

  public getLength(): number {
    return this.blocks.length;
  }

  public isNearMembers(other: DragContainer): boolean {
    return this.blocks.filter((r) => r !== other && other.isNear(r)).length > 0;
  }

  public isNearOtherGroup(group: Group): boolean {
    return this.blocks.some((b) => group.isNearMembers(b));
  }

  public getOnlyMember(): Block {
    if (this.blocks.length > 1) {
      throw new Error("Has multiple members");
    }
    return this.blocks[0];
  }

  public getCorners(): Corners {
    if (!this.blocks) {
      return super.getCorners();
    }

    const allBlockCorners = this.blocks
      .filter((b) => !b.isAwayFromGroup())
      .map((b) => getCornersFromBounds(b.getBounds()));

    return {
      left: Math.min(...allBlockCorners.map((c) => c.left)),
      top: Math.min(...allBlockCorners.map((c) => c.top)),
      right: Math.max(...allBlockCorners.map((c) => c.right)),
      bottom: Math.max(...allBlockCorners.map((c) => c.bottom)),
    };
  }

  public fuse(): void {
    if (!this.fusingGroup) {
      throw new Error("Cannot fuse without fusing group");
    }
    console.log("fuse groups");

    this.blocks.forEach((b) => {
      const oldPos = b.getBounds();
      this.removeBlock(b);
      this.fusingGroup?.addBlock(b);

      b.parent.toLocal(new Point(oldPos.x, oldPos.y), undefined, b.position);
      b.addToGroup(this.fusingGroup!);
    });

    this.unsetFusingGroup();
  }

  public updateBoundary(visible = true): void {
    this.removeChild(this.nameText);
    super.updateBoundary(visible);
    const bounds = this.getBounds();

    let pos = this.toLocal(
      new Point(
        bounds.x + bounds.width / 2 - this.nameText.width / 2,
        bounds.y - 60
      ),
      undefined
    );
    // this.nameText = new Text("random", this.nameTextStyle);
    this.nameText.x = pos.x;
    this.nameText.y = pos.y;
    this.nameText.visible = true;
    // this.nameText.cursor = "pointer";
    // this.nameText.eventMode = "static";
    // this.nameText.on("pointerdown", this.click, this);
    this.addChild(this.nameText);
    if (this.blocks.filter((b) => !b.isAwayFromGroup()).length === 1) {
      this.nameText.visible = false;
    }
  }
}
