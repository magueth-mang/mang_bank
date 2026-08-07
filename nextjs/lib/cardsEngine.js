// Moteur three.js de la scène cartes + terminal.
// Porté depuis la maquette : logique inchangée, découplée de React.

class DCLogic {
  constructor(props, onChange) {
    this.props = props || {};
    this.state = {};
    this._onChange = onChange || null;
  }
  setState(update) {
    const patch = typeof update === "function" ? update(this.state) : update;
    this.state = Object.assign({}, this.state, patch);
    if (this._onChange) this._onChange();
  }
  forceUpdate() { if (this._onChange) this._onChange(); }
}

class Component extends DCLogic {
  setCanvas = (el) => { this.canvas = el; };
  setDot = (el) => { this.dot = el; };
  setRing = (el) => { this.ring = el; };

  CARDS = [
    { tier: "Infinite", num: "4732 1180 6641 0293", name: "Camille Ferrand", exp: "04/29", cvv: "418", sign: "C. Ferrand", a: "#0c0c0e", b: "#1c1c20", c: "#33343a" },
    { tier: "Infinite", num: "5218 4409 7732 6108", name: "Malik Bouchard", exp: "11/28", cvv: "907", sign: "M. Bouchard", a: "#0a0a0c", b: "#18181c", c: "#2c2d33" },
    { tier: "Infinite", num: "4910 7756 0021 8834", name: "Élise Navarro", exp: "07/30", cvv: "253", sign: "É. Navarro", a: "#0e0e11", b: "#212126", c: "#3a3b42" },
    { tier: "Infinite", num: "4732 2087 1194 5560", name: "Théo Lambert", exp: "02/29", cvv: "641", sign: "T. Lambert", a: "#0b0b0d", b: "#1a1a1e", c: "#303137" },
    { tier: "Infinite", num: "5218 6612 3390 7745", name: "Nora Delacroix", exp: "09/29", cvv: "380", sign: "N. Delacroix", a: "#0d0d10", b: "#1f1f24", c: "#36373e" },
    { tier: "Infinite", num: "4910 3348 5027 1962", name: "Adrien Sauvage", exp: "05/30", cvv: "176", sign: "A. Sauvage", a: "#090909", b: "#17171a", c: "#2a2b30" },
    { tier: "Infinite", num: "4732 9051 4478 2216", name: "Inès Vasseur", exp: "12/28", cvv: "529", sign: "I. Vasseur", a: "#0f0f12", b: "#232328", c: "#3d3e45" },
    { tier: "Infinite", num: "5218 1174 8802 3037", name: "Yanis Moreau", exp: "03/29", cvv: "834", sign: "Y. Moreau", a: "#08080a", b: "#151518", c: "#27282d" }
  ];

  VIDEOS = [
    "/textures/card-1.mp4",
    "/textures/card-2.mp4",
    "/textures/card-3.mp4",
    "/textures/card-4.mp4",
    "/textures/card-5.mp4",
    "/textures/card-6.mp4",
    "/textures/card-7.mp4",
    "/textures/card-8.mp4",
    "/textures/card-9.mp4"
  ];
  TEX_NAMES = ["Onyx", "Hexagone", "Aurore", "Cuivre", "Prisme", "Silice", "Nébuleuse", "Basalte", "Mirage"];

  GAP = 2.05;
  offset = 0;
  target = 0;
  last = 0;

  async componentDidMount() {
    this.mounted = true;
    try { await document.fonts.ready; } catch (e) {}
    const THREE = await import("three");
    if (!this.mounted || !this.canvas) return;
    this.THREE = THREE;

    const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.2);
    this.camera = camera;

    const W = 2.72, H = 1.71, D = 0.022, R = 0.14;
    const shape = new THREE.Shape();
    const hw = W / 2, hh = H / 2;
    shape.moveTo(-hw + R, -hh);
    shape.lineTo(hw - R, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + R);
    shape.lineTo(hw, hh - R);
    shape.quadraticCurveTo(hw, hh, hw - R, hh);
    shape.lineTo(-hw + R, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - R);
    shape.lineTo(-hw, -hh + R);
    shape.quadraticCurveTo(-hw, -hh, -hw + R, -hh);

