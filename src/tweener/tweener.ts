import { useEffect } from "react";
import { default as createTree, Tree } from "functional-red-black-tree";

export type KeyframeValues = Record<string, number>;

interface Keyframe<V extends KeyframeValues> {
  offset: number;
  values: V;
}

interface Channel<V extends KeyframeValues> {
  // TODO channel should include variable interpolation functions for each value
  index: Tree<Keyframe<V>["offset"], Keyframe<V>>;
}

// Support / Builders ----------------------------------------------------------

const offsetDelta =
  <V extends KeyframeValues>(delta: number) =>
  (keyframe: Keyframe<V>): Keyframe<V> => ({
    ...keyframe,
    offset: keyframe.offset + delta,
  });

function channel<V extends KeyframeValues>(keyframes: Keyframe<V>[]) {
  const empty = createTree<Keyframe<V>["offset"], Keyframe<V>>();
  const index = keyframes.reduce(
    (accu, keyframe) => accu.insert(keyframe.offset, keyframe),
    empty
  );

  return { index };
}

function extend<T extends KeyframeValues>(values: T) {
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

// Ghosts Scene ----------------------------------------------------------------

const staged = [
  { offset: 0.0, values: { x: -(1 / 8), y: 1 / 4, eyes: 90 } },
  { offset: 0.2, values: { x: 1 / 4, y: 1 / 4, eyes: 90 } },
];

const trail = [
  { offset: 0.3, values: { x: 1 / 4, y: 1 / 4, eyes: 90 } },
  { offset: 0.4, values: { x: 3 / 4, y: 1 / 4, eyes: 90 } },
  { offset: 0.5, values: { x: 3 / 4, y: 1 / 2, eyes: 180 } },
  { offset: 0.6, values: { x: 1 / 4, y: 1 / 2, eyes: 270 } },
  { offset: 0.7, values: { x: 1 / 4, y: 3 / 4, eyes: 90 } },
];

type Color = { r: number; g: number; b: number };

const red = { r: 255, g: 13, b: 11 };
const pink = { r: 255, g: 166, b: 168 };
const cyan = { r: 147, g: 255, b: 255 };
const orange = { r: 255, g: 124, b: 12 };
const blue = { r: 60, g: 60, b: 153 };

const stagger = 1 / 24;

const vulnerable = {
  offset: 1.0,
  values: { x: 3 / 4, y: 3 / 4, eyes: 0, ...blue },
};

const ghost = (order: number, color: Color) =>
  channel(
    trail
      .map(offsetDelta(stagger * order))
      .concat(staged)
      .map(extend(color))
      .concat([extend({ x: (4 - order) / 5 })(vulnerable)])
  );

const scene = {
  blinky: ghost(0, red),
  pinky: ghost(1, pink),
  inky: ghost(2, cyan),
  clyde: ghost(3, orange),
};

// -----------------------------------------------------------------------------

// Export type safe channel keys
export type ChannelId = keyof Scene extends infer K
  ? K extends string
    ? K
    : never
  : never;

// TODO abstract out multiple scene types
type Scene = typeof scene;

type SceneState = {
  [catId in keyof Scene]: NonNullable<
    // A hack to derive tree item type
    Scene[catId]["index"]["begin"]["value"]
  >["values"];
};

// -----------------------------------------------------------------------------

function interpolateKeyframes<V extends KeyframeValues>(
  offset: number,
  keyframeA: Keyframe<V>,
  keyframeB: Keyframe<V>
): Keyframe<V> {
  const entriesInterpolated = Object.entries(keyframeA.values).map(
    ([propA, valueA]) => {
      const valueB = keyframeB.values[propA];
      const valueRange = valueB - valueA;
      const offsetRange = keyframeB.offset - keyframeA.offset;
      const offsetNormalized =
        offsetRange === 0 ? 0 : (offset - keyframeA.offset) / offsetRange;
      const interpolatedValue = valueA + valueRange * offsetNormalized;

      return [propA, interpolatedValue];
    }
  );

  return {
    offset,
    values: Object.fromEntries(entriesInterpolated),
  };
}

function interpolateChannel<V extends KeyframeValues>(
  offset: Keyframe<V>["offset"],
  channel: Channel<V>
): Keyframe<V> {
  const { index } = channel;
  const prev = index.le(offset).value || index.begin.value!;
  const next = index.gt(offset).value || index.end.value!;
  return interpolateKeyframes(offset, prev, next);
}

// Animation Loop --------------------------------------------------------------

// document scroll offset from 0.0 to 1.0
function scrollUnitState(): number {
  // scrollY in modern browsers is high precision float
  const scrollY = window.scrollY || 0;

  if (scrollY <= 0) {
    return 0;
  }

  // also a high precision float, rounded here to avoid round-off error
  const documentHeight = Math.round(
    document.documentElement.getBoundingClientRect().height || 0
  );

  const viewportHeight = document.documentElement.clientHeight;

  const offset = scrollY / (documentHeight - viewportHeight);

  return Math.max(0, Math.min(1, offset));
}

function renderScene(offset: number, scene: Scene): SceneState {
  const entrs = Object.entries(scene).map(([name, channel]) => {
    // TODO any
    const values: KeyframeValues = interpolateChannel<any>(
      offset,
      channel
    ).values;
    return [name, values];
  });

  return Object.fromEntries(entrs);
}

// ----

let offsetPrev = scrollUnitState();

function tick() {
  const offset = scrollUnitState();

  if (offset === offsetPrev) {
    requestAnimationFrame(tick);
    return;
  }

  const state = renderScene(offset, scene);

  listeners.forEach((listener) => {
    listener(state);
  });

  offsetPrev = offset;
  requestAnimationFrame(tick);
}

// Ideally you have a single animation loop per app instance.
window.addEventListener("load", tick);

// React Hooks -----------------------------------------------------------------

export type TickHook = (state: SceneState) => void;

const listeners: Set<TickHook> = new Set();

export function addListener(hook: TickHook) {
  listeners.add(hook);
  return function removeThisListener() {
    listeners.delete(hook);
  };
}

// TODO abstract out scene def from hook.

export function useGhostsAnimationState(hookFn: TickHook) {
  // TODO need useCallback?
  return useEffect(() => {
    return addListener(hookFn);
  });
}
