import { ITextStyle, Point, Rectangle, Text } from "pixi.js";
import { moveToNewParent } from "../helpers";
import { Block } from "./Block";
import { DragContainer } from "./DragContainer";
export class Group extends DragContainer {
  protected blocks: Block[] = [];
  protected nameText: Text;
  protected DEFAULT_ZINDEX = 1;

  constructor(name: string, blocks: Block[] = []) {
    super();

    this.sortableChildren = true;
    this.blocks = blocks;
    this.addChild(...blocks);

    const bounds = this.getBounds();
    this.nameText = new Text(name, this.styleService.getGroupNameStyle());
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
    this.nameText.on(
      "pointerdown",
      (e) => {
        e.stopPropagation();
        this.pointerdown(e.global);
      },
      this
    );

    this.zIndex = this.DEFAULT_ZINDEX;

    this.stopListeners.push(
      this.styleService.on(
        "changed-groupname-style",
        (newStyle: Partial<ITextStyle>) => (this.nameText.style = newStyle)
      )
    );
  }

  public drag(point: Point) {
    if (this.nearFusingGroup()) {
      this.hideText();
    } else {
      this.showText();
    }
    super.drag(point);
  }

  public addBlock(block: Block) {
    this.blocks.push(block);
    this.addChild(block);
    this.updateBoundary();
    this.emit("block-add", block);
  }

  public removeBlock(block: Block) {
    this.blocks = this.blocks.filter((b) => b !== block);
    this.updateBoundary();
    this.emit("block-remove", block);
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
    this.emit("name-change", name);
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
      moveToNewParent(b, this.fusingGroup!);
      this.fusingGroup?.addBlock(b);
      b.addToGroup(this.fusingGroup!);
    });

    this.unsetFusingGroup();
    this.destroy();
  }

  public destroy(): void {
    this.emit("disbandon");
    super.destroy();
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

    this.nameText.visible =
      this.blocks.filter((b) => !b.isAwayFromGroup()).length > 1;
  }

  protected hideText(): void {
    this.nameText.visible = false;
  }

  protected showText(): void {
    this.nameText.visible = true;
  }
}
