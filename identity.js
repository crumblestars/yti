(()=>{
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Mild optical distortion of the actual backdrop, not the text or controls.
 const defs=document.createElementNS('http://www.w3.org/2000/svg','svg');
 defs.setAttribute('width','0');defs.setAttribute('height','0');defs.setAttribute('aria-hidden','true');
 defs.style.cssText='position:absolute;pointer-events:none';
 defs.innerHTML='<defs><filter id="dc-refraction" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.024" numOctaves="2" seed="7" result="waves"/><feGaussianBlur in="waves" stdDeviation="2" result="soft-waves"/><feDisplacementMap in="SourceGraphic" in2="soft-waves" scale="14" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
 document.body.prepend(defs);
 const glass=document.querySelectorAll('.nav-pill,.lang-trigger,.card-outer,.tl-card,.faq-item');
 glass.forEach(el=>el.classList.add('dc-glass'));
 if(reduced)return;
 if(matchMedia('(hover:hover)').matches){
  glass.forEach(el=>el.addEventListener('pointermove',e=>{const b=el.getBoundingClientRect();el.style.setProperty('--dc-angle',`${Math.atan2(e.clientY-b.top-b.height/2,e.clientX-b.left-b.width/2)*180/Math.PI+90}deg`);},{passive:true}));
 }
 if(!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const progress=document.createElement('div');progress.className='dc-scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 gsap.to(progress,{scaleX:1,ease:'none',scrollTrigger:{trigger:document.documentElement,start:'top top',end:'max',scrub:.25}});
 document.querySelectorAll('.card-wrapper').forEach((el,i)=>{
  gsap.from(el,{y:55,rotationX:5,autoAlpha:0,duration:1,delay:(i%3)*.11,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}});
 });
 document.querySelectorAll('.divider').forEach(el=>{
  gsap.from(el,{scaleX:.12,opacity:.2,transformOrigin:'50% 50%',ease:'none',scrollTrigger:{trigger:el,start:'top 96%',end:'top 65%',scrub:.5}});
 });
 glass.forEach(el=>{
  if(el.closest('#navbar'))return;
  ScrollTrigger.create({trigger:el,start:'top 80%',end:'bottom 18%',toggleClass:'dc-in-view'});
 });
 // Subtle parallax of the background only, bounded to avoid blank edges.
 const bg=document.getElementById('bg-plexus');
 if(bg){gsap.set(bg,{scale:1.04});gsap.to(bg,{y:18,ease:'none',scrollTrigger:{start:0,end:'max',scrub:1}});}
 document.fonts?.ready.then(()=>ScrollTrigger.refresh());
 window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
