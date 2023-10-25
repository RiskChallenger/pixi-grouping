import { Viewport } from "pixi-viewport";
import {
  Application,
  DisplayObject,
  FederatedPointerEvent,
  IApplicationOptions,
  Point,
} from "pixi.js";
import { moveToNewParent } from "../helpers";
import { Block } from "./Block";
import { Group } from "./Group";
import { GroupingStyles, StyleService } from "./StyleService";

export class GroupingApplication extends Application<HTMLCanvasElement> {
  // All blocks on the canvas
  private blocks: Block[] = [];
  // Blocks that have no group
  private looseBlocks: Block[] = [];
  private groups: Group[] = [];
  private groupNameCounter = 0;
  private styleService: StyleService;

  private viewport: Viewport;

  constructor(
    options: (Partial<IApplicationOptions> & GroupingStyles) | undefined
  ) {
    super(options);

    this.styleService = StyleService.getInstance();
    this.styleService.setStyles(options);

    this.styleService.on(
      "changed-background-color",
      (color: number) => (this.renderer.background.color = color)
    );

    this.viewport = new Viewport({
      screenWidth: this.screen.width,
      screenHeight: this.screen.height,
      events: this.renderer.events,
      passiveWheel: false,
    });
    // Put viewport above other items by default
    this.stage.sortableChildren = true;
    this.viewport.zIndex = 0.1;
    this.viewport.sortableChildren = true;
    this.viewport.drag({ wheel: false });
    this.viewport.decelerate();

    this.viewport.eventMode = "static";
    this.viewport.hitArea = this.screen;
    this.viewport.moveCenter(0, 0);
    this.viewport.on("pointerup", this.pointerup, this);
    this.viewport.on("pointerupoutside", this.pointerup, this);
    this.viewport.on("pointermove", this.mousemove, this);
    this.view.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    this.viewport.on("rightdown", this.rightclick, this);

    this.stage.addChild(this.viewport);

    window.addEventListener("load", () => {
      this.resizeCanvas(this.screen.width, this.screen.height);
      this.viewport.moveCenter(0, 0);
    });
  }

  public addBlocks(blocks: Block[]) {
    blocks.forEach((b) => this.addBlock(b));
  }

  /**
   * Add a block at the specified location
   * @param block Block to be added
   * @param point Location to add the block to
   */
  public addBlock(block: Block) {
    this.blocks.push(block);
    this.viewport.addChild(block);
    const middleOfBlock = new Point(
      block.x - block.width / 2,
      block.y - block.height / 2
    );
    block.parent.toLocal(middleOfBlock, undefined, block.position);
    this.groups.find((g) => {
      if (g.isNearMembers(block)) {
        moveToNewParent(block, g);
        g.addBlock(block);
        block.addToGroup(g);
        g.updateBoundary(false);
        return true;
      }
    });
    this.looseBlocks.find((lb) => {
      if (lb.isNear(block)) {
        // Spawned near a loose block
        const newGroup = new Group(this.nextGroupName(), [lb, block]);
        this.viewport.addChild(newGroup);
        lb.addToGroup(newGroup);
        block.addToGroup(newGroup);
        // Block no longer loose
        this.looseBlocks = this.looseBlocks.filter((b) => b !== lb);
        this.groups.push(newGroup);
        newGroup.updateBoundary(false);

        return true;
      }
    });
    if (!block.hasGroup()) {
      this.looseBlocks.push(block);
    }
  }

  public addChild(...children: DisplayObject[]): DisplayObject {
    return this.viewport.addChild(...children);
  }

  public panToHome(): void {
    this.viewport.animate({
      removeOnInterrupt: true,
      position: { x: 0, y: 0 },
      time: 500,
    });
  }

  public getLocations(): Point[] {
    return this.blocks.map((b) => this.viewport.toWorld(b.getBounds()));
  }

  public updateStyles(styles: GroupingStyles): void {
    this.styleService.setStyles(styles);
  }

