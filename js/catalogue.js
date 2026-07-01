/* Catalogue public — récupère les biens publiés et gère les filtres */
(function () {
  const grid = document.getElementById('catalogueGrid');
  const loading = document.getElementById('catalogueLoading');
  const empty = document.getElementById('catalogueEmpty');
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!grid) return;

  const TYPE_LABELS = { residentiel: 'Résidentiel', professionnel: 'Professionnel', investissement: 'Investissement' };
  const STATUS_LABELS = { disponible: 'Disponible', sous_compromis: 'Sous compromis', vendu: 'Vendu' };
  const priceFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  let listings = [];
  let activeType = '';

  function card(listing) {
    const photo = listing.photos && listing.photos[0] ? listing.photos[0] : '';
    const meta = [];
    if (listing.surface) meta.push(`${listing.surface} m²`);
    if (listing.rooms) meta.push(`${listing.rooms} pièce${listing.rooms > 1 ? 's' : ''}`);
    if (listing.secteur) meta.push(listing.secteur);

    const a = document.createElement('a');
    a.className = 'listing-card';
    a.href = `bien.html?id=${encodeURIComponent(listing.id)}`;
    a.innerHTML = `
      <div class="listing-card-photo" style="background-image:url('${photo}')">
        <span class="listing-badge ${listing.status}">${STATUS_LABELS[listing.status] || listing.status}</span>
      </div>
      <div class="listing-card-body">
        <span class="listing-type">${TYPE_LABELS[listing.type] || listing.type}</span>
        <h3>${listing.title}</h3>
        <div class="listing-price">${priceFmt.format(listing.price)}</div>
        <div class="listing-meta">${meta.map(m => `<span>${m}</span>`).join('')}</div>
      </div>
    `;
    return a;
  }

  function render() {
    const filtered = activeType ? listings.filter(l => l.type === activeType) : listings;
    grid.innerHTML = '';
    filtered.forEach(l => grid.appendChild(card(l)));
    empty.classList.toggle('hidden', filtered.length > 0);
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeType = btn.dataset.type;
      render();
    });
  });

  window.sb.from('listings')
    .select('*')
    .eq('publie', true)
    .order('created_at', { ascending: false })
    .then(({ data, error }) => {
      loading.classList.add('hidden');
      if (error) {
        loading.textContent = "Impossible de charger les biens pour le moment. Merci de réessayer plus tard.";
        loading.classList.remove('hidden');
        return;
      }
      listings = data || [];
      render();
    });
})();
