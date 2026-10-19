/* Routage des demandes des formulaires vers contact.milleniumimmoconseil@gmail.com
 *
 * Le site est statique : il ne peut pas envoyer d'email par lui-même. Web3Forms
 * sert de relais. Pour obtenir la clé : aller sur https://web3forms.com, saisir
 * contact.milleniumimmoconseil@gmail.com, la clé arrive par email en quelques secondes
 * (aucun compte à créer). La coller ci-dessous entre les guillemets.
 *
 * Cette clé est publique par conception : elle n'autorise que l'envoi vers
 * l'adresse qui l'a demandée, jamais la lecture des messages reçus.
 *
 * Tant qu'elle est vide, les formulaires n'affichent PAS de fausse confirmation :
 * ils invitent le visiteur à appeler ou à écrire directement. Voir js/forms.js.
 */
window.WEB3FORMS_KEY = "1d6c5965-41fa-411f-8dc0-5abd1369268a";

/* Adresse de repli affichée au visiteur si l'envoi échoue ou n'est pas configuré. */
window.CONTACT_FALLBACK = {
  tel: "05 56 96 27 21",
  email: "contact@milleniumimmoconseil.fr"
};
