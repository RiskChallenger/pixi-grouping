import { Rectangle } from "pixi.js";

export type Corners = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function getCornersFromBounds(bounds: Rectangle): Corners {
  return {
    left: bounds.x,
    top: bounds.y,
    right: bounds.x + bounds.width,
    bottom: bounds.y + bounds.height,
  };
}
