/* Fiche bien — charge un bien publié via ?id= et affiche galerie + détails */
(function () {
  const TYPE_LABELS = { residentiel: 'Résidentiel', professionnel: 'Professionnel', investissement: "Investissement" };
  const STATUS_LABELS = { disponible: 'Disponible', sous_compromis: 'Sous compromis', vendu: 'Vendu' };
  const priceFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const id = new URLSearchParams(location.search).get('id');
  const content = document.getElementById('bienContent');
  const notFound = document.getElementById('bienNotFound');

  function showNotFound() {
    content.classList.add('hidden');
    notFound.classList.remove('hidden');
    document.getElementById('bienTitle').textContent = 'Bien introuvable';
    document.getElementById('breadcrumbTitle').textContent = 'Bien introuvable';
    document.getElementById('bienType').textContent = '';
  }

  if (!id) { showNotFound(); return; }

  window.sb.from('listings')
    .select('*')
    .eq('id', id)
    .eq('publie', true)
    .single()
    .then(({ data, error }) => {
      if (error || !data) { showNotFound(); return; }
      render(data);
    });

  function render(l) {
    document.title = `${l.title} – Millenium Immo Conseil`;
    document.getElementById('breadcrumbTitle').textContent = l.title;
    document.getElementById('bienType').textContent = TYPE_LABELS[l.type] || l.type;
    document.getElementById('bienTitle').innerHTML = `${l.title} ${l.secteur ? `<span class="gold">— ${l.secteur}</span>` : ''}`;
    document.getElementById('bienPrice').textContent = priceFmt.format(l.price);

    const meta = [];
    meta.push(`<span class="listing-badge ${l.status}" style="position:static;display:inline-block;">${STATUS_LABELS[l.status] || l.status}</span>`);
    if (l.surface) meta.push(`<span>${l.surface} m²</span>`);
    if (l.rooms) meta.push(`<span>${l.rooms} pièce${l.rooms > 1 ? 's' : ''}</span>`);
    if (l.address) meta.push(`<span>${l.address}</span>`);
    document.getElementById('bienMeta').innerHTML = meta.join('');

    document.getElementById('bienDescription').innerHTML = (l.description || '')
      .split('\n').filter(Boolean).map(p => `<p>${p}</p>`).join('');

    const photos = (l.photos && l.photos.length) ? l.photos : [''];
    const main = document.getElementById('galleryMain');
    const thumbs = document.getElementById('galleryThumbs');
    main.style.backgroundImage = `url('${photos[0]}')`;
    thumbs.innerHTML = '';
    if (photos.length > 1) {
      photos.forEach((p, i) => {
        const t = document.createElement('button');
        t.className = 'thumb' + (i === 0 ? ' active' : '');
        t.style.backgroundImage = `url('${p}')`;
        t.setAttribute('aria-label', `Photo ${i + 1}`);
        t.addEventListener('click', () => {
          main.style.backgroundImage = `url('${p}')`;
          thumbs.querySelectorAll('.thumb').forEach(x => x.classList.remove('active'));
          t.classList.add('active');
        });
        thumbs.appendChild(t);
      });
    }
  }
})();
