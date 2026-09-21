/* Envoi des formulaires vers contact@milleniumimmoconseil.fr via Web3Forms.
 * Partagé par le formulaire de contact (contact.html) et le formulaire express
 * de la page d'accueil. Nécessite js/forms-config.js chargé avant ce script. */
(function () {
  const ENDPOINT = 'https://api.web3forms.com/submit';
  const KEY = (window.WEB3FORMS_KEY || '').trim();
  const FALLBACK = window.CONTACT_FALLBACK || {};

  const MSG_OK = 'Merci ! Votre demande nous a bien été transmise. Un conseiller vous rappelle sous 2 h ouvrées.';
  const MSG_KO = 'Votre demande n\'a pas pu être envoyée. Appelez-nous au ' +
    (FALLBACK.tel || '05 56 96 27 21') + ' ou écrivez à ' +
    (FALLBACK.email || 'contact@milleniumimmoconseil.fr') + '.';

  function show(el, text, isError) {
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
  }

  function wire(formId, feedbackId, subject) {
    const form = document.getElementById(formId);
    if (!form) return;
    const feedback = document.getElementById(feedbackId);
    const button = form.querySelector('button[type="submit"], button');
    const buttonLabel = button ? button.innerHTML : '';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Pas de clé configurée : on ne prétend surtout pas avoir enregistré la demande.
      if (!KEY) {
        show(feedback, MSG_KO, true);
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = 'Envoi en cours…';
      }

      const data = new FormData(form);
      data.append('access_key', KEY);
      data.append('subject', subject);
      data.append('from_name', 'Site Millenium Immo Conseil');
      const replyTo = data.get('email');
      if (replyTo) data.append('replyto', replyTo);

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: data
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) throw new Error(json.message || res.status);

        show(feedback, MSG_OK, false);
        form.reset();
        if (button) button.textContent = 'Demande envoyée ✓';
      } catch (err) {
        show(feedback, MSG_KO, true);
        if (button) {
          button.disabled = false;
          button.innerHTML = buttonLabel;
        }
      }
    });
  }

  wire('contactForm', 'formFeedback', 'Nouvelle demande — formulaire de contact');
  wire('expressForm', 'expressFeedback', 'Nouvelle demande d\'estimation — page d\'accueil');
})();
