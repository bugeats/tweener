import { channel, extend, offsetDelta } from "./support";

export const NOOP = undefined;

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

export const scene = {
  blinky: ghost(0, red),
  pinky: ghost(1, pink),
  inky: ghost(2, cyan),
  clyde: ghost(3, orange),
};
