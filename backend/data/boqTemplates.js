// backend/data/boqTemplates.js
module.exports = {
  // ─── ZANACO BANK ──────────────────────────────────────────────
  'Zanaco Bank': {
    name: 'Zanaco Bank Refurbishment',
    description: 'Standard BOQ for Zanaco Bank refurbishments',
    sections: [
      {
        title: 'PRELIMINARY AND GENERAL ITEMS',
        description: 'All contract preliminaries and general clauses',
        items: [
          { description: 'Site establishment and demobilization', unit: 'lump', quantity: 1, rate: 0 },
          { description: 'Site hoardings and security', unit: 'lump', quantity: 1, rate: 0 },
          { description: 'Insurance and performance security', unit: 'lump', quantity: 1, rate: 0 },
          { description: 'Portable water supply', unit: 'lump', quantity: 1, rate: 0 },
          { description: 'Compliance with environmental clauses', unit: 'lump', quantity: 1, rate: 0 },
          { description: 'Contract name signs', unit: 'no', quantity: 1, rate: 0 },
          { description: 'Material testing (provisional)', unit: 'lump', quantity: 1, rate: 0 },
          { description: 'Personal Protective Equipment (PPE)', unit: 'lump', quantity: 1, rate: 0 },
        ],
      },
      {
        title: 'DEMOLITIONS',
        description: 'All demolition and removal works',
        items: [
          { description: 'Remove existing steel door (1000x2000mm)', unit: 'no', quantity: 1, rate: 0 },
          { description: 'Scrape paint from vault/ATM doors (single)', unit: 'no', quantity: 3, rate: 0 },
          { description: 'Scrape paint from vault/ATM doors (double)', unit: 'no', quantity: 1, rate: 0 },
          { description: 'Remove WC suites', unit: 'no', quantity: 4, rate: 0 },
          { description: 'Remove wash hand basins', unit: 'no', quantity: 5, rate: 0 },
          { description: 'Remove urinals', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Remove mirrors', unit: 'no', quantity: 2, rate: 0 },
          { description: 'Remove hand dryers', unit: 'no', quantity: 2, rate: 0 },
          { description: 'Remove kitchen cabinets', unit: 'no', quantity: 1, rate: 0 },
          { description: 'Demolish stone-like floor finish (55m²)', unit: 'm²', quantity: 55, rate: 0 },
          { description: 'Remove steel grille (46m²)', unit: 'm²', quantity: 46, rate: 0 },
          { description: 'Remove single doors (19No.)', unit: 'no', quantity: 19, rate: 0 },
          { description: 'Remove double doors (6No.)', unit: 'no', quantity: 6, rate: 0 },
          { description: 'Remove aluminium shopfront/partitioning (70m²)', unit: 'm²', quantity: 70, rate: 0 },
          { description: 'Remove windows glazing (4No.)', unit: 'no', quantity: 4, rate: 0 },
          { description: 'Scrape paint from plastered walls (1125m²)', unit: 'm²', quantity: 1125, rate: 0 },
          { description: 'Scrape paint from plastered walls (244m²)', unit: 'm²', quantity: 244, rate: 0 },
          { description: 'Remove teller counters', unit: 'no', quantity: 5, rate: 0 },
          { description: 'Remove existing ceiling (84m²)', unit: 'm²', quantity: 84, rate: 0 },
          { description: 'Hack off floor tiles (158m²)', unit: 'm²', quantity: 158, rate: 0 },
          { description: 'Hack off wall tiles (77m²)', unit: 'm²', quantity: 77, rate: 0 },
          { description: 'Demolish blockwall (198m²)', unit: 'm²', quantity: 198, rate: 0 },
          { description: 'Prepare terrazo floor (10m²)', unit: 'm²', quantity: 10, rate: 0 },
        ],
      },
      {
        title: 'PLUMBING INSTALLATION',
        description: 'All plumbing and sanitary fittings',
        items: [
          { description: 'Copper pipe connector (15mm)', unit: 'no', quantity: 12, rate: 0 },
          { description: 'Brass stop valve (15mm)', unit: 'no', quantity: 12, rate: 0 },
          { description: 'PVC pan connector (110mm)', unit: 'no', quantity: 5, rate: 0 },
          { description: 'Stainless steel floor drain', unit: 'no', quantity: 2, rate: 0 },
          { description: 'Gulley P trap (110mm)', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Water closet suite', unit: 'no', quantity: 5, rate: 0 },
          { description: 'Urinal bowl', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Wash hand basin', unit: 'no', quantity: 4, rate: 0 },
          { description: 'Basin mixer (chrome finished)', unit: 'no', quantity: 4, rate: 0 },
          { description: 'Bottle trap (32mm)', unit: 'no', quantity: 4, rate: 0 },
          { description: 'Toilet roll holder', unit: 'no', quantity: 5, rate: 0 },
          { description: 'Soap dispenser', unit: 'no', quantity: 2, rate: 0 },
        ],
      },
      {
        title: 'PAINTING AND DECORATIONS',
        description: 'All painting and decoration works',
        items: [
          { description: 'Exterior wall painting (Plascon Micatex)', unit: 'm²', quantity: 184, rate: 0 },
          { description: 'Exterior reveals (100-200mm wide)', unit: 'm', quantity: 27, rate: 0 },
          { description: 'Interior wall painting (PVA)', unit: 'm²', quantity: 131, rate: 0 },
          { description: 'Interior reveals (100-200mm wide)', unit: 'm', quantity: 33, rate: 0 },
          { description: 'Polyurethane varnish on wood doors', unit: 'm²', quantity: 44, rate: 0 },
          { description: 'Metal door frames painting', unit: 'm', quantity: 16, rate: 0 },
        ],
      },
      {
        title: 'PRIME COST AND PROVISIONAL SUMS',
        description: 'Provisional and prime cost sums',
        items: [
          { description: 'Air conditioning installation (PC Sum)', unit: 'lump', quantity: 1, rate: 300000 },
          { description: 'Main contractor\'s profit on AC (2.5%)', unit: '%', quantity: 1, rate: 0 },
          { description: 'Attendance on AC installation (2.5%)', unit: '%', quantity: 1, rate: 0 },
          { description: 'Extractor fans (4No.)', unit: 'no', quantity: 4, rate: 6250 },
          { description: 'External works (PC Sum)', unit: 'lump', quantity: 1, rate: 100000 },
        ],
      },
    ],
  },

  // ─── RESIDENTIAL HOUSE ──────────────────────────────────────────
  'Residential House': {
    name: 'Residential House Construction',
    description: 'Standard BOQ for a residential house',
    sections: [
      {
        title: 'SITE WORKS',
        description: 'Site preparation and earthworks',
        items: [
          { description: 'Site clearing and grubbing', unit: 'm²', quantity: 500, rate: 0 },
          { description: 'Excavation for foundations', unit: 'm³', quantity: 80, rate: 0 },
          { description: 'Backfilling and compaction', unit: 'm³', quantity: 40, rate: 0 },
          { description: 'Foundation concrete (C20)', unit: 'm³', quantity: 30, rate: 0 },
          { description: 'Reinforcement steel', unit: 'kg', quantity: 2000, rate: 0 },
        ],
      },
      {
        title: 'STRUCTURAL WORKS',
        description: 'Concrete, reinforcement and formwork',
        items: [
          { description: 'Ground floor slab (C25)', unit: 'm³', quantity: 25, rate: 0 },
          { description: 'Columns and beams (C25)', unit: 'm³', quantity: 15, rate: 0 },
          { description: 'Reinforcement steel for slab', unit: 'kg', quantity: 1500, rate: 0 },
          { description: 'Formwork to slab and beams', unit: 'm²', quantity: 120, rate: 0 },
        ],
      },
      {
        title: 'WALLS AND MASONRY',
        description: 'Blockwork and plastering',
        items: [
          { description: '200mm thick blockwork', unit: 'm²', quantity: 180, rate: 0 },
          { description: 'Internal plastering', unit: 'm²', quantity: 280, rate: 0 },
          { description: 'External plastering', unit: 'm²', quantity: 220, rate: 0 },
        ],
      },
      {
        title: 'ROOFING AND CEILINGS',
        description: 'Roof structure and ceiling',
        items: [
          { description: 'Timber roof trusses', unit: 'no', quantity: 12, rate: 0 },
          { description: 'Roof covering (corrugated iron)', unit: 'm²', quantity: 180, rate: 0 },
          { description: 'Ceiling boards (10mm)', unit: 'm²', quantity: 150, rate: 0 },
          { description: 'Fascia and gutters', unit: 'm', quantity: 60, rate: 0 },
        ],
      },
    ],
  },

  // ─── COMMERCIAL BUILDING ──────────────────────────────────────────
  'Commercial Building': {
    name: 'Commercial Building Construction',
    description: 'Standard BOQ for a commercial building',
    sections: [
      {
        title: 'DEMOLITION AND SITE CLEARANCE',
        description: 'Site preparation',
        items: [
          { description: 'Demolish existing structures', unit: 'm²', quantity: 0, rate: 0 },
          { description: 'Site clearance and levelling', unit: 'm²', quantity: 0, rate: 0 },
        ],
      },
      {
        title: 'FOUNDATIONS AND SUBSTRUCTURE',
        description: 'Below ground works',
        items: [
          { description: 'Excavation (bulk)', unit: 'm³', quantity: 0, rate: 0 },
          { description: 'Blinding concrete (C15)', unit: 'm³', quantity: 0, rate: 0 },
          { description: 'Reinforced concrete raft (C30)', unit: 'm³', quantity: 0, rate: 0 },
          { description: 'Reinforcement steel', unit: 'kg', quantity: 0, rate: 0 },
        ],
      },
    ],
  },

  // ─── ROAD CONSTRUCTION ────────────────────────────────────────────
  'Road Construction': {
    name: 'Road Construction BOQ',
    description: 'Standard BOQ for road construction projects',
    sections: [
      {
        title: 'EARTHWORKS',
        description: 'Cut and fill operations',
        items: [
          { description: 'Clearing and grubbing', unit: 'ha', quantity: 0, rate: 0 },
          { description: 'Bulk excavation (cut)', unit: 'm³', quantity: 0, rate: 0 },
          { description: 'Embankment construction (fill)', unit: 'm³', quantity: 0, rate: 0 },
          { description: 'Compaction', unit: 'm³', quantity: 0, rate: 0 },
        ],
      },
      {
        title: 'ROAD LAYERS',
        description: 'Subgrade, subbase, base course',
        items: [
          { description: 'Subgrade preparation', unit: 'm²', quantity: 0, rate: 0 },
          { description: 'Gravel subbase (150mm)', unit: 'm²', quantity: 0, rate: 0 },
          { description: 'Base course (200mm)', unit: 'm²', quantity: 0, rate: 0 },
          { description: 'Asphalt wearing course (50mm)', unit: 'm²', quantity: 0, rate: 0 },
        ],
      },
      {
        title: 'DRAINAGE',
        description: 'Stormwater and drainage works',
        items: [
          { description: 'Stormwater pipes (600mm)', unit: 'm', quantity: 0, rate: 0 },
          { description: 'Culverts', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Drainage channels', unit: 'm', quantity: 0, rate: 0 },
        ],
      },
    ],
  },

  // ─── BRIDGE CONSTRUCTION ──────────────────────────────────────────
  'Bridge Construction': {
    name: 'Bridge Construction BOQ',
    description: 'Standard BOQ for bridge construction',
    sections: [
      {
        title: 'FOUNDATIONS',
        description: 'Pile and abutment foundations',
        items: [
          { description: 'Bored piles (1200mm)', unit: 'm', quantity: 0, rate: 0 },
          { description: 'Reinforcement for piles', unit: 'kg', quantity: 0, rate: 0 },
          { description: 'Concrete pile caps (C35)', unit: 'm³', quantity: 0, rate: 0 },
        ],
      },
      {
        title: 'SUPERSTRUCTURE',
        description: 'Deck and girders',
        items: [
          { description: 'Precast concrete girders', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Deck slab concrete (C35)', unit: 'm³', quantity: 0, rate: 0 },
          { description: 'Reinforcement for deck', unit: 'kg', quantity: 0, rate: 0 },
          { description: 'Asphalt wearing course', unit: 'm²', quantity: 0, rate: 0 },
        ],
      },
      {
        title: 'BALUSTRADES AND FENCING',
        description: 'Safety barriers',
        items: [
          { description: 'Steel balustrades', unit: 'm', quantity: 0, rate: 0 },
          { description: 'Fencing', unit: 'm', quantity: 0, rate: 0 },
        ],
      },
    ],
  },

  // ─── WATER RETICULATION ────────────────────────────────────────────
  'Water Reticulation': {
    name: 'Water Reticulation BOQ',
    description: 'Standard BOQ for water supply and reticulation',
    sections: [
      {
        title: 'PIPELINES',
        description: 'Water mains and distribution pipes',
        items: [
          { description: 'PVC pipe (110mm)', unit: 'm', quantity: 0, rate: 0 },
          { description: 'PVC pipe (160mm)', unit: 'm', quantity: 0, rate: 0 },
          { description: 'HDPE pipe (90mm)', unit: 'm', quantity: 0, rate: 0 },
          { description: 'Trench excavation for pipes', unit: 'm³', quantity: 0, rate: 0 },
          { description: 'Bedding and backfill', unit: 'm³', quantity: 0, rate: 0 },
        ],
      },
      {
        title: 'FITTINGS AND VALVES',
        description: 'Control and distribution fittings',
        items: [
          { description: 'Gate valves (100mm)', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Air release valves', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Fire hydrants', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Water meters', unit: 'no', quantity: 0, rate: 0 },
        ],
      },
      {
        title: 'RESERVOIRS AND TANKS',
        description: 'Water storage facilities',
        items: [
          { description: 'Reinforced concrete tank (C30)', unit: 'm³', quantity: 0, rate: 0 },
          { description: 'Steel water tank (100kL)', unit: 'no', quantity: 0, rate: 0 },
          { description: 'Pump house', unit: 'm²', quantity: 0, rate: 0 },
        ],
      },
    ],
  },
};