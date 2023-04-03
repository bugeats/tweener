import { useEffect } from "react";
import { scrollUnitState } from "./browser";

import { scene } from "./scene";
import { interpolateTree, KeyframeValues } from "./support";

// -----------------------------------------------------------------------------

export type ChannelId = keyof Scene extends infer K
  ? K extends string
    ? K
    : never
  : never;

type Scene = typeof scene;

type SceneState = {
  [Property in keyof Scene]: NonNullable<
    Scene[Property]["begin"]["value"]
  >["values"];
};

function renderScene(offset: number, scene: Scene): SceneState {
  const entrs = Object.entries(scene).map(([name, tree]) => {
    // TODO any
    const values: KeyframeValues = interpolateTree<any>(offset, tree).values;
    return [name, values];
  });

  return Object.fromEntries(entrs);
}

// -----------------------------------------------------------------------------

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

window.addEventListener("load", tick);

// -----------------------------------------------------------------------------

export type TickHook = (state: SceneState) => void;

const listeners: Set<TickHook> = new Set();

export function addListener(hook: TickHook) {
  listeners.add(hook);
  return function removeThisListener() {
    listeners.delete(hook);
  };
}

export function useTweenerTick(hookFn: TickHook) {
  // TODO need useCallback?
  return useEffect(() => {
    return addListener(hookFn);
  });
}
