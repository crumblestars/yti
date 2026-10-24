/* Local 20s loop. GPU compositing avoids reading every video pixel on the CPU. */
(()=>{'use strict';
const root=document.createElement('div');root.className='dc-mobile-background';root.setAttribute('aria-hidden','true');document.body.prepend(root);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
if(reduce.matches||navigator.connection?.saveData)return;
const video=document.createElement('video');video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.setAttribute('playsinline','');video.preload='auto';video.poster='mobile-background.webp';video.src='mobile-background.mp4';root.append(video);
const canvas=document.createElement('canvas');root.append(canvas);
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});
let raf=0,last=0,hit={x:0,y:0,time:-100};
const play=()=>{if(!document.hidden&&!reduce.matches)video.play().catch(()=>{})};
if(!gl){canvas.remove();document.addEventListener('touchstart',play,{passive:true,once:true});document.addEventListener('visibilitychange',()=>document.hidden?video.pause():play());play();return}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
const program=gl.createProgram();
try{
gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0,1);}'));
gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;
varying vec2 uv;uniform sampler2D footage;uniform sampler2D code;uniform vec2 crop;uniform vec2 pointer;uniform float reveal;uniform float drift;
void main(){vec2 q=(uv-.5)*crop+.5;vec3 base=texture2D(footage,q).rgb;
float dark=clamp((32./255.-max(base.r,max(base.g,base.b)))/(26./255.),0.,1.);
float distanceToPointer=length(q*vec2(720.,1280.)-pointer);
float halo=clamp((214.6-distanceToPointer)/139.2,0.,1.);
vec3 letters=texture2D(code,vec2((q.x+drift)/3.,q.y)).rgb;
gl_FragColor=vec4(base+letters*(.055+.42*reveal*halo)*dark,1.);}`));
gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Background shader link failed');
}catch(error){canvas.remove();play();return}
gl.useProgram(program);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
function texture(unit){gl.activeTexture(gl.TEXTURE0+unit);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);for(const name of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,name,gl.CLAMP_TO_EDGE);for(const name of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,name,gl.LINEAR);return t}
const vt=texture(0);gl.uniform1i(gl.getUniformLocation(program,'footage'),0);
const tile=document.createElement('canvas');tile.width=2160;tile.height=1280;const ctx=tile.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,2160,1280);ctx.font='20px Courier New,monospace';
const snippets=["<div>", "</div>", "<p>", "</p>", "<span>", "</span>", "<h1>", "</h1>", "<h2>", "</h2>", "<a href=\"\">", "</a>", "<ul>", "<li>", "</li>", "</ul>", "<nav>", "</nav>", "<header>", "</header>", "<footer>", "</footer>", "<section>", "</section>", "<main>", "</main>", "<form>", "</form>", "<input />", "<button>", "</button>", "class=\"container\"", "id=\"app\"", "href=\"#\"", "src=\"\"", "alt=\"\"", "type=\"text\"", "<!DOCTYPE html>", "<html>", "</html>", "<head>", "<body>", "</body>", "display:flex", "display:grid", "position:absolute", "overflow:hidden", "margin:0 auto", "padding:16px", "color:#dce4f3", "width:100%", "height:100vh", "font-size:14px", "border-radius:8px", "background:#03040a", "z-index:10", "justify-content:center", "align-items:center", "flex-direction:column", "@media (max-width:768px)", "::before", "::after", ":hover", ":root", "var(--electric)", "calc(100% - 20px)", "transition:all 0.3s", "opacity:0.5", "transform:translateX(-50%)", "box-shadow:0 4px 12px", "grid-template-columns", "rgba(210,225,255,0.5)", "linear-gradient(135deg,", "border:1px solid #dce4f3", "font-family:monospace", "letter-spacing:2px", "text-transform:uppercase"];
let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
for(let y=26,i=0;y<1280;y+=30,i++){ctx.fillStyle=`hsl(${[224,224,224,224,224,14,14,14,316,269][i%10]} 75% ${32+i%4*6}%)`;let line='';for(let j=0;j<30;j++)line+=snippets[Math.floor(rand()*snippets.length)]+'  ';ctx.fillText(line,-rand()*400,y)}
texture(1);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,tile);gl.uniform1i(gl.getUniformLocation(program,'code'),1);
const uniforms={};for(const k of ['crop','pointer','reveal','drift'])uniforms[k]=gl.getUniformLocation(program,k);
let cropX=1,cropY=1;
function resize(){const w=innerWidth,h=innerHeight,scale=Math.min(devicePixelRatio||1,1.5,720/w,1280/h);canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);gl.viewport(0,0,canvas.width,canvas.height);const aspect=w/h;cropX=aspect<720/1280?aspect/(720/1280):1;cropY=aspect>720/1280?(720/1280)/aspect:1;gl.uniform2f(uniforms.crop,cropX,cropY)}
resize();window.addEventListener('resize',resize,{passive:true});
function point(x,y){hit={x:((x/innerWidth-.5)*cropX+.5)*720,y:((y/innerHeight-.5)*cropY+.5)*1280,time:performance.now()/1000}}
// touchmove continues to reveal while the browser scrolls; no preventDefault.
document.addEventListener('touchstart',e=>{if(e.touches[0])point(e.touches[0].clientX,e.touches[0].clientY);play()},{passive:true});
document.addEventListener('touchmove',e=>{if(e.touches[0])point(e.touches[0].clientX,e.touches[0].clientY)},{passive:true});
document.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')point(e.clientX,e.clientY)},{passive:true});
function draw(now){raf=0;if(document.hidden||reduce.matches)return;raf=requestAnimationFrame(draw);if(now-last<1000/24||video.readyState<2)return;last=now;const age=now/1000-hit.time;const envelope=Math.max(0,Math.min(1,(6-age)/1.6));gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,vt);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);gl.uniform2f(uniforms.pointer,hit.x,hit.y);gl.uniform1f(uniforms.reveal,envelope);gl.uniform1f(uniforms.drift,40*(1-Math.cos(2*Math.PI*video.currentTime/20))/720);gl.drawArrays(gl.TRIANGLES,0,6);video.style.visibility='hidden'}
function sync(){cancelAnimationFrame(raf);raf=0;if(document.hidden||reduce.matches){video.pause();if(reduce.matches){canvas.style.visibility='hidden';video.style.visibility='hidden'}}else{canvas.style.visibility='visible';play();raf=requestAnimationFrame(draw)}}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);canvas.style.visibility='hidden';video.style.visibility='visible'});
canvas.addEventListener('webglcontextrestored',()=>{canvas.remove();video.style.visibility='visible';play()});
document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);video.pause()});window.addEventListener('pageshow',sync);reduce.addEventListener('change',sync);sync();
})();
