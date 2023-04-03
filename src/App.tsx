import React, { useRef } from "react";
import "./App.css";
import { ChannelId, useTweenerTick } from "./tweener";

function App() {
  return (
    <div className="App">
      <Scene />
      <section />
    </div>
  );
}

// -----------------------------------------------------------------------------

function Scene() {
  return (
    <div className="Scene">
      <Ghost channelId={"clyde"} />
      <Ghost channelId={"inky"} />
      <Ghost channelId={"pinky"} />
      <Ghost channelId={"blinky"} />
    </div>
  );
}

// -----------------------------------------------------------------------------

function Ghost({ channelId }: { channelId: ChannelId }) {
  const containerEl = useRef(document.createElement("div"));
  const eyeLeftEl = useRef(document.createElement("div"));
  const eyeRightEl = useRef(document.createElement("div"));

  useTweenerTick((state) => {
    const vals = state[channelId];

    containerEl.current.style.display = "block"; // unhide

    containerEl.current.style.transform = `translateX(${
      vals.x * 100
    }vw) translateY(${vals.y * 100}vh)`;

    containerEl.current.style.backgroundColor = `rgb(${vals.r}, ${vals.g}, ${vals.b})`;

    eyeLeftEl.current.style.transform = `rotate(${vals.eyes}deg)`;
    eyeRightEl.current.style.transform = `rotate(${vals.eyes}deg)`;
  });

  return (
    <div ref={containerEl} className={`Ghost Ghost-${channelId}`}>
      <div ref={eyeLeftEl} className="eye left" />
      <div ref={eyeRightEl} className="eye right" />
    </div>
  );
}

// -----------------------------------------------------------------------------

export default App;
