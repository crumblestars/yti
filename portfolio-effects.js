(()=>{
 const bound=new WeakSet(),fine=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 function setup(){document.querySelectorAll('.mockup-pc').forEach(el=>{
  if(bound.has(el))return;bound.add(el);let frame=0,x=0,y=0;
  el.addEventListener('pointermove',e=>{if(!fine.matches||reduce.matches)return;x=e.clientX;y=e.clientY;if(!frame)frame=requestAnimationFrame(()=>{frame=0;const r=el.getBoundingClientRect();el.style.setProperty('--mx',`${x-r.left}px`);el.style.setProperty('--my',`${y-r.top}px`);});},{passive:true});
  el.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);frame=0;el.style.removeProperty('--mx');el.style.removeProperty('--my');});
 });}
 setup();const root=document.getElementById('app');if(root)new MutationObserver(setup).observe(root,{childList:true});
})();
