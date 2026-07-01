/* Menu mobile (hamburger) — partagé par toutes les pages */
(function () {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.classList.remove('open');
    }));
  }

  /* Formulaire de contact — feedback simple sans backend */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fb = document.getElementById('formFeedback');
      if (fb) fb.classList.add('show');
      form.reset();
    });
  }
})();
