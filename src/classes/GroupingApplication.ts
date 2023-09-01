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
  private groups: Group[] = [];

  constructor(options: Partial<IApplicationOptions> | undefined) {
    super(options);

    this.stage.eventMode = "static";
    this.stage.hitArea = this.screen;
    this.stage.on("pointerup", this.pointerup, this);
    this.stage.on("pointerupoutside", this.pointerup, this);
    this.stage.on("pointermove", this.mousemove, this);
    this.view.addEventListener("contextmenu", (e) => e.preventDefault());
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
    this.stage.addChild(block);
    const middleOfBlock = new Point(
      block.x - block.width / 2,
      block.y - block.height / 2
    );
    block.parent.toLocal(middleOfBlock, undefined, block.position);
    this.groups.find((g) => {
      if (g.isNearMembers(block)) {
        // Spawned inside a group
        this.stage.removeChild(block);
        g.addBlock(block);
        block.addToGroup(g);
        return true;
      }
    });
    this.looseBlocks.find((lb) => {
      if (lb.isNear(block)) {
        // Spawned near a loose block
        this.stage.removeChild(lb);
        this.stage.removeChild(block);
        const newGroup = new Group("random", [lb, block]);
        this.stage.addChild(newGroup);
        lb.addToGroup(newGroup);
        block.addToGroup(newGroup);
        // Block no longer loose
        this.looseBlocks = this.looseBlocks.filter((b) => b !== lb);
        this.groups.push(newGroup);
        return true;
      }
    });
    if (!block.hasGroup()) {
      this.looseBlocks.push(block);
    }
  }

  protected pointerup(): void {
    const active = this.getActive();
    if (active instanceof Block && active.isAwayFromGroup()) {
      const formerGroup = active.getGroup();
      const globalPos = active.parent.toGlobal(active.position);
      formerGroup?.removeBlock(active);
      this.stage.addChild(active);

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
        this.stage.addChild(lastMember);
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
        this.stage.removeChild(active);
        active.fuse();
        this.looseBlocks = this.looseBlocks.filter((b) => b !== active);
      }
      if (active instanceof Group) {
        active.fuse();
        this.stage.removeChild(active);
        active.destroy();
        this.groups = this.groups.filter((g) => g !== active);
      }
    }
    if (active instanceof Block && active.hasFusingBlock()) {
      const fusingBlock = active.getFusingBlock()!;
      this.stage.removeChild(active, fusingBlock);
      const newGroup = new Group("random", [active, fusingBlock]);
      this.stage.addChild(newGroup);
      active.unsetFusingBlock();
      active.addToGroup(newGroup);
      fusingBlock.addToGroup(newGroup);
      this.looseBlocks = this.looseBlocks.filter(
        (b) => b !== active && b !== fusingBlock
      );
      this.groups.push(newGroup);
    }
    this.blocks.forEach((b) => {
      b.end();
    });
    this.looseBlocks.forEach((r) => r.hideBoundary());
    this.groups.forEach((g) => {
      g.hideBoundary();
      g.end();
    });
  }

  protected mousemove(e: FederatedPointerEvent): void {
    const active = this.getActive();
    if (active) {
      active?.move(e);
      this.showBoundaries();
    }

    if (active instanceof Group) {
      if (active.hasFusingGroup() && !active.nearFusingGroup()) {
        active.unsetFusingGroup();
      }
      this.groups
        .filter((g) => g !== active)
        .find((g) => {
          // Dragged into a group
          if (g.isNearOtherGroup(active)) {
            g.setBoundaryExtension(active.getBounds());
            active.hideBoundary();
            active.setFusingGroup(g);
            console.log("colliding groups");
            return true;
          }
        });
    }
    if (active instanceof Block) {
      if (active.hasFusingGroup() && !active.nearFusingGroup()) {
        console.log("away from fusing group");
        // Away from fusing group
        active.unsetFusingGroup();
      }
      if (active.hasFusingBlock() && !active.nearFusingBlock()) {
        console.log("away from fusing block");
        active.unsetFusingBlock();
      }
      if (active.hasGroup()) {
        console.log("has group");

        if (!active.nearGroup()) {
          console.log("away from group");

          active.setAwayFromGroup();
          active.showBoundary();
        } else {
          console.log("close to group");

          active.unsetAwayFromGroup();
          active.hideBoundary();
        }
      }
      if (!active.nearFusing() && !active.nearGroup()) {
        console.log("has neither");

        this.groups.find((g) => {
          // Dragged into a group
          if (g.isNearMembers(active)) {
            console.log("found new fusing");

            g.setBoundaryExtension(active.getBounds());
            active.hideBoundary();
            active.setFusingGroup(g);
            // active.deactivate();
            return true;
          }
        });

        const isFusing = this.looseBlocks
          .filter((lb) => lb !== active)
          .some((lb) => {
            if (active.isNear(lb)) {
              console.log("found new buddy");

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
      if (active.nearFusing()) {
        active.hideBoundary();
      }
    }
  }

  private showBoundaries(): void {
    [
      ...this.groups,
      ...this.looseBlocks.filter((lb) => !lb.nearFusing()),
    ].forEach((g) => g.showBoundary());
  }

  private hideBoundaries(): void {
    [...this.groups, ...this.looseBlocks].forEach((g) => g.hideBoundary());
  }

  private getActive(): Block | Group | undefined {
    return [...this.blocks, ...this.groups].find((el) => el.isActive());
  }

  // enum ActiveState {
  //   Loose,
  //   InGroup,
  //   AwayFromGroup,
  //   FusingWithGroup,
  //   FusingWithBlock
  // }
}
