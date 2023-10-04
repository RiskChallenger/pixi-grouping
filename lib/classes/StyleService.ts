import { Unsubscribe, createNanoEvents } from "nanoevents";
import { ITextStyle } from "pixi.js";

export type GroupingStyles = {
  groupNameStyle?: Partial<ITextStyle>;
  borderColor?: number;
  shadowColor?: number;
  backgroundColor?: number;
};

export interface Events {
  "changed-groupname-style": (style: Partial<ITextStyle>) => void;
  "changed-border-color": (color: number) => void;
  "changed-shadow-color": (color: number) => void;
  "changed-background-color": (color: number) => void;
}

export class StyleService {
  private groupNameStyle: Partial<ITextStyle> = { fill: 0xffffff };
  private borderColor: number = 0xffffff;
  private shadowColor: number = 0xffffff;
  private backgroundColor: number = 0xeeeeee;
  private emitter = createNanoEvents<Events>();
  private static instance: StyleService;

  public static getInstance(): StyleService {
    return this.instance || (this.instance = new this());
  }

  public on<E extends keyof Events>(
    event: E,
    callback: Events[E]
  ): Unsubscribe {
    return this.emitter.on(event, callback);
  }

  public setStyles(styles?: GroupingStyles): void {
    if (
      styles?.groupNameStyle !== undefined &&
      styles?.groupNameStyle != this.groupNameStyle
    ) {
      this.groupNameStyle = styles?.groupNameStyle;
      this.emitter.emit("changed-groupname-style", this.groupNameStyle);
    }
    if (
      styles?.borderColor !== undefined &&
      styles?.borderColor != this.borderColor
    ) {
      this.borderColor = styles?.borderColor;
      this.emitter.emit("changed-border-color", this.borderColor);
    }
    if (
      styles?.shadowColor !== undefined &&
      styles?.shadowColor != this.shadowColor
    ) {
      this.shadowColor = styles?.shadowColor;
      this.emitter.emit("changed-shadow-color", this.shadowColor);
    }
    if (
      styles?.backgroundColor !== undefined &&
      styles?.backgroundColor != this.backgroundColor
    ) {
      this.backgroundColor = styles?.backgroundColor;
      this.emitter.emit("changed-background-color", this.backgroundColor);
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
