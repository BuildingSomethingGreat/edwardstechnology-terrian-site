/* ===========================================================================
   Terrian — shared site chrome + behaviours (new theme)
   Injects the fixed chrome, MENU overlay, animated-wordmark footer, and the
   Quick Listen drawer into every page, and wires reveal/parallax/subscribe.
   Configure per page via <body data-page="music" data-status="…" data-foot-cta="…">.
   =========================================================================== */
(function(){
  var WM='/assets/images/terrian-script-logo.png';
  var SPOTIFY_ARTIST='19TPpTWkgX13Qc2stbqVoP';
  var body=document.body, ds=body.dataset;
  var page=ds.page||'';
  var NAV=[
    ['Music','/music/','music'],
    ['Blog','/blog/','blog'],
    ['Tour','/tour/','tour'],
    ['Shop','https://iamterrian.myshopify.com/','shop'],
    ['Booking','/booking/','booking']
  ];
  var SOC=[
    ['Instagram','https://www.instagram.com/iamterrian','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.6" cy="6.4" r="1.15" fill="currentColor" stroke="none"/></svg>'],
    ['X','https://twitter.com/iamterrian','<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2.5h3.3l-7.2 8.2L23.7 22h-6.6l-5.2-6.8L5.9 22H2.6l7.7-8.8L.9 2.5h6.8l4.7 6.2 5.5-6.2zm-1.2 17.5h1.8L6.9 4.4H5l12.7 15.6z"/></svg>'],
    ['YouTube','https://www.youtube.com/channel/UC6bWXuTerKlroiGyS_5uPBw','<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.6 3.9 12 3.9 12 3.9s-7.6 0-9.4.5A3 3 0 0 0 .5 6.5 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.5 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.5zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>'],
    ['Spotify','https://open.spotify.com/artist/'+SPOTIFY_ARTIST,'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1 .25c-2.8-1.7-6.4-2.1-10.5-1.1a.75.75 0 1 1-.33-1.46c4.6-1 8.5-.55 11.6 1.32.35.22.46.68.24 1zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.2-2-8.1-2.5-11.9-1.36a.94.94 0 1 1-.55-1.8c4.3-1.3 9.7-.72 13.4 1.56.44.27.58.85.31 1.29zm.13-3.4C15.3 8.3 8.9 8.1 5.3 9.2a1.13 1.13 0 1 1-.65-2.16C8.8 5.8 15.8 6 20.2 8.6a1.13 1.13 0 0 1-1.16 1.93z"/></svg>'],
    ['Facebook','https://www.facebook.com/iamterrian','<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.24 2.6.24v2.9h-1.4c-1.4 0-1.9.9-1.9 1.8V12h3.2l-.5 3.5h-2.7v8.4A12 12 0 0 0 24 12z"/></svg>']
  ];
  function socialHTML(){ return SOC.map(function(s){ return '<a href="'+s[1]+'" target="_blank" rel="noopener noreferrer" aria-label="'+s[0]+'">'+s[2]+'</a>'; }).join(''); }
  function el(html){ var d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }

  /* ---------- preloader ---------- */
  (function(){ var pl=document.getElementById('site-preloader'); if(!pl) return;
    if(window.top!==window.self){ if(pl.parentNode) pl.parentNode.removeChild(pl); return; }  /* skip inside the menu overlay iframe */
    var t0=Date.now();
    function done(){ var w=Math.max(0,1000-(Date.now()-t0)); setTimeout(function(){ pl.classList.add('done'); setTimeout(function(){ if(pl.parentNode) pl.parentNode.removeChild(pl); }, 800); }, w); }
    if(document.readyState==='complete') done(); else window.addEventListener('load', done);
    setTimeout(done, 4500);
  })();

  var openM=function(){}, closeM=function(){}, closeLanding=function(){};

  if(ds.chrome!=='off'){
    /* ---------- fixed chrome ---------- */
    var statusText=ds.status||'Mad Big World — Out Now';
    body.appendChild(el(
      '<div class="chrome"><a class="mark" href="/home/" aria-label="Terrian home"><img src="'+WM+'" alt="Terrian"></a>'
      +'<button class="menu-btn" id="siteMenuBtn" aria-label="Open menu">Menu <span class="bars"><i></i><i></i></span></button></div>'));
    body.appendChild(el('<div class="statusbar"><span><span class="dot"></span>'+statusText+'</span><span class="right">Terrian · 2026</span></div>'));

    /* ---------- mobile menu overlay ---------- */
    var navLinks=NAV.map(function(n){ var ext=/^http/.test(n[1]); var active=(n[2]===page)?' active':'';
      return '<a class="nl'+active+'" href="'+n[1]+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+n[0]+'</a>'; }).join('');
    var ov=el('<nav class="navov" id="siteNavov" aria-label="Main menu"><button class="close" id="siteNavClose" aria-label="Close menu">&#10005;</button>'
      +'<a class="nl'+(page==='home'?' active':'')+'" href="/home/">Home</a>'+navLinks
      +'<div class="ov-social">'+socialHTML()+'</div></nav>');
    body.appendChild(ov);
    openM=function(){ ov.classList.add('open'); document.documentElement.style.overflow='hidden'; };
    closeM=function(){ ov.classList.remove('open'); document.documentElement.style.overflow=''; };
    document.getElementById('siteNavClose').addEventListener('click', closeM);
    ov.addEventListener('click', function(e){ if(e.target===ov) closeM(); });

    /* ---------- landing-as-menu (desktop MENU reopens the landing splash) ---------- */
    var landingOv=null;
    function openLanding(){
      if(!landingOv){ landingOv=el('<div id="landing-ov"><button class="lo-close" aria-label="Close menu">&#10005;</button><iframe title="Menu" src="/"></iframe></div>');
        body.appendChild(landingOv); landingOv.querySelector('.lo-close').addEventListener('click', closeLanding); landingOv.getBoundingClientRect(); }
      requestAnimationFrame(function(){ landingOv.classList.add('open'); }); document.documentElement.style.overflow='hidden';
    }
    closeLanding=function(){ if(landingOv){ landingOv.classList.remove('open'); document.documentElement.style.overflow=''; } };
    document.getElementById('siteMenuBtn').addEventListener('click', function(){
      if(window.matchMedia && window.matchMedia('(min-width:900px)').matches){ openLanding(); } else { openM(); }
    });
  }

  /* ---------- footer (with animated wordmark) ---------- */
  if(ds.footer!=='none'){
    var footCta=(ds.footCta||'Want more?');
    var subHTML=(ds.footSub==='off')?'' :
      '<p class="foot-lead">Get updates on new shows, new music, and more — straight to your inbox.</p>'
      +'<form class="sub" data-sub data-source="'+(page?page.charAt(0).toUpperCase()+page.slice(1)+' page':'Footer')+'"><input type="email" name="email" placeholder="Enter your email" aria-label="Email" required><button class="btn btn--solid" type="submit">Subscribe</button></form>'
      +'<div class="sub-msg"></div><div class="foot-rule"></div>';
    var foot=el('<footer class="site-footer">'
      +'<img class="site-footer__wm" src="'+WM+'" alt="" aria-hidden="true">'
      +'<div class="site-footer__in">'
      +'<div class="foot-cta serif"><em>'+footCta+'</em></div>'
      +subHTML
      +'<nav class="social" aria-label="Terrian on social media">'+socialHTML()+'</nav>'
      +'<nav class="flinks"><a href="/booking/">Booking</a><a href="/branding/">Branding</a><a href="/legal/">Legal</a><a href="/privacy/">Privacy</a></nav>'
      +'<div class="cp">© 2026 Terrian. All rights reserved.</div>'
      +'</div></footer>');
    body.appendChild(foot);
    var fio=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) foot.classList.add('in'); }); }, {threshold:0.18});
    fio.observe(foot);
  }

  /* ---------- Quick Listen ---------- */
  if(ds.quicklisten!=='off'){
    var SP='https://open.spotify.com/embed/artist/'+SPOTIFY_ARTIST+'?utm_source=generator&theme=0';
    body.appendChild(el('<button id="nce-ql-tab" type="button" aria-label="Open Quick Listen"><span class="dot">&#9654;</span>Quick&nbsp;Listen</button>'));
    body.appendChild(el('<button id="nce-ql-fab" type="button" aria-label="Open Quick Listen"><span class="dot">&#9654;</span>Quick&nbsp;Listen</button>'));
    body.appendChild(el('<div id="nce-ql-backdrop"></div>'));
    var dr=el('<aside id="nce-ql-drawer" role="dialog" aria-modal="true" aria-label="Quick Listen">'
      +'<div class="nce-ql-drawer-handle"></div>'
      +'<div class="nce-ql-head"><div><div class="nce-ql-eyebrow">Quick Listen</div><div class="nce-ql-title">Now Playing</div></div>'
      +'<button class="nce-ql-close" type="button" aria-label="Close">&#10005;</button></div>'
      +'<div class="nce-ql-body"></div>'
      +'<div class="nce-ql-foot"><a href="https://open.spotify.com/artist/'+SPOTIFY_ARTIST+'" target="_blank" rel="noopener">Open in Spotify &#8599;</a></div></aside>');
    body.appendChild(dr);
    var bk=document.getElementById('nce-ql-backdrop'), loaded=false;
    function qlOpen(){ if(!loaded){ var f=document.createElement('iframe'); f.src=SP; f.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'; f.loading='lazy'; dr.querySelector('.nce-ql-body').appendChild(f); loaded=true; }
      bk.classList.add('open'); dr.classList.add('open'); document.documentElement.style.overflow='hidden'; }
    function qlClose(){ bk.classList.remove('open'); dr.classList.remove('open'); document.documentElement.style.overflow=''; }
    document.getElementById('nce-ql-tab').addEventListener('click', qlOpen);
    document.getElementById('nce-ql-fab').addEventListener('click', qlOpen);
    bk.addEventListener('click', qlClose);
    dr.querySelector('.nce-ql-close').addEventListener('click', qlClose);
    window.__qlClose=qlClose;
  }

  /* ---------- Esc closes overlays ---------- */
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'||e.keyCode===27){ closeM(); closeLanding(); if(window.__qlClose) window.__qlClose(); } });

  /* ---------- reveal on scroll ---------- */
  var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px', threshold:0.08});
  function armReveals(){ document.querySelectorAll('.reveal:not(.in)').forEach(function(x){ io.observe(x); }); }
  armReveals(); window.__armReveals=armReveals;

  /* ---------- parallax ---------- */
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking=false;
  function onScroll(){ if(reduce) return; if(!ticking){ ticking=true; requestAnimationFrame(update); } }
  function update(){ ticking=false; var vh=window.innerHeight;
    var items=document.querySelectorAll('[data-parallax]');
    for(var i=0;i<items.length;i++){ var e=items[i]; var r=e.getBoundingClientRect(); if(r.bottom<-260||r.top>vh+260) continue;
      var speed=parseFloat(e.getAttribute('data-parallax'))||0.15; var mid=r.top+r.height/2; var y=-(mid-vh/2)*speed;
      e.style.transform='translate3d(0,'+y.toFixed(1)+'px,0)'; }
  }
  window.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize', onScroll); update();

  /* ---------- subscribe forms ---------- */
  document.querySelectorAll('form[data-sub]').forEach(function(form){
    var msg=form.parentNode.querySelector('.sub-msg')||form.nextElementSibling, busy=false;
    if(!msg||!msg.classList.contains('sub-msg')){ msg=el('<div class="sub-msg"></div>'); form.parentNode.insertBefore(msg, form.nextSibling); }
    form.addEventListener('submit', function(e){ e.preventDefault(); if(busy) return;
      var inp=form.querySelector('input[type=email]'); var email=(inp.value||'').trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ msg.style.color='#ec9a9a'; msg.textContent='Please enter a valid email.'; return; }
      busy=true; msg.style.color='#b7b2a6'; msg.textContent='Submitting…';
      fetch('/.netlify/functions/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:email,source:(form.getAttribute('data-source')||(page?page.charAt(0).toUpperCase()+page.slice(1)+' page':'Site')),reason:(form.getAttribute('data-reason')||'Newsletter / updates')})})
        .then(function(r){ return r.json().catch(function(){return {ok:r.ok};}); })
        .then(function(d){ busy=false; if(d&&d.ok){ msg.style.color='#7fd18a'; msg.textContent='Thanks — you’re on the list! ✓'; form.reset(); } else { msg.style.color='#ec9a9a'; msg.textContent=(d&&d.error)||'Something went wrong. Please try again.'; } })
        .catch(function(){ busy=false; msg.style.color='#ec9a9a'; msg.textContent='Network error. Please try again.'; });
    });
  });
})();
