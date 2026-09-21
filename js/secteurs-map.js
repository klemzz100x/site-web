/* Carte schématique des secteurs d'intervention — Leaflet, rendu 100 % vectoriel.
   Contours des communes + tracé de la Garonne : API Découpage administratif
   (geo.api.gouv.fr, données OpenStreetMap), simplifiés dans js/secteurs-geo.js.
   Aucune tuile n'est chargée : la carte est un schéma, pas une photo. */
(function () {
  var el = document.getElementById('secteursMap');
  if (!el || !window.L || !window.SECTEURS_GEO) return;

  var QUARTIERS = [
    { id: 'bordeaux-centre', nom: 'Bordeaux Centre', kind: 'Quartier de Bordeaux',
      desc: "Triangle d'Or, Saint-Pierre, Hôtel de Ville : l'hypercentre et ses immeubles pierre.",
      ll: [44.8386, -0.5780], pos: 'bas' },
    { id: 'chartrons', nom: 'Chartrons', kind: 'Quartier de Bordeaux',
      desc: "Antiquaires, quais et échoppes rénovées : l'un des quartiers les plus prisés de Bordeaux.",
      ll: [44.8545, -0.5715], pos: 'gauche' },
    { id: 'bacalan', nom: 'Bacalan', kind: 'Quartier de Bordeaux',
      desc: 'Bassins à Flot, Cité du Vin : le quartier du neuf et du rendement locatif.',
      ll: [44.8705, -0.5570], pos: 'droite' }
  ];

  var DEFAUT = {
    kind: 'Bordeaux Métropole',
    name: '28 secteurs couverts',
    desc: "De Bacalan à Villenave d'Ornon, nous intervenons sur l'ensemble de la rive gauche bordelaise, en vente comme en location."
  };

  /* palette — un seul endroit à modifier pour changer la couleur des secteurs */
  var C_SECTEUR   = '#D8544A';
  var C_SECTEUR_ON= '#F0726A';
  var C_AUTRE     = '#1D3257';
  var C_TRAIT     = '#31527F';

  var ST_AUTRE = { color: C_TRAIT, weight: 1.2, opacity: 0.9, fillColor: C_AUTRE,   fillOpacity: 1 };
  var ST_SECT  = { color: '#8E2F27', weight: 1.4, opacity: 1, fillColor: C_SECTEUR, fillOpacity: 0.92 };
  var ST_ACTIF = { color: '#FFFFFF', weight: 2.6, opacity: 1, fillColor: C_SECTEUR_ON, fillOpacity: 1 };

  var map = L.map(el, {
    scrollWheelZoom: false,
    dragging: !L.Browser.mobile,
    zoomControl: true,
    attributionControl: true,
    minZoom: 10,
    maxZoom: 14,
    zoomSnap: 0.25
  });
  map.attributionControl.addAttribution(
    'Contours&nbsp;: <a href="https://geo.api.gouv.fr/">API Découpage administratif</a> — &copy; OpenStreetMap');

  /* l'étiquette de Bordeaux est décalée vers le sud de la commune :
     le centre est occupé par les trois épingles de quartier */
  var POS_ETIQ = { '33063': [44.8838, -0.5690] };

  var zones = {};
  var couverts = [];

  /* communes */
  L.geoJSON(window.SECTEURS_GEO, {
    style: function (f) { return f.properties.couvert ? ST_SECT : ST_AUTRE; },
    onEachFeature: function (f, layer) {
      var p = f.properties;
      var cls = p.couvert ? 'map-lab map-lab-c' : 'map-lab map-lab-o';
      if (!POS_ETIQ[p.code]) {
        layer.bindTooltip(p.nom, { permanent: true, direction: 'center', className: cls, opacity: 1 });
      }
      if (!p.couvert) return;
      couverts.push(layer);
      zones[p.code] = { layer: layer, kind: 'Commune', name: p.nom, desc: p.desc };
      layer.on('mouseover', function () { montrer(p.code); });
      layer.on('mouseout',  function () { montrer(epingle); });
      layer.on('click',     function () { epingle = (epingle === p.code) ? null : p.code; montrer(epingle); });
    }
  }).addTo(map);

  /* étiquettes repositionnées à la main (marqueur autonome, non cliquable) */
  Object.keys(POS_ETIQ).forEach(function (code) {
    var z = zones[code];
    if (!z) return;
    L.marker(POS_ETIQ[code], {
      interactive: false, keyboard: false,
      icon: L.divIcon({ className: 'map-lab-fixe', html: '<span>' + z.name + '</span>', iconSize: [0, 0] })
    }).addTo(map);
  });

  /* Garonne & Dordogne */
  if (window.SECTEURS_EAU) {
    L.geoJSON(window.SECTEURS_EAU, {
      interactive: false,
      style: { color: '#2E6FB0', weight: 9, opacity: 1, lineCap: 'round', lineJoin: 'round' }
    }).addTo(map);
    L.geoJSON(window.SECTEURS_EAU, {
      interactive: false,
      style: { color: '#4C93D6', weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }
    }).addTo(map);
  }

  /* quartiers bordelais */
  QUARTIERS.forEach(function (q) {
    var m = L.marker(q.ll, {
      icon: L.divIcon({
        className: 'q-pin q-' + q.pos,
        html: '<span class="q-dot"></span><span class="q-lab">' + q.nom + '</span>',
        iconSize: [13, 13], iconAnchor: [6, 6]
      }),
      keyboard: false, title: q.nom
    }).addTo(map);
    zones[q.id] = { marker: m, kind: q.kind, name: q.nom, desc: q.desc, ll: q.ll };
    m.on('mouseover', function () { montrer(q.id); });
    m.on('mouseout',  function () { montrer(epingle); });
    m.on('click',     function () { epingle = (epingle === q.id) ? null : q.id; montrer(epingle); });
  });

  /* cadrage : centré sur Bordeaux et ses secteurs */
  var vue = L.featureGroup(couverts).getBounds();
  map.fitBounds(vue, { padding: [14, 14] });
  map.setMaxBounds(vue.pad(0.55));
  setTimeout(function () { map.invalidateSize(); map.fitBounds(vue, { padding: [14, 14] }); }, 200);

  function majZoom() { el.classList.toggle('zoom-proche', map.getZoom() >= 11.5); }
  map.on('zoomend', majZoom);
  majZoom();

  map.on('click', function () { map.scrollWheelZoom.enable(); });
  el.addEventListener('mouseleave', function () { map.scrollWheelZoom.disable(); });

  var elKind = document.getElementById('mapInfoKind');
  var elName = document.getElementById('mapInfoName');
  var elDesc = document.getElementById('mapInfoDesc');
  var chips  = Array.prototype.slice.call(document.querySelectorAll('.map-chip'));
  var epingle = null;

  function montrer(id) {
    var z = id && zones[id];
    elKind.textContent = z ? z.kind : DEFAUT.kind;
    elName.textContent = z ? z.name : DEFAUT.name;
    elDesc.innerHTML   = z ? z.desc : DEFAUT.desc;

    Object.keys(zones).forEach(function (k) {
      var o = zones[k], actif = (k === id);
      if (o.layer) {
        o.layer.setStyle(actif ? ST_ACTIF : ST_SECT);
        if (actif) o.layer.bringToFront();
      } else if (o.marker) {
        var n = o.marker.getElement();
        if (n) n.classList.toggle('on', actif);
      }
    });
    chips.forEach(function (c) { c.classList.toggle('is-active', c.dataset.zone === id); });
  }

  function cadrer(id) {
    var z = zones[id];
    if (!z) return;
    if (z.layer) map.flyToBounds(z.layer.getBounds(), { padding: [30, 30], duration: 0.6 });
    else map.flyTo(z.ll, 13, { duration: 0.6 });
  }

  chips.forEach(function (c) {
    var id = c.dataset.zone;
    c.addEventListener('mouseenter', function () { montrer(id); });
    c.addEventListener('focus',      function () { montrer(id); });
    c.addEventListener('click',      function () { epingle = id; montrer(id); cadrer(id); });
  });

  var reset = document.getElementById('mapReset');
  if (reset) reset.addEventListener('click', function () {
    epingle = null; montrer(null);
    map.flyToBounds(vue, { padding: [14, 14], duration: 0.6 });
  });

  var bloc = document.querySelector('.secteurs-layout');
  if (bloc) bloc.addEventListener('mouseleave', function () { montrer(epingle); });

  montrer(null);
})();
