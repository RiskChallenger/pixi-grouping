import { ITextStyle, Point, Rectangle, Text } from "pixi.js";
import { Block } from "./Block";
import { DragContainer } from "./DragContainer";
export class Group extends DragContainer {
  protected blocks: Block[] = [];
  protected nameText: Text;
  protected DEFAULT_ZINDEX = 1;

  constructor(
    name: string,
    blocks: Block[] = [],
    nameStyle: Partial<ITextStyle> = { fill: "#fff" }
  ) {
    super();
    this.sortableChildren = true;
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
    this.nameText.on("pointerdown", this.pointerdown, this);

    this.zIndex = this.DEFAULT_ZINDEX;
  }

  public drag(point: Point, easeTime = 0) {
    if (this.nearFusingGroup()) {
      this.hideText();
    } else {
      this.showText();
    }
    super.drag(point, easeTime);
  }

  public addBlock(block: Block) {
    this.blocks.push(block);
    this.addChild(block);
    this.updateBoundary();
    this.emit("block-added", block);
  }

  public removeBlock(block: Block) {
    this.blocks = this.blocks.filter((b) => b !== block);
    this.removeChild(block);
    this.updateBoundary();
    this.emit("block-removed", block);
  }

  public getLength(): number {
    return this.blocks.length;
  }

  public getName(): string {
    return this.nameText.text;
  }

  public updateName(name: string): void {
    this.nameText.text = name;
    const bounds = this.getBounds();
    const textPos = new Point(
      bounds.x + bounds.width / 2 - this.nameText.width / 2,
      bounds.y - 60
    );
    this.nameText.parent.toLocal(textPos, undefined, this.nameText.position);
    this.emit("name-changed", name);
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

  protected getCustomBounds(): Rectangle {
    if (!this.blocks) {
      return super.getCustomBounds();
    }

    const allBlockBounds = this.blocks
      .filter((b) => !b.isAwayFromGroup())
      .map((b) => b.getBounds());

    const x = Math.min(...allBlockBounds.map((b) => b.x));
    const y = Math.min(...allBlockBounds.map((b) => b.y));
    const width = Math.max(...allBlockBounds.map((b) => b.right - x));
    const height = Math.max(...allBlockBounds.map((b) => b.bottom - y));

    return new Rectangle(x, y, width, height);
  }

  public fuse(): void {
    if (!this.fusingGroup) {
      throw new Error("Cannot fuse without fusing group");
    }

    this.blocks.forEach((b) => {
      const oldPos = b.getBounds();
      this.removeBlock(b);
      this.fusingGroup?.addBlock(b);

      b.parent.toLocal(new Point(oldPos.x, oldPos.y), undefined, b.position);
      b.addToGroup(this.fusingGroup!);
    });

    this.unsetFusingGroup();
    this.destroy();
  }

  public destroy(): void {
    this.emit("disbandoned");
    super.destroy();
  }

  private hideText(): void {
    this.nameText.visible = false;
  }

  private showText(): void {
    this.nameText.visible = true;
  }

  public updateBoundary(visible = true): void {
    super.updateBoundary(visible);
    const bounds = this.getBounds();

    let pos = this.toLocal(
      new Point(
        bounds.x + bounds.width / 2 - this.nameText.width / 2,
        bounds.y - 60
      ),
      undefined
    );
    this.nameText.x = pos.x;
    this.nameText.y = pos.y;
    if (this.blocks.filter((b) => !b.isAwayFromGroup()).length === 1) {
      this.nameText.visible = false;
    }
  }
}
