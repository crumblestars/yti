/* AJAX FormSubmit — pas de redirection, l'utilisateur reste sur la page */
(function(){
  document.addEventListener('submit', function(e){
    var form = e.target;
    if (!form || form.id !== 'contactForm') return;
    if (!form.action || form.action.indexOf('formsubmit.co') === -1) return;
    e.preventDefault();
    var btn = document.getElementById('submitBtn');
    var status = document.getElementById('formStatus');
    var originalText = btn ? btn.textContent : '';
    setTimeout(function(){
      var data = new FormData(form);
      if (btn) btn.disabled = true;
      fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
        .then(function(r){ if (!r.ok) throw new Error('net'); return r.json().catch(function(){ return {}; }); })
        .then(function(){
          if (status) {
            status.className = 'form-status ok';
            status.innerHTML = document.documentElement.lang === 'ar' ? '✓ تم إرسال رسالتك بنجاح. سنرد عليك خلال 24 ساعة.' : '\u2705 Votre message a \u00e9t\u00e9 envoy\u00e9 avec succ\u00e8s.<br>Nous vous r\u00e9pondrons sous 24 heures.';
          }
          form.reset();
        })
        .catch(function(){
          if (status) {
            status.className = 'form-status err';
            status.textContent = document.documentElement.lang === 'ar' ? '✗ حدث خطأ. يرجى المحاولة مجددًا.' : '\u274c Une erreur est survenue. Veuillez r\u00e9essayer.';
          }
        })
        .then(function(){
          if (btn) { btn.disabled = false; btn.textContent = document.documentElement.lang === 'ar' ? 'إرسال الرسالة' : originalText; }
        });
    }, 0);
  }, true);
})();
