import { Viewport } from "pixi-viewport";
import {
  Application,
  FederatedPointerEvent,
  IApplicationOptions,
  Point,
} from "pixi.js";
import { Block } from "./Block";
import { Group } from "./Group";

export class GroupingApplication extends Application<HTMLCanvasElement> {
  // All blocks on the canvas
  private blocks: Block[] = [];
  // Blocks that have no group
  private looseBlocks: Block[] = [];
  public groups: Group[] = [];
  private groupNameCounter = 0;

  private viewport: Viewport;

  constructor(options: Partial<IApplicationOptions> | undefined) {
    super(options);

    this.viewport = new Viewport({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      events: this.renderer.events,
      passiveWheel: false,
    });
    this.viewport.sortableChildren = true;
    this.viewport.drag({ wheel: false });
    this.viewport.decelerate();

    this.viewport.eventMode = "static";
    this.viewport.hitArea = this.screen;
    this.viewport.on("pointerup", this.pointerup, this);
    this.viewport.on("pointerupoutside", this.pointerup, this);
    this.viewport.on("pointermove", this.mousemove, this);
    this.view.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    this.viewport.on("rightdown", this.rightclick, this);

    this.stage.addChild(this.viewport);
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
        const oldPos = block.getBounds();
        // Spawned inside a group
        this.viewport.removeChild(block);
        g.addBlock(block);
        block.addToGroup(g);
        block.parent.toLocal(
          new Point(oldPos.x, oldPos.y),
          undefined,
          block.position
        );
        g.updateBoundary(false);
        return true;
      }
    });
    this.looseBlocks.find((lb) => {
      if (lb.isNear(block)) {
        // Spawned near a loose block
        this.viewport.removeChild(lb);
        this.viewport.removeChild(block);
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

  public panToHome(): void {
    this.viewport.moveCenter(0, 0);
  }

  public getLocations(): Point[] {
    return this.blocks.map((b) => this.viewport.toWorld(b.getBounds()));
  }

  protected pointerup(): void {
    const active = this.getActive();
    active?.pointerup();
    if (active instanceof Block && active.isAwayFromGroup()) {
      const formerGroup = active.getGroup();
      const globalPos = active.parent.toGlobal(active.position);
      formerGroup?.removeBlock(active);
      this.viewport.addChild(active);

      active.parent.toLocal(globalPos, undefined, active.position);
      active.removeFromGroup();
      this.looseBlocks.push(active);

      // If the group only has 1 member left, disbandon it
      if (formerGroup?.getLength() === 1) {
        this.groups = this.groups.filter((g) => g !== formerGroup);
        const lastMember = formerGroup.getOnlyMember();
        const lastMemberGlobalPos = lastMember.parent.toGlobal(
          lastMember.position
        );

        formerGroup.destroy();
        this.viewport.addChild(lastMember);
        lastMember.parent.toLocal(
          lastMemberGlobalPos,
          undefined,
          lastMember.position
        );
        lastMember.removeFromGroup();
        this.looseBlocks.push(lastMember);
      }
    }
    if (active?.hasFusingGroup()) {
      if (active instanceof Block) {
        const oldPos = active.getBounds();
        this.viewport.removeChild(active);
        active.fuse(oldPos);
        this.looseBlocks = this.looseBlocks.filter((b) => b !== active);
      }
      if (active instanceof Group) {
        active.fuse();
        this.viewport.removeChild(active);
        this.groups = this.groups.filter((g) => g !== active);
      }
    }
    if (active instanceof Block && active.hasFusingBlock()) {
      const fusingBlock = active.getFusingBlock()!;
      this.viewport.removeChild(active, fusingBlock);
      const newGroup = new Group(this.nextGroupName(), [active, fusingBlock]);
      this.viewport.addChild(newGroup);
      active.unsetFusingBlock();
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

      active?.move(e.global);
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
      if (!isOverlaying) {
        active.unsetOverlayBlock();
      }
      if (active.nearFusing()) {
        active.hideBoundary();
      }
    }
  }

  private getActive(): Block | Group | undefined {
    return [...this.blocks, ...this.groups].find((el) => el.isActive());
  }

  private pauseViewport(): void {
    this.viewport.plugins.pause("drag");
    this.viewport.plugins.pause("wheel");
  }

  private resumeViewport(): void {
    this.viewport.plugins.resume("drag");
    this.viewport.plugins.resume("wheel");
  }

  public randomBlock(): Block {
    return new Block(
      Math.max(100, Math.random() * (this.screen.width - 100)),
      Math.max(110, Math.random() * (this.screen.height - 50)),
      Math.random() * 0xffffff
    );
  }

  private rightclick(e: FederatedPointerEvent): void {
    const block = this.randomBlock();
    block.position = new Point(e.global.x, e.global.y);
    this.addBlock(block);
  }

  private nextGroupName(): string {
    return `Group ${++this.groupNameCounter}`;
  }
}
