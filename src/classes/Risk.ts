import {
  FederatedPointerEvent,
  Graphics,
  Point,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import { Group } from "./Group";
import { RiskContainer } from "./RiskContainer";

const PADDING = 10;
const BORDER_SIZE = 4;

export class Risk extends RiskContainer {
  private description: string;
  private author: string;
  private color: string | number;

  private descriptionObject!: Text;
  private authorObject!: Text;
  private blockGraphic = new Graphics();
  private authorBlockGraphic = new Graphics();
  private commentIcon: Sprite;
  private infoIcon: Sprite;
  private thumbsUpIcon: Sprite;
  private thumbsDownIcon: Sprite;

  // The group this risk is a member of, if any
  private group: Group | null = null;

  constructor(
    description: string,
    author: string,
    color: string | number,
    textures: { [key: string]: Texture },
    x = 0,
    y = 0
  ) {
    super();

    this.description = description;
    this.author = author;
    this.color = color;

    this.createBlockGraphic();
    this.createAuthorBlock();

    this.createIcons(textures);

    this.updateBoundary(false);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.click);

    this.x = x;
    this.y = y;
  }

  public move(e: FederatedPointerEvent) {
    const pos = new Point(
      e.global.x - (this.relativeMousePosition?.x ?? 0),
      e.global.y - (this.relativeMousePosition?.y ?? 0)
    );
    if (this.hasGroup()) {
      this.group?.updateName();
      this.parent.toLocal(pos, this.group!, this.position);
    } else {
      if (
        pos.x > 0 &&
        pos.x + this.width < screen.width &&
        pos.y > 0 &&
        pos.y + this.height < screen.height
      ) {
        this.parent.toLocal(pos, undefined, this.position);
      } else {
        this.setRelativeMousePosition(e.client);
      }
    }
  }

  public getBounds(): Rectangle {
    if (this.blockGraphic) {
      return this.blockGraphic?.getBounds();
    } else {
      return super.getBounds();
    }
  }

  public getGroup(): Group | null {
    return this.group;
  }

  public hasGroup(): boolean {
    return this.group !== null;
  }

  public inGroup(): boolean {
    return this.group?.isNearMembers(this) ?? false;
  }

  /**
   * Add risk to group and calibrate positioning
   * @param group group to add to
   * @param mousePosition position of mouse to calibrate risk position to
   */
  public addToGroup(group: Group, mousePosition: Point): void {
    this.parent.toLocal(this.position, undefined, this.position);
    this.setRelativeMousePosition(mousePosition);
    this.hideBoundary();
    this.group = group;
    this.group.updateName();
  }

  /**
   * Remove risk from group and calibrate positioning
   * @param p position of mouse to calibrate risk position to
   */
  public removeFromGroup(globalPosition: Point, mousePosition: Point): void {
    this.parent.toLocal(globalPosition, undefined, this.position);
    this.setRelativeMousePosition(mousePosition);
    this.group = null;
  }

  private createBlockGraphic(): void {
    this.descriptionObject = new Text(this.description, {
      fontFamily: "Roboto",
      fontSize: 16,
      fontWeight: "lighter",
      wordWrap: true,
      wordWrapWidth: 250,
    });
    this.descriptionObject.x = PADDING;
    this.descriptionObject.y = PADDING * 1.5 + BORDER_SIZE;

    this.blockGraphic.lineStyle(BORDER_SIZE, this.color);
    this.blockGraphic.beginFill("#fff");
    this.blockGraphic.drawRoundedRect(
      0,
      0,
      this.descriptionObject.width + 2 * PADDING,
      this.descriptionObject.height + 2 * PADDING + 50, // 50 for space for icons in risk-footer
      5
    );
    this.blockGraphic.endFill();
    this.addChild(this.blockGraphic);
    this.addChild(this.descriptionObject);
  }

  private createAuthorBlock(): void {
    this.authorObject = new Text(this.author, {
      fontFamily: "Roboto",
      fontSize: 16,
      fontWeight: "lighter",
    });
    this.authorObject.x =
      this.descriptionObject.width - this.authorObject.width - PADDING;
    this.authorObject.y = -PADDING;

    this.authorBlockGraphic.lineStyle(BORDER_SIZE, this.color);
    this.authorBlockGraphic.beginFill("#fff");
    this.authorBlockGraphic.drawRoundedRect(
      this.authorObject.x - 2 * PADDING,
      this.authorObject.y - PADDING / 2,
      this.authorObject.width + 4 * PADDING,
      this.authorObject.height + (2 * PADDING) / 2,
      10000 // just a very large number
    );
    this.authorBlockGraphic.endFill();
    this.addChild(this.authorBlockGraphic);
    this.addChild(this.authorObject);
  }

  private createIcons(textures: { [key: string]: Texture }): void {
    const commentIcon = new Sprite(textures.comment);
    commentIcon.anchor.set(0.5);
    commentIcon.x = PADDING * 2;
    commentIcon.y = this.height - PADDING * 2;
    this.addChild(commentIcon);

    const infoIcon = new Sprite(textures.info);
    infoIcon.anchor.set(0.5);
    infoIcon.x = this.width / 2;
    infoIcon.y = this.height - PADDING * 2;
    this.addChild(infoIcon);

    const thumbIconFlip = new Sprite(textures.thumb);
    thumbIconFlip.anchor.set(0.5);
    thumbIconFlip.angle = 180;
    thumbIconFlip.x = this.width - PADDING * 2;
    thumbIconFlip.y = this.height - PADDING * 2;
    this.addChild(thumbIconFlip);

    const thumbIcon = new Sprite(textures.thumb);
    thumbIcon.anchor.set(0.5);
    thumbIcon.x = thumbIconFlip.x - PADDING * 2;
    thumbIcon.y = this.height - PADDING * 2;
    this.addChild(thumbIcon);
  }
}
