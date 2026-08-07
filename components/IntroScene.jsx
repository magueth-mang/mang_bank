"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { S } from "../lib/style";

// Zone cliquable de la carte, en fraction de l'image source (object-fit: cover).
const BOX = { x0: 0.335, x1: 0.675, y0: 0.155, y1: 0.845 };
const IMG_RATIO = 2560 / 1440;
const REVEAL_RADIUS = 170;
const HOT_RADIUS = 260;

export default function IntroScene() {
  const router = useRouter();
  const stage = useRef(null);
  const lit = useRef(null);
  const dot = useRef(null);
  const overlay = useRef(null);
  const video = useRef(null);
  const flash = useRef(null);
  const s = useRef({ tx: -600, ty: -600, cx: -600, cy: -600, hot: 0, vis: 0, last: 0, over: false, inside: false, playing: false, done: false });

  const hit = (e) => {
    const el = stage.current;
    if (!el) return false;
    const r = el.getBoundingClientRect();
    let vw = r.width, vh = r.height, ox = 0, oy = 0;
    if (r.width / r.height > IMG_RATIO) { vh = r.width / IMG_RATIO; oy = (r.height - vh) / 2; }
    else { vw = r.height * IMG_RATIO; ox = (r.width - vw) / 2; }
    const fx = (e.clientX - r.left - ox) / vw;
    const fy = (e.clientY - r.top - oy) / vh;
    return fx > BOX.x0 && fx < BOX.x1 && fy > BOX.y0 && fy < BOX.y1;
  };

  useEffect(() => {
    let raf = 0;
    const tick = (now) => {
      const v = s.current;
      const dt = Math.min(60, v.last ? now - v.last : 16);
      v.last = now;
      if (!v.playing && dot.current && lit.current) {
        const kp = 1 - Math.pow(1e-9, dt / 1000);
        v.cx += (v.tx - v.cx) * kp;
        v.cy += (v.ty - v.cy) * kp;
        const kh = 1 - Math.pow(0.0009, dt / 1000);
        v.hot += ((v.over ? 1 : 0) - v.hot) * kh;
        v.vis += ((v.inside ? 1 : 0) - v.vis) * (1 - Math.pow(0.02, dt / 1000));
        const h = v.hot * v.hot * (3 - 2 * v.hot);
        const rad = REVEAL_RADIUS + (HOT_RADIUS - REVEAL_RADIUS) * h;
        const mask = "radial-gradient(circle " + rad.toFixed(1) + "px at " + v.cx.toFixed(1) + "px " + v.cy.toFixed(1) + "px, #000 0%, #000 74%, rgba(0,0,0,.55) 88%, rgba(0,0,0,0) 100%)";
        lit.current.style.webkitMaskImage = mask;
        lit.current.style.maskImage = mask;
        lit.current.style.opacity = v.vis.toFixed(3);
        dot.current.style.transform = "translate(" + v.cx.toFixed(1) + "px," + v.cy.toFixed(1) + "px) scale(" + (1 + 0.9 * h).toFixed(3) + ")";
        dot.current.style.opacity = v.vis.toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e) => {
    const v = s.current;
    if (v.playing || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    v.tx = e.clientX - r.left;
    v.ty = e.clientY - r.top;
    if (!v.inside) { v.cx = v.tx; v.cy = v.ty; }
    v.inside = true;
    v.over = hit(e);
  };

  const onLeave = () => {
    const v = s.current;
    if (v.playing) return;
    v.inside = false;
    v.over = false;
  };

  const onClick = (e) => {
    const v = s.current;
    if (v.playing || !hit(e)) return;
    v.playing = true;
    stage.current.style.cursor = "default";
    dot.current.style.transition = "opacity .3s ease";
    dot.current.style.opacity = "0";
    lit.current.style.opacity = "1";
    const mask = "radial-gradient(circle 2400px at 50% 50%, #000 0%, #000 100%)";
    lit.current.style.webkitMaskImage = mask;
    lit.current.style.maskImage = mask;
    overlay.current.style.opacity = "1";

    const el = video.current;
    el.currentTime = 0;
    const go = () => {
      try { sessionStorage.setItem("mang:flash", String(Date.now())); } catch (err) {}
      router.push("/cartes");
    };
    const finish = () => {
      if (v.done) return;
      v.done = true;
      flash.current.style.opacity = "1";
      setTimeout(go, 480);
    };
    el.addEventListener("ended", finish);
    el.play().then(() => {
      const d = el.duration && isFinite(el.duration) ? el.duration : 3.2;
      setTimeout(finish, d * 1000 + 200);
    }).catch(() => { setTimeout(finish, 900); });
  };

  return (
    <div
      ref={stage}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={S("position: relative; width: 100%; height: 100vh; min-height: 600px; overflow: hidden; background: #050506; cursor: none")}
    >
      <img src="/assets/card-off.png" alt="Carte Infinite" style={S("position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block")} />

      <img
        ref={lit}
        src="/assets/card-on.png"
        alt=""
        style={S("position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; opacity: 0; transition: opacity .5s cubic-bezier(.4,0,.2,1); -webkit-mask-image: radial-gradient(circle 190px at -500px -500px, #000 0%, rgba(0,0,0,.85) 42%, rgba(0,0,0,0) 72%); mask-image: radial-gradient(circle 190px at -500px -500px, #000 0%, rgba(0,0,0,.85) 42%, rgba(0,0,0,0) 72%)")}
      />

      <div ref={dot} style={S("position: absolute; left: 0; top: 0; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 999px; pointer-events: none; background: #ffffff; box-shadow: 0 0 12px rgba(255,255,255,.5); opacity: 0; will-change: transform, opacity")}></div>

      <div style={S("position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to bottom, rgba(5,5,6,.72) 0%, rgba(5,5,6,0) 26%, rgba(5,5,6,0) 62%, rgba(5,5,6,.8) 100%)")}></div>

      <header style={S("position: absolute; top: 0; left: 0; right: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 32px; padding: 26px 4vw; pointer-events: none")}>
        <div style={S("font-family: 'Instrument Serif', serif; font-size: 30px; letter-spacing: -0.02em; line-height: 1")}>
          mang<span style={S("color: #6e7076")}>.</span>
        </div>
        <div style={S("font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .26em; text-transform: uppercase; color: rgba(241,242,245,.42)")}>Infinite · Édition limitée</div>
      </header>

      <div style={S("position: absolute; left: 4vw; bottom: 9vh; z-index: 30; max-width: 500px; pointer-events: none; animation: riseIn .9s cubic-bezier(.16,1,.3,1) both")}>
        <h1 style={S("margin: 0; font-size: clamp(34px, 3.9vw, 58px); line-height: 1.03; letter-spacing: -0.035em; font-weight: 500; text-wrap: pretty")}>
          <em style={S("font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; color: #8d9096")}>Approchez</em>
          <br />
          pour l&apos;éveiller.
        </h1>
        <p style={S("margin: 20px 0 0; max-width: 340px; font-size: 14.5px; line-height: 1.65; color: rgba(241,242,245,.5)")}>
          Une carte en verre trempé, sertie d&apos;un contour lumineux. Passez le curseur sur la carte, puis cliquez pour entrer.
        </p>
      </div>

      <div style={S("position: absolute; right: 4vw; bottom: 9vh; z-index: 30; display: flex; align-items: center; gap: 14px; pointer-events: none; animation: riseIn .9s .12s cubic-bezier(.16,1,.3,1) both")}>
        <div style={S("width: 7px; height: 7px; border-radius: 999px; background: #cfe6ff; animation: softPulse 2.6s ease-in-out infinite")}></div>
        <div style={S("font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: .22em; text-transform: uppercase; color: rgba(241,242,245,.45)")}>Cliquez la carte</div>
      </div>

      <div ref={overlay} style={S("position: absolute; inset: 0; z-index: 60; opacity: 0; pointer-events: none; background: #050506; transition: opacity .5s ease")}>
        <video ref={video} src="/assets/card-reveal.mp4" muted playsInline preload="auto" style={S("position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block")} />
        <div ref={flash} style={S("position: absolute; inset: 0; background: #ffffff; opacity: 0; transition: opacity .55s ease")}></div>
      </div>
    </div>
  );
}
