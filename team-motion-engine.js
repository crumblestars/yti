/* Digital Concepts — click-driven Remotion portrait transition. */
(function(){
"use strict";
// Adapted from supplied Motion Canvas source; MIT, copyright (c) 2022 motion-canvas.
// Type annotations removed; implementations unchanged.
function map(from, to, value) {
  return from + (to - from) * value;
}
function easeInOutCubic(value, from = 0, to = 1) {
  value =
    value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;

  return map(from, to, value);
}
function easeInOutQuint(value, from = 0, to = 1) {
  value =
    value < 0.5
      ? 16 * value * value * value * value * value
      : 1 - Math.pow(-2 * value + 2, 5) / 2;

  return map(from, to, value);
}
function createEaseOutBack(s = 1.70158) {
  return (value, from = 0, to = 1) => {
    value = 1 + (s + 1) * Math.pow(value - 1, 3) + s * Math.pow(value - 1, 2);

    return map(from, to, value);
  };
}

// Remotion spring-utils.ts, types removed only. See LICENSE-REMOTION.md.
                      
	                      
	                
	                
	                 
	                      
  

                            
	                
	             
	                  
	                           
  

const defaultSpringConfig               = {
	damping: 10,
	mass: 1,
	stiffness: 100,
	overshootClamping: false,
};

const advanceCache                                 = {};

function advance({
	animation,
	now,
	config,
}   
	                         
	            
	                     
 )                {
	const {toValue, lastTimestamp, current, velocity} = animation;

	const deltaTime = Math.min(now - lastTimestamp, 64);

	if (config.damping <= 0) {
		throw new Error(
			'Spring damping must be greater than 0, otherwise the spring() animation will never end, causing an infinite loop.',
		);
	}

	const c = config.damping;
	const m = config.mass;
	const k = config.stiffness;

	const cacheKey = [
		toValue,
		lastTimestamp,
		current,
		velocity,
		c,
		m,
		k,
		now,
	].join('-');
	if (advanceCache[cacheKey]) {
		return advanceCache[cacheKey];
	}

	const v0 = -velocity;
	const x0 = toValue - current;

	const zeta = c / (2 * Math.sqrt(k * m)); // damping ratio
	const omega0 = Math.sqrt(k / m); // undamped angular frequency of the oscillator (rad/ms)
	const omega1 = omega0 * Math.sqrt(1 - zeta ** 2); // exponential decay

	const t = deltaTime / 1000;

	const sin1 = Math.sin(omega1 * t);
	const cos1 = Math.cos(omega1 * t);

	// under damped
	const underDampedEnvelope = Math.exp(-zeta * omega0 * t);
	const underDampedFrag1 =
		underDampedEnvelope *
		(sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);

	const underDampedPosition = toValue - underDampedFrag1;
	// This looks crazy -- it's actually just the derivative of the oscillation function
	const underDampedVelocity =
		zeta * omega0 * underDampedFrag1 -
		underDampedEnvelope *
			(cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1);

	// critically damped
	const criticallyDampedEnvelope = Math.exp(-omega0 * t);
	const criticallyDampedPosition =
		toValue - criticallyDampedEnvelope * (x0 + (v0 + omega0 * x0) * t);

	const criticallyDampedVelocity =
		criticallyDampedEnvelope *
		(v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0);

	const animationNode                = {
		toValue,
		prevPosition: current,
		lastTimestamp: now,
		current: zeta < 1 ? underDampedPosition : criticallyDampedPosition,
		velocity: zeta < 1 ? underDampedVelocity : criticallyDampedVelocity,
	};
	advanceCache[cacheKey] = animationNode;
	return animationNode;
}

const calculationCache                                 = {};

function springCalculation({
	frame,
	fps,
	config = {},
}   
	              
	            
	                               
 )                {
	const from = 0;
	const to = 1;
	// An explicit `undefined` (e.g. a forwarded optional prop) must not
	// override the defaults, otherwise the physics turn into NaN
	const resolvedConfig               = {
		damping: config.damping ?? defaultSpringConfig.damping,
		mass: config.mass ?? defaultSpringConfig.mass,
		stiffness: config.stiffness ?? defaultSpringConfig.stiffness,
		overshootClamping:
			config.overshootClamping ?? defaultSpringConfig.overshootClamping,
	};
	const cacheKey = [
		frame,
		fps,
		resolvedConfig.damping,
		resolvedConfig.mass,
		resolvedConfig.overshootClamping,
		resolvedConfig.stiffness,
	].join('-');
	if (calculationCache[cacheKey]) {
		return calculationCache[cacheKey];
	}

	let animation                = {
		lastTimestamp: 0,
		current: from,
		toValue: to,
		velocity: 0,
		prevPosition: 0,
	};
	const frameClamped = Math.max(0, frame);
	const unevenRest = frameClamped % 1;
	for (let f = 0; f <= Math.floor(frameClamped); f++) {
		const time = (f / fps) * 1000;
		animation = advance({
			animation,
			now: time,
			config: resolvedConfig,
		});
	}

	if (unevenRest > 0) {
		animation = advance({
			animation,
			now: (frameClamped / fps) * 1000,
			config: resolvedConfig,
		});
	}

	calculationCache[cacheKey] = animation;
	return animation;
}


function makePortraitMotion(createCanvas,images,mesh,easing,remotion,resolution){
 const S=resolution || 480;
 const layers=[createCanvas(S,S),createCanvas(S,S)];
 const merged=createCanvas(S,S),mc=merged.getContext('2d');
 const mask=createCanvas(S,S),maskctx=mask.getContext('2d');
 const clamp=x=>Math.max(0,Math.min(1,x));
 function warp(canvas,img,src,dst){
  const c=canvas.getContext('2d');c.resetTransform();c.clearRect(0,0,S,S);
  for(const ids of mesh.triangles){
   const p=ids.map(i=>src[i].map(v=>v*S)),q=ids.map(i=>dst[i].map(v=>v*S));
   const x1=p[1][0]-p[0][0],y1=p[1][1]-p[0][1],x2=p[2][0]-p[0][0],y2=p[2][1]-p[0][1],det=x1*y2-x2*y1;
   if(Math.abs(det)<.001)continue;
   const u1=q[1][0]-q[0][0],v1=q[1][1]-q[0][1],u2=q[2][0]-q[0][0],v2=q[2][1]-q[0][1];
   const a=(u1*y2-u2*y1)/det,b=(v1*y2-v2*y1)/det,cc=(u2*x1-u1*x2)/det,d=(v2*x1-v1*x2)/det;
   c.save();c.beginPath();
   const cx=(q[0][0]+q[1][0]+q[2][0])/3,cy=(q[0][1]+q[1][1]+q[2][1])/3;
   q.forEach(([x,y],i)=>{const len=Math.hypot(x-cx,y-cy)||1;const xx=x+(x-cx)/len*1.6,yy=y+(y-cy)/len*1.6;i?c.lineTo(xx,yy):c.moveTo(xx,yy)});
   c.closePath();c.clip();c.setTransform(a,b,cc,d,q[0][0]-a*p[0][0]-cc*p[0][1],q[0][1]-b*p[0][0]-d*p[0][1]);
   c.drawImage(img,0,0,S,S);c.restore();
  }
 }
 function draw(ctx,elapsed,size,index,next){
  const frame=elapsed == null ? 0 : Math.min(150, 80 + elapsed*60);
  const spring=(frame,config)=>remotion.springCalculation({frame,fps:60,config}).current;
  ctx.clearRect(0,0,size,size);ctx.save();ctx.scale(size,size);
  ctx.beginPath();ctx.arc(.5,.5,.464,0,Math.PI*2);ctx.clip();ctx.fillStyle='#12365c';ctx.fillRect(0,0,1,1);
  ctx.strokeStyle='#bdb39d';ctx.lineWidth=.0045;ctx.lineCap='round';ctx.beginPath();ctx.arc(.5,.5,.442,-1.83,.48);ctx.stroke();ctx.beginPath();ctx.arc(.5,.5,.442,2.60,3.95);ctx.stroke();
  let amount=0,asset=images[index],sy=1,sx=1,dy=0,angle=0;
  const prepare=easing.easeInOutCubic(clamp((frame-80)/12));
  let tension=prepare;
  if(frame>=92)tension=1-spring(frame-92,{mass:.8,stiffness:210,damping:18});
  if(frame>146)tension=0;
  sy=1-.035*tension;sx=1+.014*tension;dy=.011*tension;
  angle=.013*tension*(index===1?-1:1);
  if(frame>=92){
   const t=clamp((frame-92)/40);
   const config={mass:.9,stiffness:135,damping:24};
   amount=clamp(spring(t*40,config)/spring(40,config));
   if(amount>0&&amount<1){
    const target=mesh.points[index].map((p,i)=>p.map((v,j)=>easing.map(v,mesh.points[next][i][j],amount)));
    warp(layers[0],images[index],mesh.points[index],target);warp(layers[1],images[next],mesh.points[next],target);
    // A narrow, travelling blend transfers the body, face and hair in sequence.
    // Complementary masks prevent full-face double exposures.
    const edge=S*(1.08-1.16*amount),feather=S*.031;
    for(let k=0;k<2;k++){
     const lc=layers[k].getContext('2d');maskctx.clearRect(0,0,S,S);
     for(let x=0;x<S;x+=5){
      const wave=edge+S*.025*Math.cos((x/S-.5)*Math.PI*2)*Math.sin(Math.PI*amount);
      const g=maskctx.createLinearGradient(0,wave-feather,0,wave+feather);
      g.addColorStop(0,k?'rgba(0,0,0,0)':'rgba(0,0,0,1)');g.addColorStop(1,k?'rgba(0,0,0,1)':'rgba(0,0,0,0)');
      maskctx.fillStyle=g;maskctx.fillRect(x,0,5,S);
     }lc.save();lc.globalCompositeOperation='destination-in';lc.drawImage(mask,0,0);lc.restore();
    }
    mc.clearRect(0,0,S,S);mc.globalCompositeOperation='source-over';mc.drawImage(layers[0],0,0);mc.globalCompositeOperation='lighter';mc.drawImage(layers[1],0,0);mc.globalCompositeOperation='source-over';asset=merged;
   }else if(amount===1)asset=images[next];
  }
  ctx.translate(.5,.95+dy);ctx.rotate(angle);ctx.scale(sx,sy);ctx.drawImage(asset,-.46,-.91,.92,.92);
  ctx.restore();
 }
 return draw;
}


const mesh={"points": [[[0.0, 0.0], [0.25, 0.0], [0.5, 0.0], [0.75, 0.0], [1.0, 0.0], [1.0, 0.25], [1.0, 0.5], [1.0, 0.75], [1.0, 1.0], [0.75, 1.0], [0.5, 1.0], [0.25, 1.0], [0.0, 1.0], [0.0, 0.75], [0.0, 0.5], [0.0, 0.25], [0.49, 0.123], [0.32, 0.2], [0.64, 0.195], [0.286, 0.305], [0.674, 0.332], [0.312, 0.239], [0.46, 0.245], [0.563, 0.24], [0.283, 0.352], [0.33, 0.34], [0.373, 0.351], [0.41, 0.351], [0.461, 0.34], [0.508, 0.354], [0.288, 0.387], [0.327, 0.397], [0.356, 0.392], [0.409, 0.39], [0.449, 0.4], [0.486, 0.394], [0.361, 0.432], [0.333, 0.482], [0.4, 0.488], [0.355, 0.537], [0.4, 0.547], [0.446, 0.536], [0.405, 0.566], [0.282, 0.508], [0.334, 0.598], [0.447, 0.65], [0.565, 0.603], [0.623, 0.432], [0.663, 0.409], [0.644, 0.48], [0.413, 0.694], [0.618, 0.658], [0.5, 0.768], [0.277, 0.744], [0.753, 0.751], [0.144, 0.827], [0.866, 0.81], [0.5, 0.974]], [[0.0, 0.0], [0.25, 0.0], [0.5, 0.0], [0.75, 0.0], [1.0, 0.0], [1.0, 0.25], [1.0, 0.5], [1.0, 0.75], [1.0, 1.0], [0.75, 1.0], [0.5, 1.0], [0.25, 1.0], [0.0, 1.0], [0.0, 0.75], [0.0, 0.5], [0.0, 0.25], [0.49, 0.12], [0.25, 0.21], [0.68, 0.2], [0.24, 0.32], [0.75, 0.41], [0.3, 0.26], [0.45, 0.249], [0.58, 0.27], [0.28, 0.378], [0.325, 0.369], [0.367, 0.379], [0.414, 0.376], [0.46, 0.368], [0.507, 0.386], [0.285, 0.409], [0.32, 0.417], [0.354, 0.414], [0.409, 0.413], [0.449, 0.422], [0.489, 0.412], [0.36, 0.454], [0.338, 0.501], [0.393, 0.501], [0.341, 0.551], [0.387, 0.562], [0.444, 0.552], [0.39, 0.58], [0.281, 0.513], [0.32, 0.594], [0.433, 0.646], [0.552, 0.594], [0.598, 0.436], [0.642, 0.416], [0.622, 0.488], [0.42, 0.717], [0.611, 0.714], [0.51, 0.756], [0.261, 0.754], [0.758, 0.757], [0.147, 0.857], [0.863, 0.856], [0.5, 0.977]], [[0.0, 0.0], [0.25, 0.0], [0.5, 0.0], [0.75, 0.0], [1.0, 0.0], [1.0, 0.25], [1.0, 0.5], [1.0, 0.75], [1.0, 1.0], [0.75, 1.0], [0.5, 1.0], [0.25, 1.0], [0.0, 1.0], [0.0, 0.75], [0.0, 0.5], [0.0, 0.25], [0.49, 0.077], [0.28, 0.14], [0.67, 0.18], [0.26, 0.3], [0.7, 0.33], [0.29, 0.26], [0.47, 0.23], [0.58, 0.25], [0.277, 0.363], [0.329, 0.35], [0.375, 0.37], [0.422, 0.355], [0.474, 0.352], [0.522, 0.37], [0.286, 0.394], [0.322, 0.401], [0.357, 0.397], [0.416, 0.394], [0.464, 0.4], [0.502, 0.395], [0.372, 0.426], [0.34, 0.481], [0.402, 0.484], [0.351, 0.553], [0.393, 0.562], [0.44, 0.55], [0.392, 0.583], [0.273, 0.508], [0.3, 0.618], [0.411, 0.677], [0.554, 0.619], [0.62, 0.436], [0.674, 0.417], [0.654, 0.489], [0.41, 0.703], [0.609, 0.665], [0.512, 0.753], [0.267, 0.74], [0.72, 0.735], [0.143, 0.829], [0.861, 0.799], [0.5, 0.974]]], "triangles": [[16, 1, 2], [17, 16, 22], [16, 17, 1], [1, 17, 0], [20, 5, 6], [11, 57, 10], [7, 54, 6], [57, 9, 10], [9, 57, 54], [5, 3, 4], [51, 49, 54], [49, 20, 6], [54, 49, 6], [43, 53, 14], [57, 53, 50], [53, 57, 11], [17, 15, 0], [46, 49, 51], [57, 52, 54], [52, 51, 54], [52, 57, 50], [52, 46, 51], [56, 7, 8], [9, 56, 8], [7, 56, 54], [56, 9, 54], [3, 18, 2], [18, 16, 2], [18, 5, 20], [18, 3, 5], [21, 17, 22], [27, 21, 22], [47, 46, 41], [46, 47, 49], [35, 47, 41], [47, 35, 29], [55, 11, 12], [55, 53, 11], [45, 42, 41], [46, 45, 41], [45, 52, 50], [52, 45, 46], [44, 53, 43], [53, 44, 50], [44, 45, 50], [45, 44, 42], [16, 23, 22], [18, 23, 16], [23, 29, 22], [23, 18, 20], [26, 27, 33], [21, 26, 25], [26, 21, 27], [19, 25, 24], [19, 21, 25], [15, 19, 14], [19, 24, 14], [19, 15, 17], [21, 19, 17], [25, 30, 24], [24, 30, 14], [30, 43, 14], [38, 36, 33], [35, 28, 29], [29, 28, 22], [28, 27, 22], [13, 55, 12], [53, 13, 14], [55, 13, 53], [48, 47, 29], [23, 48, 29], [48, 23, 20], [49, 48, 20], [47, 48, 49], [31, 30, 25], [34, 38, 33], [34, 28, 35], [34, 35, 41], [38, 34, 41], [27, 34, 33], [28, 34, 27], [42, 40, 41], [40, 38, 41], [31, 32, 36], [36, 32, 33], [32, 26, 33], [26, 32, 25], [32, 31, 25], [40, 39, 38], [39, 44, 43], [44, 39, 42], [39, 40, 42], [38, 37, 36], [39, 37, 38], [37, 39, 43], [37, 31, 36], [30, 37, 43], [31, 37, 30]]};
window.DCTeamMotion=function(images,size){return makePortraitMotion(function(w,h){const c=document.createElement("canvas");c.width=w;c.height=h;return c;},images,mesh,{map,easeInOutCubic}, {springCalculation},size)};
})();