    const capGeo = new THREE.ShapeGeometry(shape, 14);
    const pos = capGeo.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) + hw) / W;
      uv[i * 2 + 1] = (pos.getY(i) + hh) / H;
    }
    capGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));

    const sideGeo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false, curveSegments: 14 });
    sideGeo.translate(0, 0, -D / 2);

    this.PAL = [
      ["#12021e", "#6a1bb0", "#c62bd8", "#ff5ea8"],
      ["#02121e", "#0b4f9e", "#1f9be0", "#6ee7ff"],
      ["#1a0603", "#8a2c08", "#e2661a", "#ffc46b"],
      ["#0b0216", "#3a1b8c", "#8f6ae0", "#e2d4ff"],
      ["#02140f", "#0c5c46", "#1fae7a", "#a8f5cf"],
      ["#160212", "#7a0f52", "#d92a7a", "#ff9ec7"],
      ["#0a0a0c", "#26262d", "#4a4b55", "#b9bcc4"],
      ["#141002", "#6b5203", "#d2a10c", "#ffe89a"]
    ];
    this.PATTERNS = ["none", "flora", "waves", "guilloche", "palm"];
    this.PAT_NAMES = ["Aucune", "Flore", "Ondes", "Guilloché", "Palmes"];
    this.patTex = {};
    this.patThumb = {};
    this.PATTERNS.forEach((k) => {
      if (k === "none") return;
      const cv = this.makePattern(k);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      this.patTex[k] = t;
      this.patThumb[k] = cv.toDataURL("image/png");
    });

    this.anims = this.CARDS.map((d, i) => this.makeAnim(this.PAL[i % this.PAL.length]));
    this.vids = this.VIDEOS.map((src) => this.makeVideo(src));
    this.stills = this.VIDEOS.map(() => null);

    this.groups = this.CARDS.map((d, i) => {
      const g = new THREE.Group();
      const face = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, side: THREE.FrontSide });
      const side = new THREE.Mesh(sideGeo, [
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
        new THREE.MeshBasicMaterial({ color: 0x2a2b30, transparent: true })
      ]);
      const dim = this.props.videoDim ?? 1;
      const base = new THREE.Mesh(capGeo, face(this.anims[i].tex));
      base.material.color = new THREE.Color().setScalar(dim);
      base.position.z = D / 2 + 0.0006;
      base.userData.vid = this.vids[i % this.vids.length];
      base.userData.still = this.stills[i % this.stills.length];
      base.userData.fallback = this.anims[i].tex;
      const overlay = new THREE.Mesh(capGeo, face(this.tex(d, false, false, true)));
      overlay.position.z = D / 2 + 0.0016;
      const backBase = new THREE.Mesh(capGeo, face(this.anims[i].tex));
      backBase.material.color = new THREE.Color().setScalar(dim);
      backBase.position.z = -D / 2 - 0.0006;
      backBase.rotation.x = Math.PI;
      backBase.userData.vid = base.userData.vid;
      backBase.userData.still = base.userData.still;
      backBase.userData.fallback = base.userData.fallback;
      const back = new THREE.Mesh(capGeo, face(this.tex(d, true, false, true)));
      back.position.z = -D / 2 - 0.0016;
      back.rotation.x = Math.PI;
      const pat = new THREE.Mesh(capGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      pat.position.z = D / 2 + 0.0012;
      pat.userData.opBase = 0;
      const patBack = new THREE.Mesh(capGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      patBack.position.z = -D / 2 - 0.0012;
      patBack.rotation.x = Math.PI;
      patBack.userData.opBase = 0;
      g.add(side, base, overlay, backBase, back, pat, patBack);
      g.userData.pat = "none";
      g.userData.px = (Math.random() * 2 - 1);
      g.userData.py = (Math.random() * 2 - 1);
      g.userData.pz = (Math.random() * 2 - 1);
      scene.add(g);
      return g;
    });
    this.span = this.CARDS.length * this.GAP;
    this.buildTPE();

    this.onResize = () => {
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 1.1 ? 9 : 7.2;
      camera.updateProjectionMatrix();
    };
    this.onResize();
    window.addEventListener("resize", this.onResize);

    this.ray = new THREE.Raycaster();
    this.onClick = (e) => {
      if (this.state.phase) {
        if (!this.keys || !this.keys.length) return;
        const rk = this.canvas.getBoundingClientRect();
        const pk = new THREE.Vector2(((e.clientX - rk.left) / rk.width) * 2 - 1, -((e.clientY - rk.top) / rk.height) * 2 + 1);
        this.ray.setFromCamera(pk, camera);
        const hk = this.ray.intersectObjects(this.keys.map((k2) => k2.cap).concat(this.keys.map((k2) => k2.body)), false);
        if (!hk.length) return;
        const rec = this.keys.find((k2) => k2.cap === hk[0].object || k2.body === hk[0].object);
        if (!rec) return;
        rec.press = 1;
        this.hitKey(rec);
        return;
      }
      if (this.state.sel !== null) {
        const rr = this.canvas.getBoundingClientRect();
        const pp = new THREE.Vector2(((e.clientX - rr.left) / rr.width) * 2 - 1, -((e.clientY - rr.top) / rr.height) * 2 + 1);
        this.ray.setFromCamera(pp, camera);
        const h2 = this.ray.intersectObjects([this.groups[this.state.sel]], true);
        if (h2.length) this.setState((s) => ({ flip: !s.flip }));
        return;
      }
      const r = this.canvas.getBoundingClientRect();
      const p = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.ray.setFromCamera(p, camera);
      const hits = this.ray.intersectObjects(this.groups, true);
      if (!hits.length) return;
      let g = hits[0].object;
      while (g && g.parent !== scene) g = g.parent;
      const i = this.groups.indexOf(g);
      if (i < 0) return;
      const half = this.span / 2;
      let y = (i * this.GAP - this.offset + half) % this.span;
      if (y < 0) y += this.span;
      y -= half;
      this.target = this.offset + y;
      this.setState({ sel: i, flip: false, name: this.CARDS[i].name, tex: i % this.vids.length, pat: this.groups[i].userData.pat || "none" });
    };
    this.close = () => { this.setState({ sel: null, flip: false }); };
    this.toggleFlip = () => { this.setState((s) => ({ flip: !s.flip })); };
    this.pickTex = (n) => {
      const i = this.state.sel;
      if (i === null) return;
      const rec = this.vids[n];
      const g = this.groups[i];
      g.children[1].userData.vid = rec;
      g.children[3].userData.vid = rec;
      if (rec.ok) {
        g.children[1].material.map = rec.tex;
        g.children[1].material.needsUpdate = true;
        g.children[3].material.map = rec.tex;
        g.children[3].material.needsUpdate = true;
      }
      this.setState({ tex: n });
    };
    this.beep = (kind) => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        if (!this.actx) this.actx = new AC();
        const a = this.actx;
        if (a.state === "suspended") a.resume();
        const seq = kind === "ok" ? [[880, 0], [1320, 0.09]]
          : kind === "no" ? [[300, 0]]
          : kind === "insert" ? [[520, 0], [700, 0.07]]
          : kind === "done" ? [[784, 0], [1046, 0.1], [1318, 0.2]]
          : [[1180, 0]];
        seq.forEach(([f, at]) => {
          const t0 = a.currentTime + at;
          const o = a.createOscillator();
          const g2 = a.createGain();
          o.type = "square";
          o.frequency.setValueAtTime(f, t0);
          g2.gain.setValueAtTime(0.0001, t0);
          g2.gain.exponentialRampToValueAtTime(kind === "no" ? 0.05 : 0.035, t0 + 0.008);
          const dur = kind === "no" ? 0.16 : 0.075;
          g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
          g2.gain.linearRampToValueAtTime(0, t0 + dur + 0.01);
          o.connect(g2).connect(a.destination);
          o.start(t0);
          o.stop(t0 + dur + 0.02);
          this.oscs = this.oscs || [];
          this.oscs.push(o);
          o.onended = () => {
            try { o.disconnect(); g2.disconnect(); } catch (er) {}
            if (this.oscs) this.oscs = this.oscs.filter((z) => z !== o);
          };
        });
      } catch (e) {}
    };
    this.order = () => {
      if (this.state.sel === null || this.state.phase) return;
      this.setState({ phase: "travel", flip: false });
      clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3);
      this.setState({ pin: "" });
      this.t1 = setTimeout(() => { this.beep("insert"); this.setState({ phase: "insert" }); }, 1150);
      this.t2 = setTimeout(() => { this.beep("key"); this.setState({ phase: "pin" }); }, 2450);
    };
    this.hitKey = (rec) => {
      const ph = this.state.phase;
      this.beep(rec.kind === "ok" ? "ok" : rec.kind === "no" ? "no" : "key");
      if (rec.kind === "num") {
        if (ph !== "pin") return;
        const pin = (this.state.pin || "");
        if (pin.length >= 4) return;
        this.setState({ pin: pin + rec.label });
      } else if (rec.kind === "no") {
        if (ph === "done") { this.reset(); return; }
        if (ph !== "pin") return;
        const pin = (this.state.pin || "");
        if (pin.length) this.setState({ pin: pin.slice(0, -1) });
        else this.reset();
      } else {
        if (ph === "done") { this.reset(); return; }
        if (ph !== "pin" || (this.state.pin || "").length !== 4) { this.pinErr = 1; return; }
        this.setState({ phase: "reading" });
        clearTimeout(this.t3);
        this.t3 = setTimeout(() => { this.beep("done"); this.setState({ phase: "done" }); }, 1500);
      }
    };
    this.stopBeeps = () => {
      (this.oscs || []).forEach((o) => { try { o.stop(); o.disconnect(); } catch (e) {} });
      this.oscs = [];
    };
    this.reset = () => {
      clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3); clearTimeout(this.t4);
      this.stopBeeps();
      this.setState({ phase: null, sel: null, flip: false, pin: "" });
    };
    this.pickPat = (kind) => {
      const i = this.state.sel;
      if (i === null) return;
      this.applyPat(i, kind);
      this.setState({ pat: kind });
    };

    this.onName = (e) => {
      const v = e.target.value.slice(0, 26);
      const i = this.state.sel;
      this.setState({ name: v });
      if (i === null) return;
      const d = this.CARDS[i];
      d.name = v;
      const mesh = this.groups[i].children[4];
      const old = mesh.material.map;
      mesh.material.map = this.tex(d, true, false, true);
      mesh.material.needsUpdate = true;
      if (old) old.dispose();
    };
    this.canvas.addEventListener("click", this.onClick);

    this.onWheel = (e) => { if (this.state.sel !== null) { e.preventDefault(); return; } e.preventDefault(); this.target += e.deltaY * 0.0014 * (this.props.scrollGain ?? 1); };
    this.onKey = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") this.target += this.GAP;
      if (e.key === "ArrowUp" || e.key === "PageUp") this.target -= this.GAP;
    };
    this.onTouchStart = (e) => { this.ty = e.touches[0].clientY; };
    this.onTouchMove = (e) => {
      const y = e.touches[0].clientY;
      this.target += (this.ty - y) * 0.005;
      this.ty = y;
      e.preventDefault();
    };
    this.onPointer = (e) => {
      this.px = e.clientX;
      this.py = e.clientY;
      this.inside = true;
      const r2 = this.canvas.getBoundingClientRect();
      this.mx = ((e.clientX - r2.left) / r2.width) * 2 - 1;
      this.my = ((e.clientY - r2.top) / r2.height) * 2 - 1;
      const now = performance.now();
      if (now - (this.lastHover || 0) < 70) return;
      this.lastHover = now;
      const p2 = new THREE.Vector2(this.mx, -this.my);
      this.ray.setFromCamera(p2, camera);
      let hot = false;
      if (this.state.phase) {
        if (this.keys && this.keys.length) {
          const targets = this.keys.map((k2) => k2.cap).concat(this.keys.map((k2) => k2.body));
          hot = this.ray.intersectObjects(targets, false).length > 0;
        }
      } else if (this.state.sel !== null) {
        hot = this.ray.intersectObjects([this.groups[this.state.sel]], true).length > 0;
      } else {
        hot = this.ray.intersectObjects(this.groups, true).length > 0;
      }
      this.hot = hot;
    };
    this.onDomHover = (e) => {
      const t2 = e.target;
      this.domHot = !!(t2 && t2.closest && t2.closest('a,input,[onclick],[style*="cursor: pointer"],[style*="cursor:pointer"]'));
    };
    window.addEventListener("pointerover", this.onDomHover, { passive: true });
    this.onDocLeave = () => { this.inside = false; };
    document.addEventListener("pointerleave", this.onDocLeave);
    window.addEventListener("pointermove", this.onPointer, { passive: true });
    window.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("touchstart", this.onTouchStart, { passive: true });
    window.addEventListener("touchmove", this.onTouchMove, { passive: false });

    this.loop = (t) => {
      const dt = Math.min(50, this.last ? t - this.last : 16);
      this.last = t;
      const open = this.state.sel !== null;
      if (!open) this.target += (this.props.idleDrift ?? 0.1) * dt / 1000;
      this.offset += (this.target - this.offset) * (1 - Math.pow(0.0022, dt / 1000));
      const k = 1 - Math.pow(0.006, dt / 1000);
      this.sel = (this.sel || 0) + ((open ? 1 : 0) - (this.sel || 0)) * k;
      if (this.sel < 0.0008) this.sel = 0;
      const f = this.sel * this.sel * (3 - 2 * this.sel);
      const zBase = this.canvas.clientWidth / this.canvas.clientHeight < 1.1 ? 9 : 7.2;
      this.look = this.look || new THREE.Vector3(0, 0, 0);
      this.flipT = (this.flipT || 0) + ((this.state.flip ? 1 : 0) - (this.flipT || 0)) * (1 - Math.pow(0.004, dt / 1000));

      const ph = this.state.phase;
      this.ordT = (this.ordT || 0) + ((ph ? 1 : 0) - (this.ordT || 0)) * (1 - Math.pow(ph ? 0.13 : 0.004, dt / 1000));
      if (this.ordT < 0.0008) this.ordT = 0;
      const insWant = (ph && ph !== "travel") ? 1 : 0;
      this.insT = (this.insT || 0) + (insWant - (this.insT || 0)) * (1 - Math.pow(insWant ? 0.05 : 0.0006, dt / 1000));
      const o = this.ordT, oe = o * o * (3 - 2 * o);

      if (this.tpe) {
        this.tpe.visible = o > 0.06;
        this.tpe.position.y = this.tpeY - (1 - oe) * 6.2;
        this.tpe.rotation.y = -0.16 + (1 - oe) * 0.42;
      }
      if (o > 0.002 && this.frame % 2 === 0) {
        this.drawScreen(t / 1000);
        const puls = 0.34 + 0.06 * Math.sin(t / 620);
        if (this.screenGlow) this.screenGlow.material.opacity = puls;
        if (this.screenLight) this.screenLight.intensity = 3.1 + 0.7 * Math.sin(t / 700);
      }
      if (this.keys && o > 0.002) {
        for (let q = 0; q < this.keys.length; q++) {
          const rec = this.keys[q];
          if (rec.press > 0.0005) {
            rec.press *= Math.pow(0.0009, dt / 1000);
            const d2 = rec.press * 0.075;
            rec.body.position.z = rec.z0 - d2;
            rec.cap.position.z = rec.zc0 - d2;
            rec.cap.material.emissiveIntensity = 0.55 + rec.press * 1.6;
          } else if (rec.press) {
            rec.press = 0;
            rec.body.position.z = rec.z0;
            rec.cap.position.z = rec.zc0;
            rec.cap.material.emissiveIntensity = 0.55;
          }
        }
      }
      if (this.led && o > 0.002) {
        const ts = t / 1000;
        let col = 0x6ea8ff, amp = 1;
        if (ph === "done") { col = 0x7de3a8; amp = 0.75 + 0.25 * Math.sin(ts * 2.2); }
        else if (ph === "reading") { col = 0xffd47d; amp = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(ts * 11)); }
        else if (ph === "pin") { col = this.pinErr ? 0xff8f8f : 0x6ea8ff; amp = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(ts * 4.4)); }
        else { amp = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(ts * 2.6)); }
        this.led.material.color.setHex(col);
        this.led.material.opacity = amp;
        this.led.material.transparent = true;
        this.led.scale.setScalar(0.86 + amp * 0.28);
        if (this.pinErr) this.pinErr = Math.max(0, this.pinErr - dt / 700);
      }

      const mix = (a, b) => a + (b - a) * oe;
      if (this.dot) {
        if (this.cxp === undefined) { this.cxp = this.px || -600; this.cyp = this.py || -600; }
        const kp = 1 - Math.pow(1e-9, dt / 1000);
        this.cxp += ((this.px ?? this.cxp) - this.cxp) * kp;
        this.cyp += ((this.py ?? this.cyp) - this.cyp) * kp;
        const kh = 1 - Math.pow(0.0009, dt / 1000);
        const want = (this.hot || this.domHot) ? 1 : 0;
        this.hotT = (this.hotT || 0) + (want - (this.hotT || 0)) * kh;
        this.visT = (this.visT || 0) + ((this.inside ? 1 : 0) - (this.visT || 0)) * (1 - Math.pow(0.02, dt / 1000));
        const hh = this.hotT * this.hotT * (3 - 2 * this.hotT);
        const pos = "translate(" + this.cxp.toFixed(1) + "px," + this.cyp.toFixed(1) + "px)";
        const d2 = this.dot;
        d2.style.transform = pos + " scale(" + (1 + 0.9 * hh).toFixed(3) + ")";
        d2.style.opacity = this.visT.toFixed(3);
      }
      this.pmx = (this.pmx || 0) + ((this.mx || 0) - (this.pmx || 0)) * (1 - Math.pow(0.02, dt / 1000));
      this.pmy = (this.pmy || 0) + ((this.my || 0) - (this.pmy || 0)) * (1 - Math.pow(0.02, dt / 1000));
      const amp = 0.24 + oe * 0.26;
      const lamp = 0.06 + oe * 0.07;
      const cxT = mix(f * 0.55, 2.15) + this.pmx * amp;
      const cyT = mix(f * 0.12, -0.2) - this.pmy * amp * 0.68;
      const czT = mix(zBase - f * 0.95, 10.4);
      const lxT = mix(f * 1.15, 0.35) + this.pmx * lamp;
      const lyT = mix(0, -2.05) - this.pmy * lamp * 0.7;
      const lzT = mix(0, 1.6);
      camera.position.x += (cxT - camera.position.x) * k;
      camera.position.y += (cyT - camera.position.y) * k;
      camera.position.z += (czT - camera.position.z) * k;
      this.look.x += (lxT - this.look.x) * k;
      this.look.y += (lyT - this.look.y) * k;
      this.look.z += (lzT - this.look.z) * k;
      camera.lookAt(this.look);
      this.place(f, k);
      for (let i = 0; i < this.vids.length; i++) this.vids[i].step();
      if (this.frame % 30 === 0) {
        for (let i = 0; i < this.vids.length; i++) {
          const v = this.vids[i].el;
          if (v && v.paused && v.readyState >= 2) v.play().catch(() => {});
        }
      }
      this.frame = (this.frame || 0) + 1;
      if (this.frame % 2 === 0) {
        for (let i = 0; i < this.anims.length; i++) {
          if (!this.anims[i].idle) this.anims[i].draw(t / 1000 + i * 3.7);
        }
      }
      for (let i = 0; i < this.groups.length; i++) {
        const faces = [this.groups[i].children[1], this.groups[i].children[3]];
        for (const b of faces) {
          const vid = b.userData.vid;
          const still = b.userData.still;
          const want = vid && vid.ok ? vid.tex : (still && still.ready ? still : b.userData.fallback);
          if (b.material.map !== want) {
            b.material.map = want;
            b.material.needsUpdate = true;
            this.anims[i].idle = want !== b.userData.fallback;
          }
        }
      }
      renderer.render(scene, camera);
      this.raf = requestAnimationFrame(this.loop);
    };
    this.raf = requestAnimationFrame(this.loop);
    this.clearFlash();
  }

  clearFlash() {
    const el = window.__mangFlash;
    if (!el) return;
    window.__mangFlash = null;
    const waits = this.vids.map((rec) => new Promise((res) => {
      const v = rec.el;
      if (!v || rec.ok || v.readyState >= 3) return res();
      const done = () => res();
      v.addEventListener("canplaythrough", done, { once: true });
      v.addEventListener("loadeddata", done, { once: true });
      v.addEventListener("error", done, { once: true });
    }));
    const min = new Promise((res) => setTimeout(res, 700));
    const cap = new Promise((res) => setTimeout(res, 5000));
    Promise.race([Promise.all([Promise.all(waits), min]), cap]).then(() => {
      requestAnimationFrame(() => {
        el.style.opacity = "0";
        setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1700);
      });
    });
  }

  makeVideo(src) {
    const THREE = this.THREE;
    const v = document.createElement("video");
    v.src = src;
    v.loop = true;
    v.muted = true;
    v.defaultMuted = true;
    v.autoplay = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("muted", "");
    v.preload = "auto";
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const rec = { el: v, tex, ok: false, step: () => {} };
    v.addEventListener("loadeddata", () => { rec.ok = true; v.play().catch(() => {}); });
    v.addEventListener("error", () => { rec.ok = false; });
    v.load();
    v.play().catch(() => {});
    return rec;
  }

  place(f, k) {
    const span = this.span, half = span / 2;
    const tilt = (this.props.tilt ?? 34) * Math.PI / 180;
    f = f || 0;
    const sel = this.state.sel;
    for (let i = 0; i < this.groups.length; i++) {
      let y = (i * this.GAP - this.offset + half) % span;
      if (y < 0) y += span;
      y -= half;
      const t = Math.max(-2.4, Math.min(2.4, y / 2.5));
      const a = Math.abs(t);
      const g = this.groups[i];
      const e = Math.pow(a, 1.5);
      const v = this.props.variation ?? 1;
      const u = g.userData;
      g.position.set(0, -y, -1.1 * a * a);
      const p = y / this.GAP;
      const k = this.props.dwell ?? 0.8;
      const eased = p - k * Math.sin(2 * Math.PI * p) / (2 * Math.PI);
      g.rotation.x = eased * Math.PI * (this.props.spin ?? 1) + Math.sign(t) * e * tilt * 0.16;
      g.rotation.y = 0.09 + e * 0.2 * u.py * v;
      g.rotation.z = e * 0.09 * u.pz * v;
      const s = Math.max(0.55, 1 - 0.1 * a * a);
      g.scale.setScalar(s);
      let op = Math.max(0, Math.min(1, 1.35 - 0.62 * a * a));
      if (f > 0.001) {
        const on = i === sel || (sel === null && this.selLast === i);
        if (on) {
          this.selLast = i;
          const twoPi = Math.PI * 2;
          const rest = Math.round(g.rotation.x / twoPi) * twoPi;
          g.position.x += (1.62 - g.position.x) * f;
          g.position.y += (0.06 - g.position.y) * f;
          g.position.z += (1.55 - g.position.z) * f;
          const ft = this.flipT || 0;
          g.rotation.x += (rest + ft * Math.PI - g.rotation.x) * f;
          g.rotation.y += (-0.42 * (1 - 2 * ft) - g.rotation.y) * f;
          g.rotation.z += (0.035 - g.rotation.z) * f;
          let sc = s + (1.02 - s) * f;
          op = op + (1 - op) * f;
          const o = this.ordT || 0;
          if (o > 0.0005 && this.tpe) {
            const THREE = this.THREE;
            const e = o * o * (3 - 2 * o);
            const ins = this.insT || 0;
            const ie = ins * ins * (3 - 2 * ins);
            this.tpe.updateMatrixWorld();
            const up = this._up = (this._up || new THREE.Vector3());
            up.set(0, 1, 0).applyQuaternion(this.tpe.quaternion);
            const sw = this._sw = (this._sw || new THREE.Vector3());
            this.slot.getWorldPosition(sw);
            const dest = this._dest = (this._dest || new THREE.Vector3());
            dest.copy(sw).addScaledVector(up, 1.88 - ie * 1.6);
            g.position.lerp(dest, e);
            sc = sc + (1.08 - sc) * e;
            g.scale.setScalar(sc);
            const qz = this._qz = (this._qz || new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2));
            const qt = this._qt = (this._qt || new THREE.Quaternion());
            qt.copy(this.tpe.quaternion).multiply(qz);
            if (e > 0.985) g.quaternion.copy(qt); else g.quaternion.slerp(qt, e * 0.9);
            g.children.forEach((m) => { m.material.depthWrite = true; });
          } else {
            g.scale.setScalar(sc);
          }
        } else {
          g.position.x -= f * 1.5;
          g.position.z -= f * 1.2;
          op *= 1 - f;
        }
      }
      g.children.forEach((m) => {
        const ob = m.userData.opBase ?? 1;
        if (Array.isArray(m.material)) m.material.forEach((mat) => { mat.opacity = op * ob; });
        else m.material.opacity = op * ob;
        m.visible = op > 0.02;
      });
    }
  }

  keyTex(label, kind) {
    const THREE = this.THREE;
    const w = 256, h = 148;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const x = cv.getContext("2d");
    const g = x.createLinearGradient(0, 0, 0, h);
    if (kind === "ok") { g.addColorStop(0, "#2c6f4a"); g.addColorStop(.5, "#1e5335"); g.addColorStop(1, "#123322"); }
    else if (kind === "no") { g.addColorStop(0, "#7a3136"); g.addColorStop(.5, "#5a2328"); g.addColorStop(1, "#33161a"); }
    else { g.addColorStop(0, "#3a3b42"); g.addColorStop(.5, "#2a2b31"); g.addColorStop(1, "#1c1d21"); }
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const sheen = x.createLinearGradient(0, 0, w * .7, h);
    sheen.addColorStop(0, "rgba(255,255,255,.16)");
    sheen.addColorStop(.42, "rgba(255,255,255,.02)");
    sheen.addColorStop(1, "rgba(0,0,0,.22)");
    x.fillStyle = sheen; x.fillRect(0, 0, w, h);
    x.textAlign = "center";
    x.textBaseline = "middle";
    if (kind === "ok" || kind === "no") {
      x.strokeStyle = kind === "ok" ? "#a9f5c8" : "#ffb4ba";
      x.lineWidth = 11;
      x.lineCap = "round";
      x.lineJoin = "round";
      x.beginPath();
      if (kind === "ok") { x.moveTo(w / 2 - 28, h / 2 + 2); x.lineTo(w / 2 - 8, h / 2 + 24); x.lineTo(w / 2 + 32, h / 2 - 24); }
      else { x.moveTo(w / 2 - 24, h / 2 - 22); x.lineTo(w / 2 + 24, h / 2 + 22); x.moveTo(w / 2 + 24, h / 2 - 22); x.lineTo(w / 2 - 24, h / 2 + 22); }
      x.stroke();
    } else {
      x.font = "500 68px 'JetBrains Mono', monospace";
      x.fillStyle = "rgba(0,0,0,.5)";
      x.fillText(label, w / 2, h / 2 + 5);
      x.fillStyle = "rgba(244,246,250,.95)";
      x.fillText(label, w / 2, h / 2 + 2);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  brandTex() {
    const THREE = this.THREE;
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 128;
    const x = cv.getContext("2d");
    x.fillStyle = "#15161a"; x.fillRect(0, 0, 512, 128);
    x.textBaseline = "middle";
    x.font = "italic 62px 'Instrument Serif', serif";
    x.fillStyle = "rgba(210,215,225,.75)";
    x.fillText("mang", 24, 66);
    x.font = "500 22px 'JetBrains Mono', monospace";
    x.fillStyle = "rgba(160,166,178,.45)";
    x.textAlign = "right";
    x.fillText("TPE-04", 488, 68);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  buildTPE() {
    const THREE = this.THREE;
    const scene = this.scene;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(3.6, 6, 6.6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb6d8, 1.5);
    rim.position.set(-5, 2, -3);
    scene.add(rim);
    const fill = new THREE.PointLight(0xffffff, 15, 24);
    fill.position.set(-2, -1.3, 5.4);
    scene.add(fill);

    const g = new THREE.Group();
    const W = 2.78, H = 4.66, D = 0.94, R = 0.34;

    const rr = (w, h, r) => {
      const s2 = new THREE.Shape();
      const hw = w / 2, hh = h / 2;
      s2.moveTo(-hw + r, -hh);
      s2.lineTo(hw - r, -hh);
      s2.quadraticCurveTo(hw, -hh, hw, -hh + r);
      s2.lineTo(hw, hh - r);
      s2.quadraticCurveTo(hw, hh, hw - r, hh);
      s2.lineTo(-hw + r, hh);
      s2.quadraticCurveTo(-hw, hh, -hw, hh - r);
      s2.lineTo(-hw, -hh + r);
      s2.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
      return s2;
    };

    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(rr(W, H, R), { depth: D, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 6, curveSegments: 22 }),
      new THREE.MeshStandardMaterial({ color: 0x131418, roughness: 0.46, metalness: 0.66 })
    );
    body.position.z = -D / 2;
    g.add(body);

    const seam = new THREE.Mesh(
      new THREE.ExtrudeGeometry(rr(W + 0.012, 0.045, 0.02), { depth: D * 0.62, bevelEnabled: false, curveSegments: 6 }),
      new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.9, metalness: 0.1 })
    );
    seam.position.set(0, -H / 2 + 0.9, -D / 2 + 0.04);
    g.add(seam);

    const deckD = 0.13;
    const deckZ = D / 2 - 0.03;
    const deck = new THREE.Mesh(
      new THREE.ExtrudeGeometry(rr(W - 0.22, H - 0.26, R * 0.76), { depth: deckD, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4, curveSegments: 22 }),
      new THREE.MeshStandardMaterial({ color: 0x1e1f24, roughness: 0.7, metalness: 0.36 })
    );
    deck.position.z = deckZ;
    g.add(deck);
    const face = deckZ + deckD + 0.05;

    const sw = W - 0.6, sh = 1.6;
    const scY = H / 2 - 0.44 - sh / 2;

    const bezel = new THREE.Mesh(
      new THREE.ExtrudeGeometry(rr(sw + 0.16, sh + 0.16, 0.17), { depth: 0.05, bevelEnabled: false, curveSegments: 16 }),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.35, metalness: 0.2 })
    );
    bezel.position.set(0, scY, face - 0.035);
    g.add(bezel);

    this.screenCv = document.createElement("canvas");
    this.screenCv.width = 896;
    this.screenCv.height = 504;
    this.screenTex = new THREE.CanvasTexture(this.screenCv);
    this.screenTex.colorSpace = THREE.SRGBColorSpace;
    this.screenTex.anisotropy = 8;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      new THREE.MeshBasicMaterial({ map: this.screenTex, toneMapped: false })
    );
    screen.position.set(0, scY, face + 0.03);
    g.add(screen);
    this.drawScreen(0);

    const gcv = document.createElement("canvas");
    gcv.width = 256; gcv.height = 256;
    const gx = gcv.getContext("2d");
    const rg = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
    rg.addColorStop(0, "rgba(150,185,245,.34)");
    rg.addColorStop(.4, "rgba(120,155,225,.11)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    gx.fillStyle = rg; gx.fillRect(0, 0, 256, 256);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(sw * 2.2, sh * 2.7),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(gcv), transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
    );
    glow.position.set(0, scY, face + 0.055);
    g.add(glow);
    this.screenGlow = glow;

    const scLight = new THREE.PointLight(0xa6c4ff, 3.4, 4.6, 2);
    scLight.position.set(0, scY - 0.3, face + 0.75);
    g.add(scLight);
    this.screenLight = scLight;

    this.keys = [];
    const kw = 0.66, kh = 0.4, kg = 0.13, kd = 0.16;
    const keyGeo = new THREE.ExtrudeGeometry(rr(kw, kh, 0.12), { depth: kd, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 4, curveSegments: 12 });
    const sideMat = new THREE.MeshStandardMaterial({ color: 0x181920, roughness: 0.64, metalness: 0.4 });
    const rowTop = scY - sh / 2 - 0.5 - kh / 2;
    const pad = [["1", "num"], ["2", "num"], ["3", "num"], ["4", "num"], ["5", "num"], ["6", "num"], ["7", "num"], ["8", "num"], ["9", "num"], ["", "no"], ["0", "num"], ["", "ok"]];
    for (let r0 = 0; r0 < 4; r0++) {
      for (let c0 = 0; c0 < 3; c0++) {
        const [lab, kind] = pad[r0 * 3 + c0];
        const px = (c0 - 1) * (kw + kg);
        const py = rowTop - r0 * (kh + kg);
        const k2 = new THREE.Mesh(keyGeo, sideMat.clone());
        k2.position.set(px, py, face - 0.045);
        g.add(k2);
        const cw = kw - 0.05, ch = kh - 0.05;
        const capGeo2 = new THREE.ShapeGeometry(rr(cw, ch, 0.11), 12);
        const cp = capGeo2.attributes.position;
        const cuv = new Float32Array(cp.count * 2);
        for (let q = 0; q < cp.count; q++) {
          cuv[q * 2] = (cp.getX(q) + cw / 2) / cw;
          cuv[q * 2 + 1] = (cp.getY(q) + ch / 2) / ch;
        }
        capGeo2.setAttribute("uv", new THREE.BufferAttribute(cuv, 2));
        const cap = new THREE.Mesh(
          capGeo2,
          new THREE.MeshStandardMaterial({
            map: this.keyTex(lab, kind),
            roughness: 0.48,
            metalness: 0.24,
            emissive: kind === "ok" ? 0x14361f : kind === "no" ? 0x36141a : 0x000000,
            emissiveIntensity: 0.55
          })
        );
        cap.position.set(px, py, face - 0.045 + kd + 0.038);
        g.add(cap);
        this.keys.push({ body: k2, cap, kind, label: lab, z0: k2.position.z, zc0: cap.position.z, press: 0 });
      }
    }

    const slotY = H / 2 - 0.08;
    const slotW = 1.71 * 1.08 + 0.22;
    const cavity = new THREE.Mesh(
      new THREE.BoxGeometry(slotW, 0.62, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x030304, roughness: 1, metalness: 0 })
    );
    cavity.position.set(0, slotY - 0.24, 0.01);
    g.add(cavity);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x40434b, roughness: 0.24, metalness: 0.88 });
    [-1, 1].forEach((sgn) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(slotW + 0.3, 0.15, 0.1), railMat);
      rail.position.set(0, slotY, 0.01 + sgn * 0.125);
      g.add(rail);
    });
    [-1, 1].forEach((sgn) => {
      const cap2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.35), railMat);
      cap2.position.set(sgn * (slotW / 2 + 0.075), slotY, 0.01);
      g.add(cap2);
    });
    const guide = new THREE.Mesh(
      new THREE.BoxGeometry(slotW + 0.02, 0.05, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x2a2c33, roughness: 0.35, metalness: 0.8 })
    );
    guide.position.set(0, slotY - 0.09, 0.01);
    g.add(guide);

    const led = new THREE.Mesh(
      new THREE.CircleGeometry(0.045, 16),
      new THREE.MeshBasicMaterial({ color: 0x6ea8ff, toneMapped: false })
    );
    led.position.set(W / 2 - 0.36, scY + sh / 2 + 0.22, face + 0.006);
    g.add(led);
    this.led = led;

    this.slot = new THREE.Object3D();
    this.slot.position.set(0, slotY, 0.01);
    g.add(this.slot);

    g.position.set(0.55, -2.1, 1.6);
    g.rotation.set(-0.11, -0.16, 0);
    g.visible = false;
    scene.add(g);
    this.tpe = g;
    this.tpeY = -2.1;
  }

  drawScreen(t) {
    const cv = this.screenCv;
    if (!cv) return;
    const x = cv.getContext("2d");
    const w = cv.width, h = cv.height;
    const ph = this.state.phase;
    x.fillStyle = "#04050a";
    x.fillRect(0, 0, w, h);
    const gl = x.createRadialGradient(w * .5, h * .42, 0, w * .5, h * .5, w * .72);
    gl.addColorStop(0, "rgba(120,150,210,.1)");
    gl.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gl;
    x.fillRect(0, 0, w, h);

    x.textBaseline = "middle";
    x.textAlign = "left";
    x.font = "italic " + Math.round(h * .105) + "px 'Instrument Serif', serif";
    x.fillStyle = "rgba(241,242,245,.95)";
    x.fillText("mang", w * .05, h * .105);
    x.font = "500 " + Math.round(h * .042) + "px 'JetBrains Mono', monospace";
    x.fillStyle = "rgba(241,242,245,.4)";
    x.textAlign = "right";
    x.fillText(ph === "done" ? "APPROUVÉ" : ph === "reading" ? "VÉRIFICATION" : ph === "pin" ? "CODE" : "PRÊT", w * .95, h * .105);
    x.fillStyle = "rgba(255,255,255,.06)";
    x.fillRect(w * .05, h * .18, w * .9, 1);
    x.textAlign = "center";

    if (ph === "done") {
      const cy = h * .45, r = h * .1;
      x.strokeStyle = "#7de3a8";
      x.lineWidth = h * .012;
      x.globalAlpha = .4;
      x.beginPath(); x.arc(w / 2, cy, r, 0, 6.284); x.stroke();
      x.globalAlpha = 1;
      x.lineCap = "round";
      x.lineJoin = "round";
      x.beginPath();
      x.moveTo(w / 2 - r * .45, cy);
      x.lineTo(w / 2 - r * .1, cy + r * .34);
      x.lineTo(w / 2 + r * .5, cy - r * .34);
      x.stroke();
      x.font = "500 " + Math.round(h * .082) + "px 'Instrument Sans', sans-serif";
      x.fillStyle = "rgba(241,242,245,.96)";
      x.fillText("Merci pour votre commande", w / 2, h * .72);
      x.font = "400 " + Math.round(h * .048) + "px 'Instrument Sans', sans-serif";
      x.fillStyle = "rgba(241,242,245,.45)";
      x.fillText("Livraison estimée sous 5 jours", w / 2, h * .85);
    } else if (ph === "pin") {
      const pin = this.state.pin || "";
      x.font = "500 " + Math.round(h * .072) + "px 'Instrument Sans', sans-serif";
      x.fillStyle = "rgba(241,242,245,.92)";
      x.fillText("Saisissez votre code", w / 2, h * .4);
      const r = h * .028, gapx = h * .105;
      for (let i = 0; i < 4; i++) {
        const cx = w / 2 - gapx * 1.5 + i * gapx;
        const cy = h * .62;
        const filled = i < pin.length;
        const cur = i === pin.length;
        x.beginPath();
        x.arc(cx, cy, r, 0, 6.284);
        if (filled) { x.fillStyle = "rgba(241,242,245,.95)"; x.fill(); }
        else {
          x.lineWidth = h * .006;
          x.strokeStyle = cur ? "rgba(241,242,245," + (0.35 + 0.5 * (0.5 + 0.5 * Math.sin(t * 5))) + ")" : "rgba(241,242,245,.22)";
          x.stroke();
        }
      }
      x.font = "400 " + Math.round(h * .04) + "px 'JetBrains Mono', monospace";
      x.fillStyle = pin.length === 4 ? "rgba(125,227,168,.85)" : "rgba(241,242,245,.35)";
      x.fillText(pin.length === 4 ? "APPUYEZ SUR VALIDER" : "4 CHIFFRES", w / 2, h * .82);
    } else if (ph === "reading") {
      x.font = "500 " + Math.round(h * .082) + "px 'Instrument Sans', sans-serif";
      x.fillStyle = "rgba(241,242,245,.95)";
      x.fillText("Vérification du code", w / 2, h * .46);
      for (let i = 0; i < 3; i++) {
        x.globalAlpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 4.2 - i * 0.9));
        x.beginPath();
        x.arc(w / 2 - h * .07 + i * h * .07, h * .68, h * .017, 0, 6.284);
        x.fillStyle = "#f1f2f5";
        x.fill();
      }
      x.globalAlpha = 1;
    } else {
      x.font = "500 " + Math.round(h * .082) + "px 'Instrument Sans', sans-serif";
      x.fillStyle = "rgba(241,242,245,.92)";
      x.fillText("Insérez votre carte", w / 2, h * .46);
      x.globalAlpha = 0.35 + 0.35 * Math.sin(t * 3);
      x.strokeStyle = "rgba(241,242,245,.8)";
      x.lineWidth = h * .008;
      x.lineCap = "round";
      x.beginPath();
      x.moveTo(w / 2, h * .8);
      x.lineTo(w / 2, h * .62);
      x.moveTo(w / 2 - h * .045, h * .685);
      x.lineTo(w / 2, h * .62);
      x.lineTo(w / 2 + h * .045, h * .685);
      x.stroke();
      x.globalAlpha = 1;
    }
    x.textAlign = "left";
    if (this.screenTex) this.screenTex.needsUpdate = true;
  }

  makePattern(kind) {
    const w = 1100, h = 691;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const x = cv.getContext("2d");
    x.strokeStyle = "rgba(255,255,255,.5)";
    x.fillStyle = "rgba(255,255,255,.32)";
    x.lineWidth = 1.6;

    if (kind === "flora") {
      const petal = (cx, cy, r, n, rot) => {
        for (let i = 0; i < n; i++) {
          const a = rot + (i / n) * Math.PI * 2;
          x.beginPath();
          x.moveTo(cx, cy);
          x.quadraticCurveTo(cx + Math.cos(a - .34) * r, cy + Math.sin(a - .34) * r, cx + Math.cos(a) * r * 1.32, cy + Math.sin(a) * r * 1.32);
          x.quadraticCurveTo(cx + Math.cos(a + .34) * r, cy + Math.sin(a + .34) * r, cx, cy);
          x.stroke();
        }
        x.beginPath(); x.arc(cx, cy, r * .16, 0, 6.284); x.fill();
      };
      const sx = 168, sy = 150;
      for (let r0 = -1; r0 < h / sy + 1; r0++) {
        for (let c0 = -1; c0 < w / sx + 1; c0++) {
          const cx = c0 * sx + (r0 % 2 ? sx / 2 : 0);
          const cy = r0 * sy;
          petal(cx, cy, 40, 6, (r0 + c0) * .3);
          x.beginPath(); x.arc(cx + sx / 2, cy + sy / 2, 5, 0, 6.284); x.fill();
        }
      }
    } else if (kind === "waves") {
      for (let i = -2; i < 26; i++) {
        x.beginPath();
        for (let px = 0; px <= w; px += 8) {
          const py = i * 34 + Math.sin(px / 108 + i * .55) * 20 + Math.sin(px / 47) * 5;
          if (px === 0) x.moveTo(px, py); else x.lineTo(px, py);
        }
        x.strokeStyle = "rgba(255,255,255," + (i % 3 === 0 ? .42 : .2) + ")";
        x.stroke();
      }
    } else if (kind === "guilloche") {
      x.lineWidth = 1.1;
      for (let k = 0; k < 5; k++) {
        const cx = w * (0.16 + k * 0.17), cy = h * (k % 2 ? 0.36 : 0.64);
        for (let i = 0; i < 90; i++) {
          const a = (i / 90) * Math.PI * 2;
          x.beginPath();
          for (let tt = 0; tt <= 6.3; tt += 0.09) {
            const R = 118 + 30 * Math.cos(5 * tt + a);
            const px = cx + Math.cos(tt) * R * .9;
            const py = cy + Math.sin(tt) * R * .55;
            if (tt === 0) x.moveTo(px, py); else x.lineTo(px, py);
          }
          x.strokeStyle = "rgba(255,255,255,.035)";
          x.stroke();
          i += 6;
        }
      }
    } else {
      const frond = (cx, cy, len, rot) => {
        x.save();
        x.translate(cx, cy);
        x.rotate(rot);
        x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(len * .4, -len * .2, len, -len * .5); x.stroke();
        for (let i = 1; i <= 9; i++) {
          const t = i / 10;
          const bx = len * t, by = -len * .5 * t * t - len * .2 * t * (1 - t) * 2;
          const l = len * .3 * (1 - t * .55);
          x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + l * .4, by - l * .7, bx + l * .2, by - l); x.stroke();
          x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + l * .7, by + l * .2, bx + l, by + l * .35); x.stroke();
        }
        x.restore();
      };
      x.lineWidth = 1.3;
      x.strokeStyle = "rgba(255,255,255,.34)";
      for (let r0 = 0; r0 < 4; r0++) {
        for (let c0 = 0; c0 < 4; c0++) {
          frond(c0 * 300 - 60, r0 * 200 + 130, 190, (r0 % 2 ? -0.5 : 0.35) + c0 * 0.12);
        }
      }
    }
    return cv;
  }

  applyPat(i, kind) {
    const g = this.groups[i];
    g.userData.pat = kind;
    const on = kind !== "none";
    const strength = this.props.engraveStrength ?? 0.42;
    [g.children[5], g.children[6]].forEach((m) => {
      m.material.map = on ? this.patTex[kind] : null;
      m.material.opacity = on ? strength : 0;
      m.userData.opBase = on ? strength : 0;
      m.material.needsUpdate = true;
    });
  }

  makeAnim(pal) {
    const THREE = this.THREE;
    const w = 320, h = 201;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const x = cv.getContext("2d");
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const blob = (t, cxp, cyp, rp, col, sx, sy, sp) => {
      const cx = w * (cxp + 0.22 * Math.sin(t * sp + sx));
      const cy = h * (cyp + 0.26 * Math.cos(t * sp * 0.83 + sy));
      const r = w * rp * (1 + 0.14 * Math.sin(t * sp * 1.3 + sx));
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, col + "cc");
      g.addColorStop(0.55, col + "4d");
      g.addColorStop(1, col + "00");
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
    };
    const draw = (t) => {
      x.globalCompositeOperation = "source-over";
      x.fillStyle = pal[0];
      x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = "lighter";
      blob(t, 0.32, 0.42, 0.62, pal[1], 0, 1.1, 0.34);
      blob(t, 0.66, 0.58, 0.5, pal[2], 2.3, 0.4, 0.27);
      blob(t, 0.5, 0.3, 0.34, pal[3], 4.1, 2.6, 0.42);
      x.globalCompositeOperation = "source-over";
      const sh = x.createLinearGradient(0, 0, w, h);
      sh.addColorStop(0, "rgba(255,255,255,.1)");
      sh.addColorStop(0.4, "rgba(255,255,255,0)");
      sh.addColorStop(1, "rgba(0,0,0,.28)");
      x.fillStyle = sh;
      x.fillRect(0, 0, w, h);
      tex.needsUpdate = true;
    };
    draw(0);
    return { tex, draw, idle: false };
  }

  tex(d, back, bgOnly, contentOnly) {
    const w = 1100, h = 691;
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const x = cv.getContext("2d");

    if (!contentOnly) {
      const grad = x.createLinearGradient(0, 0, w, h);
      if (back) { grad.addColorStop(0, "#0a0a0c"); grad.addColorStop(.55, "#17171a"); grad.addColorStop(1, "#242429"); }
      else { grad.addColorStop(0, d.a); grad.addColorStop(.5, d.b); grad.addColorStop(1, d.c); }
      x.fillStyle = grad; x.fillRect(0, 0, w, h);

      const sheen = x.createRadialGradient(back ? w * .25 : w * .8, back ? h * .85 : h * .12, 0, back ? w * .25 : w * .8, back ? h * .85 : h * .12, w * .7);
      sheen.addColorStop(0, back ? "rgba(255,255,255,.09)" : "rgba(255,255,255,.16)");
      sheen.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = sheen; x.fillRect(0, 0, w, h);
    }
    if (bgOnly) {
      const tx0 = new this.THREE.CanvasTexture(cv);
      tx0.anisotropy = 8;
      tx0.colorSpace = this.THREE.SRGBColorSpace;
      return tx0;
    }

    const label = (s, px, py, size, alpha, sp) => {
      x.save();
      x.font = "500 " + size + "px 'JetBrains Mono', monospace";
      x.fillStyle = "rgba(255,255,255," + alpha + ")";
      x.textBaseline = "alphabetic";
      let cx = px;
      for (const ch of s) { x.fillText(ch, cx, py); cx += x.measureText(ch).width + (sp || 0); }
      x.restore();
      return cx;
    };

    if (!back) {
      x.save();
      x.translate(126, 150);
      x.rotate(Math.PI / 2);
      x.font = "300 30px 'Instrument Sans', system-ui, sans-serif";
      x.fillStyle = "rgba(255,255,255,.92)";
      let cx = 0;
      for (const ch of d.tier.toUpperCase()) { x.fillText(ch, cx, 0); cx += x.measureText(ch).width + 15; }
      x.restore();

      const chx = w - 322, chy = 132, chw = 152, chh = 116;
      const cg = x.createLinearGradient(chx, chy, chx + chw, chy + chh);
      cg.addColorStop(0, "#e6e9ed"); cg.addColorStop(.45, "#a9aeb5"); cg.addColorStop(1, "#d8dce1");
      x.fillStyle = cg;
      x.beginPath();
      if (x.roundRect) x.roundRect(chx, chy, chw, chh, 16); else x.rect(chx, chy, chw, chh);
      x.fill();
      x.save();
      x.beginPath();
      if (x.roundRect) x.roundRect(chx, chy, chw, chh, 16); else x.rect(chx, chy, chw, chh);
      x.clip();
      x.strokeStyle = "rgba(90,96,104,.55)"; x.lineWidth = 3;
      x.beginPath(); x.moveTo(chx, chy + chh * .3); x.lineTo(chx + chw, chy + chh * .3); x.stroke();
      x.beginPath(); x.moveTo(chx, chy + chh * .7); x.lineTo(chx + chw, chy + chh * .7); x.stroke();
      x.beginPath(); x.moveTo(chx + chw * .28, chy); x.lineTo(chx + chw * .28, chy + chh); x.stroke();
      x.beginPath(); x.moveTo(chx + chw * .72, chy); x.lineTo(chx + chw * .72, chy + chh); x.stroke();
      x.strokeStyle = "rgba(70,76,84,.7)"; x.lineWidth = 4;
      x.beginPath();
      if (x.roundRect) x.roundRect(chx + chw * .26, chy + chh * .28, chw * .48, chh * .44, 14); else x.rect(chx + chw * .26, chy + chh * .28, chw * .48, chh * .44);
      x.stroke();
      x.fillStyle = cg;
      x.beginPath();
      if (x.roundRect) x.roundRect(chx + chw * .28, chy + chh * .3, chw * .44, chh * .4, 12); else x.rect(chx + chw * .28, chy + chh * .3, chw * .44, chh * .4);
      x.fill();
      x.restore();

      x.font = "700 italic 68px 'Instrument Sans', system-ui, sans-serif";
      x.fillStyle = "rgba(255,255,255,.96)";
      x.fillText("mang", 208, h - 78);
    } else {
      const scrim = x.createLinearGradient(0, h * .42, 0, h);
      scrim.addColorStop(0, "rgba(4,5,10,0)");
      scrim.addColorStop(.45, "rgba(4,5,10,.62)");
      scrim.addColorStop(1, "rgba(4,5,10,.82)");
      x.fillStyle = scrim; x.fillRect(0, h * .42, w, h * .58);
      x.fillStyle = "#04050a"; x.fillRect(0, 92, w, 148);
      label(d.num, 96, 500, 44, .92, 8);
      label(d.name.toUpperCase() + "  ·  CVV : " + d.cvv, 96, 566, 20, .6, 3.4);
    }

    const gAmt = this.props.grain ?? 0;
    if (gAmt > 0) {
      if (!this._noise) {
        const n = document.createElement("canvas");
        n.width = 160; n.height = 160;
        const nx = n.getContext("2d");
        const img = nx.createImageData(160, 160);
        for (let i = 0; i < img.data.length; i += 4) {
          const v = 120 + Math.random() * 135;
          img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
        nx.putImageData(img, 0, 0);
        this._noise = n;
      }
      x.save();
      x.globalAlpha = gAmt;
      x.globalCompositeOperation = "overlay";
      const pat = x.createPattern(this._noise, "repeat");
      x.fillStyle = pat;
      x.fillRect(0, 0, w, h);
      x.restore();
    }

    const tx = new this.THREE.CanvasTexture(cv);
    tx.anisotropy = 8;
    tx.colorSpace = this.THREE.SRGBColorSpace;
    return tx;
  }

  componentWillUnmount() {
    this.mounted = false;
    clearTimeout(this.t1); clearTimeout(this.t2); clearTimeout(this.t3); clearTimeout(this.t4);
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("touchstart", this.onTouchStart);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("pointermove", this.onPointer);
    window.removeEventListener("pointerover", this.onDomHover);
    document.removeEventListener("pointerleave", this.onDocLeave);
    if (this.stopBeeps) this.stopBeeps();
    if (this.canvas) this.canvas.removeEventListener("click", this.onClick);
    if (this.renderer) this.renderer.dispose();
  }

  state = { sel: null, flip: false, name: "", tex: 0, pat: "none", phase: null, pin: "" };

  renderVals() {
    const c = this.state.sel !== null ? this.CARDS[this.state.sel] : null;
    return {
      setCanvas: this.setCanvas,
      setDot: this.setDot,
      setRing: this.setRing,
      open: this.state.sel !== null && !this.state.phase,
      closed: this.state.sel === null && !this.state.phase,
      ordering: !!this.state.phase,
      done: this.state.phase === "done",
      reading: this.state.phase === "reading",
      orderTitle: this.state.phase === "done" ? "C'est enregistré." : this.state.phase === "pin" ? "Saisissez votre code." : this.state.phase === "reading" ? "Vérification…" : "Insertion en cours.",
      orderSub: this.state.phase === "done" ? "Votre carte part en production. Vous recevrez un suivi par notification." : this.state.phase === "pin" ? "Composez un code à 4 chiffres sur le clavier du terminal, puis validez avec la touche verte." : this.state.phase === "reading" ? "Le terminal contrôle votre code et confirme la commande." : "La carte est transmise au terminal pour validation de la commande.",
      order: this.order,
      reset: this.reset,
      close: this.close,
      toggleFlip: this.toggleFlip,
      onName: this.onName,
      name: this.state.name,
      flipLabel: this.state.flip ? "Voir le recto" : "Voir le verso",
      cardTier: c ? c.tier : "",
      texName: this.TEX_NAMES[this.state.tex] || "",
      patName: (this.PAT_NAMES || [])[(this.PATTERNS || []).indexOf(this.state.pat)] || "",
      patterns: (this.PATTERNS || []).map((k, n) => ({
        key: k,
        label: this.PAT_NAMES[n],
        mount: (el) => {
          if (!el) return;
          const url = this.patThumb[k];
          el.style.backgroundImage = url ? "url(" + url + ")" : "none";
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = "center";
        },
        none: k === "none",
        pick: () => this.pickPat(k),
        ring: k === this.state.pat ? "2px solid rgba(255,255,255,.85)" : "1px solid rgba(255,255,255,.12)",
        dim: k === this.state.pat ? 1 : 0.55
      })),

      textures: this.VIDEOS.map((src, n) => ({
        src,
        mount: (el) => {
          const rec = this.vids && this.vids[n];
          if (!rec || !rec.el) return;
          const v = rec.el;
          if (!el) { if (!v.paused) return; v.play().catch(() => {}); return; }
          if (v.parentNode === el) return;
          v.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block";
          el.appendChild(v);
          if (v.paused) v.play().catch(() => {});
        },
        label: this.TEX_NAMES[n] || "",
        pick: () => this.pickTex(n),
        ring: n === this.state.tex ? "2px solid rgba(255,255,255,.85)" : "1px solid rgba(255,255,255,.12)",
        dim: n === this.state.tex ? 1 : 0.62
      }))
    };
  }
}

export default Component;
