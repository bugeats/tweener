import { default as createTree } from "functional-red-black-tree";

export type KeyframeValues = Record<string, number>;

interface Keyframe<V extends KeyframeValues> {
  offset: number;
  values: V;
}

export function channel<V extends KeyframeValues>(tweens: Keyframe<V>[]) {
  const tree = createTree<Keyframe<V>["offset"], Keyframe<V>>();
  return tweens.reduce((accu, tween) => accu.insert(tween.offset, tween), tree);
}

export function extend<T extends KeyframeValues>(values: T) {
  return function <U extends KeyframeValues>(
    source: Keyframe<U>
  ): Keyframe<T & U> {
    return {
      ...source,
      values: {
        ...source.values,
        ...values,
      },
    };
  };
}

export const offsetDelta =
  <V extends KeyframeValues>(delta: number) =>
  (keyframe: Keyframe<V>): Keyframe<V> => ({
    ...keyframe,
    offset: keyframe.offset + delta,
  });

function interpolateTween<V extends KeyframeValues>(
  offset: number,
  tweenA: Keyframe<V>,
  tweenB: Keyframe<V>
): Keyframe<V> {
  const entriesInterpolated = Object.entries(tweenA.values).map(
    ([propA, valueA]) => {
      const valueB = tweenB.values[propA];
      const valueRange = valueB - valueA;
      const offsetRange = tweenB.offset - tweenA.offset;
      const offsetNormalized =
        offsetRange === 0 ? 0 : (offset - tweenA.offset) / offsetRange;
      const interpolatedValue = valueA + valueRange * offsetNormalized;

      return [propA, interpolatedValue];
    }
  );

  return {
    offset,
    values: Object.fromEntries(entriesInterpolated),
  };
}

type TweenTree<V extends KeyframeValues> = createTree.Tree<
  Keyframe<V>["offset"],
  Keyframe<V>
>;

export function interpolateTree<V extends KeyframeValues>(
  offset: Keyframe<V>["offset"],
  tree: TweenTree<V>
): Keyframe<V> {
  const prev = tree.le(offset).value || tree.begin.value!;
  const next = tree.gt(offset).value || tree.end.value!;
  return interpolateTween(offset, prev, next);
}