  protected pointerup(): void {
    const active = this.getActive();
    active?.pointerup();
    if (active instanceof Block && active.isAwayFromGroup()) {
      const formerGroup = active.getGroup();

      moveToNewParent(active, this.viewport);
      this.viewport.addChild(active);

      formerGroup?.removeBlock(active);
      active.removeFromGroup();
      this.looseBlocks.push(active);

      // If the group only has 1 member left, disbandon it
      if (formerGroup?.getLength() === 1) {
        this.groups = this.groups.filter((g) => g !== formerGroup);
        const lastMember = formerGroup.getOnlyMember();

        moveToNewParent(lastMember, this.viewport);
        this.viewport.addChild(lastMember);

        formerGroup.destroy();
        lastMember.removeFromGroup();
        this.looseBlocks.push(lastMember);
      }
    }
    if (active?.hasFusingGroup()) {
      if (active instanceof Block) {
        active.fuse();
        this.looseBlocks = this.looseBlocks.filter((b) => b !== active);
      }
      if (active instanceof Group) {
        active.fuse();
        this.groups = this.groups.filter((g) => g !== active);
      }
    }
    if (active instanceof Block && active.hasFusingBlock()) {
      const fusingBlock = active.getFusingBlock()!;
      const newGroup = new Group(this.nextGroupName(), [active, fusingBlock]);
      this.viewport.addChild(newGroup);
      active.addToGroup(newGroup);
      fusingBlock.addToGroup(newGroup);
      this.looseBlocks = this.looseBlocks.filter(
        (b) => b !== active && b !== fusingBlock
      );
      this.groups.push(newGroup);
      this.stage.emit("new-group", newGroup);
    }
    if (active instanceof Block && active.hasOverlayBlock()) {
      active.overlay();
    }
    this.blocks.forEach((b) => {
      b.end();
    });

    this.looseBlocks.forEach((r) => r.hideBoundary());
    this.groups.forEach((g) => {
      g.hideBoundary();
      g.end();
    });
    this.resumeViewport();
  }

  protected mousemove(e: FederatedPointerEvent): void {
    const active = this.getActive();
    if (active) {
      this.pauseViewport();

      active?.drag(e.global);
    }
    if (active instanceof Block) {
      [
        ...this.groups,
        ...this.looseBlocks.filter((lb) => !lb.nearFusing()),
      ].forEach((g) => g.showBoundary());
    } else if (active instanceof Group) {
      this.groups
        .filter((g) => !g.nearFusingGroup())
        .forEach((g) => g.showBoundary());
    }

    if (active instanceof Group) {
      if (active.hasFusingGroup() && !active.nearFusingGroup()) {
        active.unsetFusingGroup();
      }
      if (!active.nearFusingGroup()) {
        this.groups
          .filter((g) => g !== active)
          .find((g) => {
            // Dragged into a group
            if (g.isNearOtherGroup(active)) {
              g.setBoundaryExtension(active.getBounds());
              active.hideBoundary();
              active.setFusingGroup(g);
              return true;
            }
          });
      }
    }
    if (active instanceof Block) {
      if (active.hasFusingGroup() && !active.nearFusingGroup()) {
        // Away from fusing group
        active.unsetFusingGroup();
      }
      if (active.hasFusingBlock() && !active.nearFusingBlock()) {
        active.unsetFusingBlock();
      }
      if (active.hasGroup()) {
        if (!active.nearGroup()) {
          active.setAwayFromGroup();
          active.showBoundary();
        } else {
          active.unsetAwayFromGroup();
          active.hideBoundary();
        }
      }
      if (!active.nearFusing() && !active.nearGroup()) {
        this.groups.find((g) => {
          // Dragged into a group
          if (g.isNearMembers(active)) {
            g.setBoundaryExtension(active.getBounds());
            active.hideBoundary();
            active.setFusingGroup(g);
            return true;
          }
        });
        const isFusing = this.looseBlocks
          .filter((lb) => lb !== active)
          .some((lb) => {
            if (active.isNear(lb)) {
              lb.setBoundaryExtension(active.getBounds());
              active.hideBoundary();
              active.setFusingBlock(lb);
              return true;
            }
          });

        if (!isFusing) {
          active.unsetFusingBlock();
        }
      }
      const isOverlaying = this.blocks
        .filter((b) => b !== active)
        .some((b) => {
          if (active.isOverlaying(b)) {
            active.setOverlayBlock(b);
            return true;
          }
        });
      if (!isOverlaying && active.hasOverlayBlock()) {
        active.unsetOverlayBlock();
      }
      if (active.nearFusing() && active.hasBoundary()) {
        active.hideBoundary();
      }
    }
  }

  private getActive(): Block | Group | undefined {
    return [...this.blocks, ...this.groups].find((el) => el.isActive());
  }

  public resizeCanvas(width: number, height: number): void {
    this.renderer.resize(width, height);
    this.viewport.resize(width, height);
  }

  public randomBlock(): Block {
    return new Block(
      Math.max(100, Math.random() * (this.screen.width - 100)),
      Math.max(110, Math.random() * (this.screen.height - 50)),
      Math.random() * 0xffffff
    );
  }

  private pauseViewport(): void {
    this.viewport.plugins.pause("drag");
    this.viewport.plugins.pause("wheel");
  }

  private resumeViewport(): void {
    this.viewport.plugins.resume("drag");
    this.viewport.plugins.resume("wheel");
  }

  private rightclick(e: FederatedPointerEvent): void {
    this.stage.emit("viewport-rightclick", e);
  }

  private nextGroupName(): string {
    return `Group ${++this.groupNameCounter}`;
  }
}
