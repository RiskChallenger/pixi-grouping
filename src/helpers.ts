import { Container, DisplayObject, Point } from "pixi.js";

export function distanceBetweenPoints(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

// Code inspired by pixi-discord
// https://discord.com/channels/734147990985375826/1153692570577285240
export function moveToNewParent(
  target: DisplayObject,
  newParent: Container
): void {
  target.getBounds();
  newParent.getBounds();
  const toParentMatrix = newParent.transform.worldTransform
    .clone()
    .invert()
    .append(target.worldTransform);
  target.transform.setFromMatrix(toParentMatrix);
}
