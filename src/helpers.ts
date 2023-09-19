import { Container, DisplayObject, Matrix, Point } from "pixi.js";

export function distanceBetweenPoints(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function kidnapChild(
  object: DisplayObject,
  newParent: Container,
  index: number = -1
): void {
  (newParent as any)._recursivePostUpdateTransform();
  const objectPivot: Point = object.pivot.clone();
  object.pivot.set(0);
  (object as any)._recursivePostUpdateTransform();
  const parentInverseWorldTransform: Matrix = newParent.worldTransform
    .clone()
    .invert();
  const objectWorldTransform: Matrix = object.worldTransform.clone();

  const tx: number =
    parentInverseWorldTransform.a * objectWorldTransform.tx +
    parentInverseWorldTransform.c * objectWorldTransform.ty +
    parentInverseWorldTransform.tx;
  const ty: number =
    parentInverseWorldTransform.b * objectWorldTransform.tx +
    parentInverseWorldTransform.d * objectWorldTransform.ty +
    parentInverseWorldTransform.ty;

  if (index != -1) {
    newParent.addChildAt(object, index);
  } else {
    newParent.addChild(object);
  }

  object.pivot.set(objectPivot.x, objectPivot.y);
  object.position.set(tx, ty);
}
