/* Load only the background needed for this viewport. */
(()=>{const mobile=matchMedia('(max-width:900px), (pointer:coarse)').matches;
function load(src,done){const s=document.createElement('script');s.src=src;s.onload=done||null;document.head.append(s)}
if(mobile){document.documentElement.classList.add('dc-mobile-bg');load('mobile-background.js')}
else load('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',()=>load('background-3d.js'));
})();
