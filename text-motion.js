/* Reference editorial motion: 35–100% title illumination + 22px rise.
   No text splitting, so translations, emphasis and accessible names stay intact. */
(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const titleSelector='.section-title,.portfolio-title,.card-title,.tl-heading,.page-title';
 const copySelector='.section-label,.portfolio-desc,.card-text,.tl-desc,.tl-stat,.lead,.pricing-note,.page-sub,.page-meta';
 const heroSelector='.hero-tag,.hero-title,.hero-subtitle,.hero-scroll';
 let frame=0,items=[],active=new Map();const seen=new WeakSet();
 const clamp=n=>Math.min(1,Math.max(0,n));
 function render(){
  frame=0;if(reduce.matches)return;
  const vh=innerHeight;
  const updates=[];
  items.forEach(({el,title,index})=>{
   if(!el.isConnected||!el.getClientRects().length)return;
   const rect=el.getBoundingClientRect();
   if(rect.bottom< -100||rect.top>vh+120)return;
   // offsetHeight is unaffected by translation; subtract current translation
   // to prevent motion feeding back into its own progress measurement.
   const current=parseFloat(el.dataset.dcTextY||0);
   const p=clamp((vh*.92-(rect.top-current))/(vh*.48));
   const q=title?p:clamp(p*1.25-(index%3)*.06);
   const y=(1-q)*(title?22:24);
   updates.push({el,title,p,q,y});
  });
  updates.forEach(({el,title,p,q,y})=>{
   el.dataset.dcTextY=String(y);
   el.style.setProperty('--dc-text-y',y.toFixed(2)+'px');
   if(title)el.style.setProperty('--dc-read',(35+p*65).toFixed(1)+'%');
   else el.style.setProperty('--dc-copy-opacity',String(.45+q*.55));
  });
 }
 function queue(){if(!frame)frame=requestAnimationFrame(render);}
 function clear(el){el.classList.remove('dc-text-title','dc-text-copy');['--dc-read','--dc-text-y','--dc-copy-opacity'].forEach(k=>el.style.removeProperty(k));delete el.dataset.dcTextY;}
 function setup(){
  items.forEach(({el})=>clear(el));items=[];
  active.forEach((animation,el)=>{if(reduce.matches||!el.isConnected){animation.cancel();active.delete(el);}});
  if(reduce.matches || document.documentElement.lang==='ar'){active.forEach(animation=>animation.cancel());active.clear();return;}
  document.querySelectorAll(titleSelector).forEach(el=>{el.classList.add('dc-text-title');items.push({el,title:true,index:0});});
  document.querySelectorAll(copySelector).forEach((el,index)=>{el.classList.add('dc-text-copy');items.push({el,title:false,index});});
  document.querySelectorAll(heroSelector).forEach((el,index)=>{
   if(seen.has(el)||!el.animate)return;seen.add(el);
   const r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
   const animation=el.animate([{opacity:.25,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:850,delay:(index%4)*90,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
   active.set(el,animation);animation.onfinish=()=>active.delete(el);
  });queue();
 }
 let timer;
 const observer=new MutationObserver(records=>{
  if(!records.some(r=>r.attributeName==='lang'||r.type==='characterData'||(r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&(n.matches?.(titleSelector+','+copySelector+','+heroSelector)||n.querySelector?.(titleSelector+','+copySelector+','+heroSelector))))))return;
  clearTimeout(timer);timer=setTimeout(setup,60);
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
 observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 window.addEventListener('scroll',queue,{passive:true});
 window.addEventListener('resize',queue,{passive:true});
 reduce.addEventListener('change',setup);
 document.fonts?.ready.then(queue);
 window.addEventListener('load',queue,{once:true});
 setup();
})();
