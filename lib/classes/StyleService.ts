import EventEmitter from "eventemitter3";
import { ITextStyle } from "pixi.js";

export type GroupingStyles = {
  groupNameStyle?: Partial<ITextStyle>;
  borderColor?: number;
  shadowColor?: number;
  backgroundColor?: number;
};

export class StyleService extends EventEmitter {
  private groupNameStyle: Partial<ITextStyle> = { fill: 0xffffff };
  private borderColor: number = 0xffffff;
  private shadowColor: number = 0xffffff;
  private backgroundColor: number = 0xeeeeee;
  private static instance: StyleService;

  private constructor() {
    super();
  }

  public static getInstance(): StyleService {
    return this.instance || (this.instance = new this());
  }

  public setStyles(styles?: GroupingStyles): void {
    if (
      styles?.groupNameStyle !== undefined &&
      styles?.groupNameStyle != this.groupNameStyle
    ) {
      this.groupNameStyle = styles?.groupNameStyle;
      this.emit("changed-groupname-style", this.groupNameStyle);
    }
    if (
      styles?.borderColor !== undefined &&
      styles?.borderColor != this.borderColor
    ) {
      this.borderColor = styles?.borderColor;
      this.emit("changed-border-color", this.borderColor);
    }
    if (
      styles?.shadowColor !== undefined &&
      styles?.shadowColor != this.shadowColor
    ) {
      this.shadowColor = styles?.shadowColor;
      this.emit("changed-shadow-color", this.shadowColor);
    }
    if (
      styles?.backgroundColor !== undefined &&
      styles?.backgroundColor != this.backgroundColor
    ) {
      this.backgroundColor = styles?.backgroundColor;
      this.emit("changed-background-color", this.backgroundColor);
    }
  }

  public getBorderColor(): number {
    return this.borderColor;
  }

  public getGroupNameStyle(): Partial<ITextStyle> {
    return this.groupNameStyle;
  }

  public getShadowColor(): number {
    return this.shadowColor;
  }

  public getBackgroundColor(): number {
    return this.backgroundColor;
  }
}
