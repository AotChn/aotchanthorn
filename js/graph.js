/*---------------------------------
// INITIALIZE CHART
---------------------------------*/

//width of chart
const W = 800;
//height of chart
const H = 400; 
//chart padding 
const P = { l:60, r:24, t:24, b:40 };
//drawable area of chart 
const chartW = W - P.l - P.r, chartH = H - P.t - P.b;


const path = document.getElementById('line');
const dot  = document.getElementById('dot');
const val  = document.getElementById('val');

/*---------------------------------
// PARAMETERS OF GRAPH/SIM
---------------------------------*/

//sim time (s)
let t = 0;
//init val 
let logv = Math.log(100);
//volitility 
let vol = 0.10;
//store points 
const series = [];
//forces x to stay in [a,b] range 
const clamp = (x,a,b)=>Math.min(Math.max(x,a),b);

// RNG funciton 
function randn(){ 
  let u=0,v=0; 
  while(!u)
    u=Math.random(); 
  while(!v)
    v=Math.random();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }


/*---------------------------------
// EXCESS DOWNTIME PREVENTION 
---------------------------------*/

// downspike prevention 
let lastPeak = 100, consecDown = 0, ddTime = 0;
//maximum amount of time (s) of downtime
const MAX_DD_TIME = 3.0;
//maximum amount of steps that is down
const MAX_CONSEC_DOWN = 12;
//added boost to rebound in case of downtime
const REBOUND_BOOST = 0.06;
//maximum allowed drop in previous value (percent)
const MAX_DRAWDOWN = 0.30;

/*---------------------------------
// EXCESS DATA ELIM FOR LAG PREVENTION
---------------------------------*/

//max points to keep 
const MAX_POINTS = 1500;       
//speed points are added in (ms)
const POINT_INTERVAL_MS = 50;   
// simulated dt passed to nextPoint()
const DATA_DT = 0.02;       
//fps cap 
const DRAW_FPS = 30;         
//elminated pixels     
const DECIMATE_PIXELS = 1.5;     

//generates next point 
function nextPoint(dt = 0.05) {
  t += dt;

  // volatility
  if (Math.random() < 0.01)  vol *= 1.8;
  if (Math.random() < 0.015) vol *= 0.7;
  vol = clamp(vol, 0.04, 0.45);

  // occasional jump (log space), upward bias 
  let jump = 0;
  if (Math.random() < 0.006) {
    const jumpSigma = 0.25;
    const sign = Math.random() < 0.55 ? 1 : -1;
    jump = sign * Math.abs(randn()) * jumpSigma;
  }

  // exponential bias w/ added noise 
  const noise = randn() * vol * Math.sqrt(dt);
  let logvNew = logv + 0.015 * dt + noise + jump;
  let vTemp = Math.exp(logvNew);

  // drawdown tracking vs last peak
  if (vTemp < lastPeak) {
    ddTime += dt; consecDown += 1;
  } else {
    lastPeak = vTemp; ddTime = 0; consecDown = 0;
  }

  // hard drawdown floor
  const floorV = lastPeak * (1 - MAX_DRAWDOWN);
  if (vTemp < floorV) { vTemp = floorV * (1 + 0.002); logvNew = Math.log(vTemp); }

  // rebound bias if down too long 
  if (ddTime > MAX_DD_TIME || consecDown >= MAX_CONSEC_DOWN) {
    const extra = REBOUND_BOOST * (1 + Math.max(0, ddTime - MAX_DD_TIME));
    logvNew += extra; vTemp = Math.exp(logvNew);
    vol *= 0.85; consecDown = Math.max(0, consecDown - 3);
    ddTime = Math.max(0, ddTime - dt * 2);
  }

  logv = logvNew;
  const v = vTemp;
  series.push({ t, v });
  if (series.length > MAX_POINTS) series.shift(); // cap history
}

// scales the data 
let yMin = null, yMax = null; // eased bounds
function easeBounds(targetMin, targetMax, alpha = 0.12) {
  // add more y space 
  const span = Math.max(1e-6, targetMax - targetMin);
  const pad  = span * 0.08;
  targetMin -= pad;
  targetMax += pad;

  if (yMin === null) { yMin = targetMin; yMax = targetMax; return; }

  // scales faster in reponse to high spikes 
  const last = series[series.length - 1]?.v ?? targetMax;
  const needsTop    = last > yMax;
  const needsBottom = last < yMin;
  const a = (needsTop || needsBottom) ? 0.5 : alpha; // jump faster if out of range

  yMin += (targetMin - yMin) * a;
  yMax += (targetMax - yMax) * a;
}

//Maps x to time
function xMap(tt){
  const tMin = series[0]?.t ?? 0;
  const tMax = series[series.length-1]?.t ?? 1;
  const span = Math.max(1e-6, tMax - tMin);
  return P.l + ((tt - tMin)/span) * chartW;
}

//Maps y to time 
function yMap(vv){
  const span = Math.max(1e-6, yMax - yMin);
  return P.t + chartH - ((vv - yMin)/span) * chartH;
}

// remove excess points 
function decimateToPixels(points){
  if (points.length <= 2) 
    return points;

  const target = Math.max(2, Math.floor(chartW / DECIMATE_PIXELS));
  const step = Math.ceil(points.length / target);
  const out = [];

  for (let i=0; i<points.length; i+=step) out.push(points[i]);
  if (out[out.length-1] !== points[points.length-1])
    out.push(points[points.length-1]);
  return out;
}

/*---------------------------------
// DRAW ALL ELEMENTS 
---------------------------------*/
function draw(){
  // compute target bounds from current window
  let minV = Infinity, maxV = -Infinity;
  for (let i=0;i<series.length;i++) { 
    const v = series[i].v; if (v<minV) minV=v; if (v>maxV) maxV=v; 
  }
  easeBounds(minV, maxV);

  const reduced = decimateToPixels(series);
  const d = reduced.map((p,i)=>(i?'L':'M') + xMap(p.t)+','+yMap(p.v)).join(' ');
  path.setAttribute('d', d);

  const last = series[series.length-1];
  const x = xMap(last.t), y = yMap(last.v);
  dot.setAttribute('cx', x); dot.setAttribute('cy', y);

  if (!draw._lastLabel || performance.now() - draw._lastLabel > 80) {
    val.setAttribute('x', x+10); val.setAttribute('y', y-10);
    val.textContent = last.v.toFixed(0);
    draw._lastLabel = performance.now();
  }
}

// consistent data rate w/ capped FPS 
let dataAcc = 0, drawAcc = 0, lastTs = performance.now();

function loop(ts){
  const elapsed = ts - lastTs; lastTs = ts;
  dataAcc += elapsed; drawAcc += elapsed;

  // add data at fixed intervals
  while (dataAcc >= POINT_INTERVAL_MS) {
    nextPoint(DATA_DT);
    dataAcc -= POINT_INTERVAL_MS;
  }

  // draw at capped FPS
  if (drawAcc >= 1000 / DRAW_FPS) { draw(); drawAcc = 0; }

  requestAnimationFrame(loop);
}

// fills data so series is not empty 
for (let i=0;i<50;i++) 
  nextPoint(DATA_DT);

requestAnimationFrame(loop);