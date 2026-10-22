// Mannequins de la foule (lot « maquette-mannequin », incrément 1 : silhouettes améliorées, sans animation par texture).
// Enveloppe window.simDraw : l'ancien silBody/silHead reste dans la scène, invisible, pour le clic d'individu.js (même instanceId = indice dans SIM.A).
// Corps = torse + bras (teinte du vêtement), jambes (pantalon), tête (peau), tous instanciés ; ombre de contact = disque flou instancié.
// Largeur d'épaules 0,48 m (= 2 × R de sim.js), tailles 1,55 à 1,90 m, 10 teintes, orientation lissée vers le déplacement,
// rebond et roulis liés à la vitesse AFFICHÉE, debout immobile à l'arrêt ou sur escalator, spectateurs du cinéma assis en calme.
(function () {
  if (window.MANNEQUIN) return;
  const M = window.MANNEQUIN = { on: true, ready: false, drawMs: 0, n: 0, calls: 0, stat: {} };
  const R = 0.24;
  const CLOTHES = [0xc0392b, 0x2e6fb5, 0x2f9e6b, 0xe0a82e, 0x8e44ad, 0x1f2a44, 0xd9d4c7, 0xe07a3f, 0x3d4a52, 0x5b8a8a];
  const PANTS = [0x23262e, 0x2b3a55, 0x3a3a3a, 0x5a4a38, 0x1d1d22];
  const SKINS = [0xf1c9a5, 0xd9a37a, 0xa86f4a, 0x6e4430, 0xe8b896];
  const ROLE = r => { r = String(r).toLowerCase(); return /pomp|sapeur/.test(r) ? 0xd8321f : /polic|gend|brigade/.test(r) ? 0x2358c4 : /direct|respons|chef/.test(r) ? 0x8e44ad : 0xd8f000; };
  const hash = i => { let h = (i + 1) * 2654435761 >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; };
  const col = hex => { const c = new THREE.Color(hex); if (typeof rnd !== 'undefined' && rnd.outputEncoding === THREE.sRGBEncoding) c.convertSRGBToLinear(); return c; };
  const merge = parts => { // parts: [geometry, dx, dy, dz] -> géométrie fusionnée non indexée
    const pos = [], nor = []; parts.forEach(([g, dx, dy, dz]) => { const q = g.toNonIndexed(); q.translate(dx, dy, dz); pos.push(...q.attributes.position.array); nor.push(...q.attributes.normal.array); });
    const b = new THREE.BufferGeometry(); b.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); b.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return b; };
  // Corps de base : 1,75 m, épaules 0,48 m (torse 0,40 + bras de 0,04 de rayon de chaque côté), profondeur 0,26 m
  const torsoG = merge([[new THREE.CylinderGeometry(.19, .16, .62, 8, 1, false), 0, 1.16, 0], [new THREE.CylinderGeometry(.04, .035, .62, 4, 1, true), -.2, 1.13, 0], [new THREE.CylinderGeometry(.04, .035, .62, 4, 1, true), .2, 1.13, 0]]);
  torsoG.scale(1, 1, .65);
  const legsG = merge([[new THREE.CylinderGeometry(.075, .06, .85, 5, 1, true), -.09, .425, 0], [new THREE.CylinderGeometry(.075, .06, .85, 5, 1, true), .09, .425, 0]]); legsG.scale(1, 1, .8);
  const headG = new THREE.SphereGeometry(.115, 8, 5); headG.translate(0, 1.6, 0);
  let A = null, st = null, mT, mL, mH, mS, last = performance.now();
  const Mx = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S3 = new THREE.Vector3(), E = new THREE.Euler(), C = new THREE.Color();
  const shadowTex = () => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(.55, 'rgba(0,0,0,.32)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); };
  // direction « écran » du cinéma : axe long du polygone UGC (la scène ne donne pas l'écran : hypothèse)
  let cineYaw = null;
  function cineDir() { if (cineYaw !== null) return cineYaw; cineYaw = 0; try { const o = SCN.interieur.find(o => /UGC/i.test(o.n || '') && o.k === 'room'); if (o) { const P = pairs(o.p); let mx = 0, mz = 0; P.forEach(p => { mx += p[0]; mz += p[1]; }); mx /= P.length; mz /= P.length; let sxx = 0, szz = 0, sxz = 0; P.forEach(p => { const a = p[0] - mx, b = p[1] - mz; sxx += a * a; szz += b * b; sxz += a * b; }); const th = .5 * Math.atan2(2 * sxz, sxx - szz); cineYaw = Math.atan2(Math.cos(th), Math.sin(th)); } } catch (e) {} return cineYaw; }
  function build(n) {
    if (mT) { [mT, mL, mH, mS].forEach(m => { m.parent && m.parent.remove(m); m.dispose && m.dispose(); }); }
    const mk = (g, mat) => { const m = new THREE.InstancedMesh(g, mat, n); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.setColorAt(0, C.set(0xffffff)); m.instanceColor.setUsage(THREE.DynamicDrawUsage); m.count = 0; return m; };
    mT = mk(torsoG, new THREE.MeshStandardMaterial({ roughness: .85 })); mL = mk(legsG, new THREE.MeshStandardMaterial({ roughness: .9 })); mH = mk(headG, new THREE.MeshStandardMaterial({ roughness: .7 }));
    const sg = new THREE.CircleGeometry(.4, 10); sg.rotateX(-Math.PI / 2);
    mS = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), n);
    mS.frustumCulled = false; mS.renderOrder = 4; mS.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mS.count = 0;
    const par = (silBody && silBody.parent) || scene; par.add(mT, mL, mH, mS);
    // état par personne
    st = { n, h: new Float32Array(n), w: new Float32Array(n), yaw: new Float32Array(n), px: new Float32Array(n), py: new Float32Array(n), pz: new Float32Array(n), sp: new Float32Array(n), ph: new Float32Array(n), ok: new Uint8Array(n), cl: new Float32Array(n * 3), pn: new Float32Array(n * 3), sk: new Float32Array(n * 3), seat: new Float32Array(n) };
    for (let i = 0; i < n; i++) { const u = (hash(i) + hash(i + 7777)) / 2; st.h[i] = 1.55 + .35 * u; st.w[i] = .92 + .16 * hash(i + 31); st.ph[i] = hash(i + 5) * 6.283;
      C.copy(col(CLOTHES[(hash(i + 11) * CLOTHES.length) | 0])); st.cl.set([C.r, C.g, C.b], i * 3); C.copy(col(PANTS[(hash(i + 13) * PANTS.length) | 0])); st.pn.set([C.r, C.g, C.b], i * 3); C.copy(col(SKINS[(hash(i + 17) * SKINS.length) | 0])); st.sk.set([C.r, C.g, C.b], i * 3); }
    M.ready = true;
  }
  const wrapped = window.simDraw;
  window.simDraw = function () {
    wrapped();
    if (!M.on || !silBody || !SIM.A) return;
    try { draw(); } catch (e) { console.warn('mannequin', e); M.on = false; silBody.visible = silHead.visible = true; [mT, mL, mH, mS].forEach(m => m && (m.visible = false)); }
  };
  function draw() {
    const t0 = performance.now(), now = t0, dt = Math.min(.1, Math.max(.001, (now - last) / 1000)); last = now;
    const a_ = SIM.A, n = Math.min(a_.length, silBody.instanceMatrix.count);
    if (A !== a_ || !mT || st.n !== n) { A = a_; build(n); }
    const par = silBody.parent || scene; if (mT.parent !== par) par.add(mT, mL, mH, mS);
    silBody.visible = silHead.visible = false; mT.visible = mL.visible = mH.visible = mS.visible = true;
    const src = silBody.instanceMatrix.array, calm = SIM.mode === 'calme', cy = cineDir();
    let k = 0, seated = 0, moving = 0; const cT = mT.instanceColor.array, cL = mL.instanceColor.array, cH = mH.instanceColor.array;
    for (let i = 0; i < n; i++) {
      const a = a_[i], o = i * 16; let y = src[o + 13];
      if (y < -9000 || a.out) { st.ok[i] = 0; continue; }
      const x = src[o + 12], z = src[o + 14]; y -= Math.abs(Math.sin(walkT * 7 + i)) * .04;
      let sp = st.sp[i], hd = st.yaw[i];
      if (st.ok[i]) { const dx = x - st.px[i], dz = z - st.pz[i], d = Math.hypot(dx, dz); const inst = d > 3 ? 0 : d / dt; sp += (inst - sp) * Math.min(1, dt / .25);
        if (inst > .25 && d <= 3) { const tg = Math.atan2(dx, dz); let df = tg - hd; df = Math.atan2(Math.sin(df), Math.cos(df)); const mx = 6.283 * dt; hd += Math.max(-mx, Math.min(mx, df)); } }
      else { sp = 0; hd = Math.atan2(a.vx, a.vz) || 0; }
      st.sp[i] = sp; st.yaw[i] = hd; st.px[i] = x; st.pz[i] = z; st.ok[i] = 1;
      const sit = calm && a.kind === 'cine'; if (sit) hd = cy; const onRide = !!a.ride;
      const walking = !sit && !onRide && sp > .15; if (walking) { moving++; st.ph[i] += dt * sp * Math.PI / .7; }  // un pas (rebond) tous les 0,7 m parcourus à l'écran : cadence proportionnelle à la vitesse affichée
      const amp = walking ? Math.min(1, sp / 1.4) : 0, bob = Math.abs(Math.sin(st.ph[i])) * .035 * amp, roll = Math.sin(st.ph[i]) * .045 * amp;
      const h = st.h[i], sy = h / 1.75, sx = st.w[i], sz = st.w[i] * 1.0, drop = sit ? .42 * sy : 0; if (sit) seated++;
      E.set(0.04 * amp, hd, roll); Q.setFromEuler(E);
      // torse + tête
      Mx.compose(V.set(x, y - drop + bob * sy, z), Q, S3.set(sx, sy, sz)); Mx.toArray(mT.instanceMatrix.array, k * 16); Mx.toArray(mH.instanceMatrix.array, k * 16);
      // jambes (raccourcies si assis : posture « mannequin abaissé »)
      Mx.compose(V.set(x, y, z), Q.setFromEuler(E.set(0, hd, 0)), S3.set(sx, sit ? sy * .55 : sy, sz)); Mx.toArray(mL.instanceMatrix.array, k * 16);
      // ombre de contact
      Mx.compose(V.set(x, y + .04, z), Q.identity(), S3.set(sx * 1.05, 1, sx * 1.05)); Mx.toArray(mS.instanceMatrix.array, k * 16);
      // couleurs : gilet de rôle, sinon teinte ; état en teinte légère (attente gris, hésitation ambre, densité rouge)
      let r = st.cl[i * 3], g = st.cl[i * 3 + 1], b = st.cl[i * 3 + 2];
      if (a.role) { C.copy(col(ROLE(a.role))); r = C.r; g = C.g; b = C.b; }
      else { let sc = null; if (!calm) { if (SIM.T < a.pre + SIM.delay) sc = 0x8E928F; else if (a.hes > 0) sc = 0xC98A12; else if (a.dens >= 5) sc = 0xE0461F; } if (sc !== null) { C.copy(col(sc)); r += (C.r - r) * .3; g += (C.g - g) * .3; b += (C.b - b) * .3; } }
      cT[k * 3] = r; cT[k * 3 + 1] = g; cT[k * 3 + 2] = b; cL[k * 3] = st.pn[i * 3]; cL[k * 3 + 1] = st.pn[i * 3 + 1]; cL[k * 3 + 2] = st.pn[i * 3 + 2]; cH[k * 3] = st.sk[i * 3]; cH[k * 3 + 1] = st.sk[i * 3 + 1]; cH[k * 3 + 2] = st.sk[i * 3 + 2];
      k++;
    }
    [mT, mL, mH, mS].forEach(m => { m.count = k; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; });
    M.n = k; M.seated = seated; M.moving = moving; M.drawMs = M.drawMs * .9 + (performance.now() - t0) * .1;
  }
  // hors simulation (movePeople), les anciennes silhouettes redeviennent visibles
  (function watch() { requestAnimationFrame(watch); try { if (typeof SIM !== 'undefined' && !SIM.on && silBody) { silBody.visible = silHead.visible = true; [mT, mL, mH, mS].forEach(m => m && (m.visible = false)); } } catch (e) {} })();
})();
