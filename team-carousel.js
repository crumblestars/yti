(function(){
 'use strict';
 const root=document.getElementById('dcTeamCarousel');if(!root)return;
 const card=root.querySelector('.dc-team-card'),canvas=root.querySelector('canvas'),poster=root.querySelector('img');
 const copy=root.querySelector('.dc-team-copy'),name=root.querySelector('.dc-team-name'),role=root.querySelector('.dc-team-role'),bio=root.querySelector('.dc-team-bio');
 const prev=root.querySelector('.dc-team-prev'),next=root.querySelector('.dc-team-next'),status=root.querySelector('.dc-team-status');
 const dots=[...root.querySelectorAll('.dc-team-pagination>span')],count=root.querySelector('.dc-team-count');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const sources=['team-motion-zaki.webp','team-motion-ferhat.webp','team-motion-ravel.webp'];
 const fallbacks=['team-still-zaki.webp','team-still-ferhat.webp','team-still-ravel.webp'];
 const labels={fr:['Notre équipe','Personne précédente','Personne suivante','profil'],de:['Unser Team','Vorherige Person','Nächste Person','Profil'],en:['Our team','Previous person','Next person','profile'],ar:['فريقنا','الشخص السابق','الشخص التالي','ملف شخصي'],es:['Nuestro equipo','Persona anterior','Persona siguiente','perfil'],it:['Il nostro team','Persona precedente','Persona successiva','profilo']};
 let lang=typeof currentLang==='string'?currentLang:'de',index=0,visibleIndex=0,busy=false,draw=null,raf=0,transition=null,loading=null,broken=false;
 const resolution=Math.min(560,Math.round((matchMedia('(max-width:600px)').matches?210:270)*Math.min(devicePixelRatio||1,2)));
 canvas.width=canvas.height=resolution;const ctx=canvas.getContext('2d');
 const team=()=>TEAM_I18N[lang]||TEAM_I18N.de||TEAM_I18N.fr;
 const roleText=(member,i)=>i===0?'CEO · '+member.role:member.role;
 function updateText(i,announce){
  const member=team()[i];name.textContent=member.name;role.textContent=roleText(member,i);bio.textContent=member.bio;
  poster.alt=member.name;poster.src=fallbacks[i];card.setAttribute('aria-label',(i+1)+' / 3 · '+member.name);
  count.textContent='0'+(i+1)+' / 03';dots.forEach((d,k)=>d.classList.toggle('is-current',k===i));visibleIndex=i;
  if(announce)status.textContent=member.name+' — '+roleText(member,i);
 }
 function measure(){
  const width=copy.getBoundingClientRect().width;if(!width)return;
  const probe=copy.cloneNode(true);probe.removeAttribute('id');probe.setAttribute('aria-hidden','true');
  probe.style.cssText='position:absolute;visibility:hidden;pointer-events:none;min-height:0;width:'+width+'px;max-width:none;transition:none';
  card.appendChild(probe);let max=0;
  team().forEach((m,i)=>{probe.querySelector('.dc-team-name').textContent=m.name;probe.querySelector('.dc-team-role').textContent=roleText(m,i);probe.querySelector('.dc-team-bio').textContent=m.bio;max=Math.max(max,probe.getBoundingClientRect().height)});
  probe.remove();copy.style.setProperty('--dc-copy-height',Math.ceil(max)+'px');
 }
 window.refreshTeamI18n=function(language){
  lang=language;const l=labels[lang]||labels.de;root.setAttribute('aria-label',l[0]);prev.setAttribute('aria-label',l[1]);next.setAttribute('aria-label',l[2]);card.setAttribute('aria-roledescription',l[3]);
  updateText(visibleIndex,false);measure();
 };
 function prepare(){
  if(loading)return loading;
  loading=Promise.all([
   Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src}))),
   new Promise((resolve,reject)=>{if(window.DCTeamMotion)return resolve();const s=document.createElement('script');s.src='team-motion-engine.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})
  ]).then(([images])=>{draw=window.DCTeamMotion(images,resolution);if(!busy){draw(ctx,null,resolution,index,index);canvas.hidden=false;poster.hidden=true}return true}).catch(()=>{broken=true;return false});
  return loading;
 }
 function finish(){
  if(!transition)return;
  cancelAnimationFrame(raf);index=transition.to;transition=null;
  updateText(index,true);copy.classList.remove('is-changing');busy=false;prev.disabled=next.disabled=false;
  if(draw){try{draw(ctx,null,resolution,index,index);canvas.hidden=false;poster.hidden=true}catch(e){draw=null;canvas.hidden=true;poster.hidden=false}}
 }
 async function move(delta){
  if(busy)return;busy=true;prev.disabled=next.disabled=true;
  const to=(index+delta+3)%3;transition={from:index,to,swapped:false};
  // Loading is opportunistic: keep navigation working if assets cannot be fetched.
  if(!draw&&!broken)await Promise.race([prepare(),new Promise(r=>setTimeout(r,1500))]);
  if(!transition)return;
  if(reduced.matches||!draw||document.hidden){finish();return}
  canvas.hidden=false;poster.hidden=true;copy.classList.add('is-changing');
  const start=performance.now();
  function tick(now){
   if(!transition)return;
   const elapsed=(now-start)/1000;
   try{draw(ctx,elapsed,resolution,transition.from,transition.to)}catch(e){draw=null;canvas.hidden=true;poster.hidden=false;finish();return}
   if(elapsed>=.32&&!transition.swapped){transition.swapped=true;updateText(to,false);copy.classList.remove('is-changing')}
   if(elapsed>=1.13){finish();return}raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
 }
 prev.hidden=next.hidden=false;prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
 root.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();const rtl=lang==='ar';move((e.key==='ArrowRight'?1:-1)*(rtl?-1:1))});
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&transition)finish()});
 reduced.addEventListener('change',()=>{if(reduced.matches&&transition)finish()});
 window.refreshTeamI18n(lang);
 if('ResizeObserver' in window){let width=0;new ResizeObserver(entries=>{const w=entries[0].contentRect.width;if(Math.abs(w-width)>1){width=w;measure()}}).observe(copy)}
 if(document.fonts)document.fonts.ready.then(measure);
 if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){prepare();io.disconnect()}},{rootMargin:'400px'});io.observe(root)}else prepare();
})();
