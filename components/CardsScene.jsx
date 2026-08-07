"use client";

import { useEffect, useRef, useState } from "react";
import Engine from "../lib/cardsEngine";
import { S } from "../lib/style";

const mono = "font-family: 'JetBrains Mono', monospace; ";

export default function CardsScene() {
  const [, setTick] = useState(0);
  const engineRef = useRef(null);
  const notify = useRef(() => {});
  notify.current = () => setTick((t) => t + 1);
  if (!engineRef.current) engineRef.current = new Engine({}, () => notify.current());
  const engine = engineRef.current;

  useEffect(() => {
    let on = false;
    try {
      on = !!sessionStorage.getItem("mang:flash");
      sessionStorage.removeItem("mang:flash");
    } catch (e) {}
    if (on) {
      const d = document.createElement("div");
      d.style.cssText = "position:fixed;inset:0;z-index:9999;background:#ffffff;opacity:1;pointer-events:none;transition:opacity 1.5s cubic-bezier(.4,0,.2,1)";
      document.body.appendChild(d);
      window.__mangFlash = d;
    }
    engine.componentDidMount();
    return () => {
      engine.componentWillUnmount();
      const d = window.__mangFlash;
      if (d && d.parentNode) d.parentNode.removeChild(d);
      window.__mangFlash = null;
    };
  }, [engine]);

  const v = engine.renderVals();

  return (
    <div data-screen-label="Hero" style={S("position: relative; width: 100%; height: 100vh; min-height: 640px; overflow: hidden; background: #06070a")}>
      <div style={S("position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none")}>
        <div style={S("font-family: 'Instrument Serif', serif; font-style: italic; font-size: 33vw; line-height: .8; letter-spacing: -0.045em; color: rgba(255,255,255,.04); user-select: none; white-space: nowrap")}>mang</div>
      </div>
      <div style={S("position: absolute; inset: 0; pointer-events: none; background: radial-gradient(115% 75% at 50% 46%, rgba(255,255,255,.055) 0%, rgba(6,7,10,0) 62%)")}></div>

      <canvas ref={v.setCanvas} style={S("position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 10")}></canvas>

      <div ref={v.setDot} style={S("position: fixed; left: 0; top: 0; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 999px; z-index: 9998; pointer-events: none; background: #ffffff; box-shadow: 0 0 12px rgba(255,255,255,.5); opacity: 0; will-change: transform, opacity")}></div>

      <div style={S("position: absolute; top: 0; left: 0; right: 0; height: 160px; z-index: 50; pointer-events: none; background: linear-gradient(to bottom, #06070a 0%, rgba(6,7,10,.86) 42%, rgba(6,7,10,0) 100%)")}></div>

      {v.open ? (
        <div style={S("position: fixed; left: 0; top: 0; height: 100vh; max-height: 100vh; width: min(46vw, 520px); z-index: 55; display: flex; flex-direction: column; justify-content: center; gap: clamp(14px, 3vh, 34px); padding: 104px 4vw 28px; overflow-y: auto; overscroll-behavior: contain; animation: panelIn .72s cubic-bezier(.16,1,.3,1) both")}>
          <div style={S("display: flex; flex-direction: column; gap: 10px")}>
            <div style={S(mono + "font-size: 9.5px; letter-spacing: .26em; text-transform: uppercase; color: rgba(241,242,245,.4)")}>Personnalisation · {v.cardTier}</div>
            <h2 style={S("margin: 0; font-size: clamp(28px, 3vw, 42px); line-height: 1.04; letter-spacing: -0.035em; font-weight: 500")}>
              Composez<br />
              <em style={S("font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; color: #8d9096")}>votre</em> carte.
            </h2>
          </div>

          <div style={S("display: flex; flex-direction: column; gap: 12px")}>
            <div style={S("display: flex; align-items: baseline; gap: 12px")}>
              <div style={S(mono + "font-size: 9px; letter-spacing: .22em; text-transform: uppercase; color: rgba(241,242,245,.35)")}>Finition</div>
              <div style={S("font-size: 12px; color: rgba(241,242,245,.75)")}>{v.texName}</div>
            </div>
            <div style={S("display: flex; flex-wrap: wrap; gap: 10px")}>
              {v.textures.map((t, i) => (
                <div
                  key={i}
                  className="swatch"
                  onClick={t.pick}
                  title={t.label}
                  style={Object.assign(
                    S("position: relative; width: 58px; height: 44px; border-radius: 11px; overflow: hidden; cursor: pointer; transition: opacity .25s ease, transform .25s cubic-bezier(.16,1,.3,1)"),
                    { border: t.ring, opacity: t.dim }
                  )}
                >
                  <div ref={t.mount} style={S("position: absolute; inset: 0")}></div>
                </div>
              ))}
            </div>
          </div>

          <div style={S("display: flex; flex-direction: column; gap: 12px")}>
            <div style={S("display: flex; align-items: baseline; gap: 12px")}>
              <div style={S(mono + "font-size: 9px; letter-spacing: .22em; text-transform: uppercase; color: rgba(241,242,245,.35)")}>Motif gravé</div>
              <div style={S("font-size: 12px; color: rgba(241,242,245,.75)")}>{v.patName}</div>
            </div>
            <div style={S("display: flex; flex-wrap: wrap; gap: 10px")}>
              {v.patterns.map((p) => (
                <div
                  key={p.key}
                  className="swatch"
                  onClick={p.pick}
                  title={p.label}
                  style={Object.assign(
                    S("position: relative; display: grid; place-items: center; width: 58px; height: 44px; border-radius: 11px; overflow: hidden; cursor: pointer; background: #17171a; transition: opacity .25s ease, transform .25s cubic-bezier(.16,1,.3,1)"),
                    { border: p.ring, opacity: p.dim }
                  )}
                >
                  <div ref={p.mount} style={S("position: absolute; inset: 0")}></div>
                  {p.none ? <div style={S("position: relative; width: 18px; height: 1px; background: rgba(255,255,255,.45); transform: rotate(-32deg)")}></div> : null}
                </div>
              ))}
            </div>
          </div>

          <div style={S("display: flex; flex-direction: column; gap: 12px")}>
            <div style={S(mono + "font-size: 9px; letter-spacing: .22em; text-transform: uppercase; color: rgba(241,242,245,.35)")}>Gravure</div>
            <div style={S("display: flex; align-items: center; gap: 14px; padding: 6px 18px; border-radius: 14px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.03)")}>
              <input
                value={v.name}
                onChange={v.onName}
                maxLength={26}
                placeholder="VOTRE NOM"
                style={S("flex: 1; min-width: 0; padding: 12px 0; border: 0; outline: none; background: transparent; " + mono + "font-size: 13px; letter-spacing: .12em; color: rgba(241,242,245,.95); text-transform: uppercase")}
              />
              <span style={S(mono + "font-size: 9px; letter-spacing: .18em; color: rgba(241,242,245,.3)")}>26 max</span>
            </div>
          </div>

          <div style={S("display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 4px")}>
            <div className="hoverWhite" onClick={v.toggleFlip} style={S("display: inline-flex; align-items: center; white-space: nowrap; padding: 14px 24px; border-radius: 999px; background: #f1f2f5; color: #06070a; font-size: 13.5px; font-weight: 600; cursor: pointer")}>{v.flipLabel}</div>
            <div className="hoverOutline" onClick={v.order} style={S("display: inline-flex; align-items: center; white-space: nowrap; padding: 14px 24px; border-radius: 999px; border: 1px solid rgba(255,255,255,.28); font-size: 13.5px; font-weight: 600; color: rgba(241,242,245,.95); cursor: pointer")}>Commander</div>
            <div className="hoverGhost" onClick={v.close} style={S("display: inline-flex; align-items: center; white-space: nowrap; padding: 14px 20px; border-radius: 999px; border: 1px solid rgba(255,255,255,.16); font-size: 13.5px; color: rgba(241,242,245,.7); cursor: pointer")}>Retour</div>
          </div>
        </div>
      ) : null}

      <header style={S("position: absolute; top: 0; left: 0; right: 0; z-index: 60; display: flex; align-items: center; justify-content: space-between; gap: 32px; padding: 26px 4vw")}>
        <div style={S("font-family: 'Instrument Serif', serif; font-size: 30px; letter-spacing: -0.02em; line-height: 1")}>
          mang<span style={S("color: #6e7076")}>.</span>
        </div>
        <nav style={S("display: flex; gap: 34px; font-size: 13.5px; color: rgba(241,242,245,.62)")}>
          <a className="navlink" href="#" style={S("color: inherit")}>Cartes</a>
          <a className="navlink" href="#" style={S("color: inherit")}>Comptes</a>
          <a className="navlink" href="#" style={S("color: inherit")}>Épargne</a>
          <a className="navlink" href="#" style={S("color: inherit")}>Aide</a>
        </nav>
        <a className="hoverWhite" href="#" style={S("display: inline-flex; align-items: center; padding: 12px 22px; border-radius: 999px; background: #f1f2f5; color: #06070a; font-size: 13.5px; font-weight: 600; letter-spacing: -0.01em")}>Commander une carte</a>
      </header>

      {v.ordering ? (
        <div style={S("position: absolute; left: 4vw; top: 50%; transform: translateY(-50%); z-index: 46; max-width: min(30vw, 360px); pointer-events: none; animation: msgIn .8s .25s cubic-bezier(.16,1,.3,1) both")}>
          <div style={S(mono + "font-size: 9.5px; letter-spacing: .26em; text-transform: uppercase; color: rgba(241,242,245,.4)")}>Terminal mang · TPE-04</div>
          <h2 style={S("margin: 14px 0 0; font-size: clamp(26px, 2.7vw, 38px); line-height: 1.05; letter-spacing: -0.035em; font-weight: 500")}>{v.orderTitle}</h2>
          <p style={S("margin: 16px 0 0; max-width: 280px; font-size: 14px; line-height: 1.65; color: rgba(241,242,245,.5)")}>{v.orderSub}</p>
          {v.done ? (
            <div className="hoverWhite" onClick={v.reset} style={S("display: inline-flex; align-items: center; margin-top: 26px; padding: 14px 24px; border-radius: 999px; background: #f1f2f5; color: #06070a; font-size: 13.5px; font-weight: 600; cursor: pointer; pointer-events: auto")}>Retour aux cartes</div>
          ) : null}
        </div>
      ) : null}

      {v.closed ? (
        <div style={S("position: absolute; left: 4vw; bottom: 9vh; z-index: 40; max-width: 620px; pointer-events: none; animation: fadeIn .6s ease both")}>
          <h1 style={S("margin: 0; font-size: clamp(38px, 4.3vw, 64px); line-height: 1.02; letter-spacing: -0.035em; font-weight: 500; text-wrap: pretty")}>
            <em style={S("font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; color: #8d9096")}>Plus</em> qu&apos;une carte.<br />
            Une banque qui suit<br />
            votre rythme.
          </h1>
          <p style={S("margin: 22px 0 0; max-width: 390px; font-size: 14.5px; line-height: 1.65; color: rgba(241,242,245,.55)")}>
            Compte, carte et épargne dans une même application. Ouverture en 8 minutes, sans agence, sans engagement.
          </p>
        </div>
      ) : null}

      <div style={S("position: absolute; right: 4vw; bottom: 9vh; z-index: 40; display: flex; align-items: flex-end; gap: 20px; pointer-events: none")}>
        <div style={S(mono + "font-size: 9.5px; line-height: 1.7; letter-spacing: .13em; text-transform: uppercase; color: rgba(241,242,245,.4); text-align: right")}>
          Cliquez une carte<br />pour la personnaliser
        </div>
        <div style={S("font-family: 'Instrument Serif', serif; font-size: 26px; line-height: 1; color: rgba(241,242,245,.5)")}>
          m<span style={S("color: #6e7076")}>.</span>
        </div>
      </div>
    </div>
  );
}
