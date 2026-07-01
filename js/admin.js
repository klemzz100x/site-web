/* Espace admin — auth Supabase + CRUD biens + upload photos */
(function () {
  const BUCKET = 'listing-photos';
  const TYPE_LABELS = { residentiel: 'Résidentiel', professionnel: 'Professionnel', investissement: 'Investissement' };
  const STATUS_LABELS = { disponible: 'Disponible', sous_compromis: 'Sous compromis', vendu: 'Vendu' };
  const priceFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const loginSection = document.getElementById('adminLogin');
  const dashSection = document.getElementById('adminDashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const adminUserEmail = document.getElementById('adminUserEmail');

  const listingForm = document.getElementById('listingForm');
  const listingFormTitle = document.getElementById('listingFormTitle');
  const listingFields = document.getElementById('listingFields');
  const listingError = document.getElementById('listingError');
  const tableBody = document.getElementById('listingsTableBody');

  const photoHint = document.getElementById('photoHint');
  const photoUploadZone = document.getElementById('photoUploadZone');
  const photoInput = document.getElementById('photoInput');
  const photoPreviewGrid = document.getElementById('photoPreviewGrid');

  let listings = [];
  let editingId = null; // null = nouvelle fiche pas encore enregistrée
  let editingPhotos = [];

  /* ── AUTH ─────────────────────────────── */
  sb.auth.onAuthStateChange((_event, session) => {
    if (session) {
      loginSection.classList.add('hidden');
      dashSection.classList.remove('hidden');
      adminUserEmail.textContent = session.user.email;
      loadListings();
    } else {
      loginSection.classList.remove('hidden');
      dashSection.classList.add('hidden');
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.remove('show');
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      loginError.textContent = "Email ou mot de passe incorrect.";
      loginError.classList.add('show');
    }
  });

  document.getElementById('btnLogout').addEventListener('click', () => sb.auth.signOut());

  /* ── CHARGEMENT DES BIENS ────────────────── */
  async function loadListings() {
    const { data, error } = await sb.from('listings').select('*').order('created_at', { ascending: false });
    if (error) return;
    listings = data || [];
    renderTable();
  }

  function renderTable() {
    tableBody.innerHTML = '';
    listings.forEach(l => {
      const tr = document.createElement('tr');
      const photo = l.photos && l.photos[0] ? l.photos[0] : '';
      tr.innerHTML = `
        <td><div class="admin-thumb" style="background-image:url('${photo}')"></div></td>
        <td>${l.title}</td>
        <td>${TYPE_LABELS[l.type] || l.type}</td>
        <td>${priceFmt.format(l.price)}</td>
        <td>${STATUS_LABELS[l.status] || l.status}</td>
        <td><span class="publie-pill ${l.publie ? 'oui' : 'non'}">${l.publie ? 'Publié' : 'Brouillon'}</span></td>
        <td class="admin-row-actions">
          <button class="btn-cta-dark btn-small" data-action="edit">Modifier</button>
          <button class="btn-cta-dark btn-small" data-action="toggle">${l.publie ? 'Dépublier' : 'Publier'}</button>
          <button class="btn-danger" data-action="delete">Supprimer</button>
        </td>
      `;
      tr.querySelector('[data-action="edit"]').addEventListener('click', () => openForEdit(l));
      tr.querySelector('[data-action="toggle"]').addEventListener('click', () => togglePublie(l));
      tr.querySelector('[data-action="delete"]').addEventListener('click', () => deleteListing(l));
      tableBody.appendChild(tr);
    });
  }

  async function togglePublie(l) {
    const { error } = await sb.from('listings').update({ publie: !l.publie }).eq('id', l.id);
    if (!error) loadListings();
  }

  async function deleteListing(l) {
    if (!confirm(`Supprimer définitivement "${l.title}" ?`)) return;
    const { data: files } = await sb.storage.from(BUCKET).list(l.id);
    if (files && files.length) {
      await sb.storage.from(BUCKET).remove(files.map(f => `${l.id}/${f.name}`));
    }
    const { error } = await sb.from('listings').delete().eq('id', l.id);
    if (!error) loadListings();
  }

  /* ── FORMULAIRE ─────────────────────────── */
  document.getElementById('btnNewListing').addEventListener('click', () => openForNew());
  document.getElementById('btnCancelListing').addEventListener('click', () => closeForm());

  function openForNew() {
    editingId = null;
    editingPhotos = [];
    listingFormTitle.textContent = 'Nouveau bien';
    listingFields.reset();
    listingError.classList.remove('show');
    photoUploadZone.classList.add('hidden');
    photoHint.textContent = "Enregistrez d'abord les informations du bien pour pouvoir ajouter des photos.";
    photoHint.classList.remove('hidden');
    photoPreviewGrid.innerHTML = '';
    listingForm.classList.remove('hidden');
    listingForm.scrollIntoView({ behavior: 'smooth' });
  }

  function openForEdit(l) {
    editingId = l.id;
    editingPhotos = l.photos ? [...l.photos] : [];
    listingFormTitle.textContent = `Modifier — ${l.title}`;
    document.getElementById('fTitle').value = l.title;
    document.getElementById('fType').value = l.type;
    document.getElementById('fPrice').value = l.price;
    document.getElementById('fSurface').value = l.surface || '';
    document.getElementById('fRooms').value = l.rooms || '';
    document.getElementById('fSecteur').value = l.secteur || '';
    document.getElementById('fAddress').value = l.address || '';
    document.getElementById('fDescription').value = l.description || '';
    document.getElementById('fStatus').value = l.status;
    document.getElementById('fPublie').value = String(l.publie);
    listingError.classList.remove('show');
    photoHint.classList.add('hidden');
    photoUploadZone.classList.remove('hidden');
    renderPhotoPreview();
    listingForm.classList.remove('hidden');
    listingForm.scrollIntoView({ behavior: 'smooth' });
  }

  function closeForm() {
    listingForm.classList.add('hidden');
    editingId = null;
    editingPhotos = [];
  }

  function formPayload() {
    return {
      title: document.getElementById('fTitle').value.trim(),
      type: document.getElementById('fType').value,
      price: Number(document.getElementById('fPrice').value),
      surface: document.getElementById('fSurface').value ? Number(document.getElementById('fSurface').value) : null,
      rooms: document.getElementById('fRooms').value ? Number(document.getElementById('fRooms').value) : null,
      secteur: document.getElementById('fSecteur').value.trim() || null,
      address: document.getElementById('fAddress').value.trim() || null,
      description: document.getElementById('fDescription').value.trim() || null,
      status: document.getElementById('fStatus').value,
      publie: document.getElementById('fPublie').value === 'true',
    };
  }

  listingFields.addEventListener('submit', async (e) => {
    e.preventDefault();
    listingError.classList.remove('show');
    const payload = formPayload();

    if (editingId) {
      const { error } = await sb.from('listings').update(payload).eq('id', editingId);
      if (error) { showListingError(error); return; }
    } else {
      const { data, error } = await sb.from('listings').insert(payload).select().single();
      if (error) { showListingError(error); return; }
      editingId = data.id;
      editingPhotos = [];
      photoHint.classList.add('hidden');
      photoUploadZone.classList.remove('hidden');
    }
    await loadListings();
    listingFormTitle.textContent = 'Bien enregistré ✓';
  });

  function showListingError() {
    listingError.textContent = "Une erreur est survenue lors de l'enregistrement. Vérifiez les champs et réessayez.";
    listingError.classList.add('show');
  }

  /* ── PHOTOS ─────────────────────────────── */
  photoInput.addEventListener('change', async () => {
    const files = Array.from(photoInput.files || []);
    if (!files.length || !editingId) return;
    for (const file of files) {
      const path = `${editingId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
      const { error } = await sb.storage.from(BUCKET).upload(path, file);
      if (error) continue;
      const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
      editingPhotos.push(data.publicUrl);
    }
    photoInput.value = '';
    await sb.from('listings').update({ photos: editingPhotos }).eq('id', editingId);
    renderPhotoPreview();
    loadListings();
  });

  function renderPhotoPreview() {
    photoPreviewGrid.innerHTML = '';
    editingPhotos.forEach((url, idx) => {
      const div = document.createElement('div');
      div.className = 'p-thumb';
      div.style.backgroundImage = `url('${url}')`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '×';
      btn.setAttribute('aria-label', 'Supprimer cette photo');
      btn.addEventListener('click', () => removePhoto(idx));
      div.appendChild(btn);
      photoPreviewGrid.appendChild(div);
    });
  }

  async function removePhoto(idx) {
    const url = editingPhotos[idx];
    const path = url.split(`${BUCKET}/`)[1];
    if (path) await sb.storage.from(BUCKET).remove([path]);
    editingPhotos.splice(idx, 1);
    await sb.from('listings').update({ photos: editingPhotos }).eq('id', editingId);
    renderPhotoPreview();
    loadListings();
  }
})();
