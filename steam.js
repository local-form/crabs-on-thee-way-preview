'use strict';
// Steam off each boil tray on the table: one WebGL pass, up to 8 plumes (positions from table.js), thicker the hotter you pick.
// Half resolution, pixel ratio capped at 1.5, ~30 fps, runs only while the table is on screen and the tab is visible.
// Reduced motion or ?t=<sec>: one still frame. No WebGL: the canvas is removed and the photos stand alone.
(() => {
  const c = document.querySelector('#spread .steam'); if (!c) return;
  const box = c.parentElement;
  const gl = c.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) { c.remove(); return; }
  const vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  const fs = `precision mediump float;
uniform vec2 r;uniform float t;uniform float k;uniform vec4 s[8];
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
void main(){
 vec2 px=gl_FragCoord.xy;
 float a=0.;
 for(int i=0;i<8;i++){
  vec4 q=s[i]; if(q.w<.5) continue;
  float up=(px.y-q.y)/q.z;
  if(up<-.45||up>1.6) continue;
  float fi=float(i);
  float sway=sin(up*2.4+t*.6+fi*1.7)*.16*(up+.4);
  float dx=(px.x-q.x)/q.z-sway;
  float spread=.26+up*.22;
  float col=exp(-dx*dx/(spread*spread)*1.4);
  vec2 p=vec2(dx*2.+fi*3.1,up*2.4-t*.55);
  float w=fbm(p+vec2(fbm(p*1.3+t*.12),0.)*1.4);
  float puff=smoothstep(.34,.82,w);
  float life=smoothstep(-.05,.18,up)*exp(-up*1.2);
  a+=col*puff*life;
 }
 a=clamp(a*(.7+k*.7),0.,.5);
 gl_FragColor=vec4(vec3(.98,.97,.95)*a,a);
}`;
  const sh = (type, src) => { const x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { c.remove(); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't'), uK = gl.getUniformLocation(pr, 'k'), uS = gl.getUniformLocation(pr, 's');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fixed = new URLSearchParams(location.search).get('t');
  let w = 0, ht = 0, sc = 1, src = new Float32Array(32), raw = [];
  const size = () => {
    const b = c.getBoundingClientRect(); sc = Math.min(devicePixelRatio || 1, 1.5) * .5;
    const nw = Math.max(1, Math.round(b.width * sc)), nh = Math.max(1, Math.round(b.height * sc));
    if (nw !== w || nh !== ht) { w = c.width = nw; ht = c.height = nh; gl.viewport(0, 0, w, ht); }
    const H = b.height;
    src = new Float32Array(32);
    raw.forEach(([x, y, tw], i) => src.set([x * sc, (H - y) * sc, tw * sc, 1], i * 4));
  };
  const heat = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--heat')) || .66;
  let hk = heat();
  const draw = sec => { gl.uniform2f(uR, w, ht); gl.uniform1f(uT, sec); gl.uniform1f(uK, hk); gl.uniform4fv(uS, src); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  let run = false, last = 0, onScreen = false; const t0 = performance.now();
  const still = () => { size(); hk = heat(); draw(fixed ? +fixed : 20); };
  const frame = now => { if (!run) return; requestAnimationFrame(frame); if (now - last < 32) return; last = now; draw((now - t0) / 1000 + 20); };
  const start = () => { if (run || reduce || fixed || !onScreen || document.hidden) return; run = true; requestAnimationFrame(frame); };
  const stop = () => { run = false; };
  box.addEventListener('table:laid', e => { raw = e.detail.src; hk = heat(); size(); if (!run) still(); });
  addEventListener('resize', () => { size(); if (!run) still(); });
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { onScreen = es[0].isIntersecting; onScreen ? (size(), start()) : stop(); }).observe(box);
  else onScreen = true;
  still(); start();
})();
