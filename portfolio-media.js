/* Shared portfolio lifecycle: fetch nearby media, play visible videos only. */
(()=>{
 'use strict';
 const selector='#portfolio video';
 let videos=[],near=null,visible=null,refreshQueued=false;
 const states=new WeakMap();
 const loaded=new WeakSet();
 function load(v){
  if(loaded.has(v))return;loaded.add(v);
  if(v.dataset.poster)v.poster=v.dataset.poster;
  const sources=v.querySelectorAll('source[data-src]');
  sources.forEach(s=>{s.src=s.dataset.src;});
  if(v.dataset.src)v.src=v.dataset.src;
  v.preload='metadata';v.load();
 }
 function play(v){
  if(document.hidden||!states.get(v)||!v.isConnected)return;
  load(v);const p=v.play();if(p?.catch)p.catch(()=>{});
 }
 function refresh(){
  near?.disconnect();visible?.disconnect();
  videos.forEach(v=>{if(!v.isConnected)v.pause();});
  videos=[...document.querySelectorAll(selector)];
  near=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){load(e.target);near.unobserve(e.target);}}),{rootMargin:'250px 0px'});
  visible=new IntersectionObserver(entries=>entries.forEach(e=>{const v=e.target;const active=e.isIntersecting&&e.intersectionRatio>=.15;states.set(v,active);if(active)play(v);else v.pause();}),{threshold:[0,.15]});
  videos.forEach(v=>{
   if(!v.dataset.dcBound){
    v.dataset.dcBound='1';v.muted=true;v.defaultMuted=true;
    v.addEventListener('loadeddata',()=>v.classList.add('ready'));
    v.addEventListener('canplay',()=>play(v));
    v.addEventListener('loadedmetadata',()=>{const start=v.classList.contains('pf-video')?1:Number(v.dataset.start||0);if(start&&v.duration>start)try{v.currentTime=start;}catch{}});
   }
   near.observe(v);visible.observe(v);
  });
 }
 function queue(){if(refreshQueued)return;refreshQueued=true;queueMicrotask(()=>{refreshQueued=false;refresh();});}
 document.addEventListener('visibilitychange',()=>videos.forEach(v=>document.hidden?v.pause():play(v)));
 window.addEventListener('pagehide',()=>videos.forEach(v=>v.pause()));
 window.DCPortfolioVideos={refresh:queue};
 const app=document.getElementById('app');if(app)new MutationObserver(queue).observe(app,{childList:true});
 refresh();
})();
