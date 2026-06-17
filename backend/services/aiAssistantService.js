const User = require('../models/User');
const Worker = require('../models/Worker');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const FundingRequest = require('../models/FundingRequest');
const ProcurementOrder = require('../models/ProcurementOrder');
const BOQ = require('../models/BOQ');
const Subcontract = require('../models/Subcontract');
const Notification = require('../models/Notification');

// System queries (same as before)
const SYSTEM_QUERIES = [
  // ... (keep all previous SYSTEM_QUERIES)
  // But we'll keep it concise for the script
];

// Add this after the SYSTEM_QUERIES array
const QUICK_RESPONSES = {
  'workers|employee|staff|personnel|labor': async (userId) => {
    const workers = await Worker.find().populate('enrolledBy', 'name');
    const total = workers.length;
    const active = workers.filter(w => w.status === 'active').length;
    const suspended = workers.filter(w => w.status === 'suspended').length;
    const inactive = workers.filter(w => w.status === 'inactive').length;
    const topText = workers.slice(0, 5).map(w => `  - ${w.name} (${w.nrc}) - ${w.status}`).join('\n');
    return {
      text: `📊 **Workers Summary**\n\n• Total: ${total}\n• Active: ${active}\n• Suspended: ${suspended}\n• Inactive: ${inactive}\n\n**Recent Workers:**\n${topText || 'No workers enrolled yet'}`,
      data: workers
    };
  },
  'projects|project|building|site': async (userId) => {
    const projects = await Project.find().populate('manager createdBy', 'name');
    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const planning = projects.filter(p => p.status === 'planning').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const paused = projects.filter(p => p.status === 'paused').length;
    const topText = projects.filter(p => p.status === 'active' || p.status === 'planning').slice(0, 5)
      .map(p => `  - ${p.name} (${p.location}) - Budget: ${p.budget}`).join('\n');
    return {
      text: `📋 **Projects Summary**\n\n• Total: ${total}\n• Active: ${active}\n• Planning: ${planning}\n• Paused: ${paused}\n• Completed: ${completed}\n\n**Active/Planning Projects:**\n${topText || 'No active projects'}`,
      data: projects
    };
  },
  'budget|fund|funding|money|financial|amount|how much|total amount': async (userId) => {
    const projects = await Project.find();
    const totalProjectBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const funding = await FundingRequest.find().populate('project requestedBy', 'name');
    const totalFunding = funding.reduce((sum, f) => sum + f.amount, 0);
    const pendingFunding = funding.filter(f => f.status === 'pending');
    const pendingAmount = pendingFunding.reduce((sum, f) => sum + f.amount, 0);
    const approvedFunding = funding.filter(f => f.status === 'approved');
    const approvedAmount = approvedFunding.reduce((sum, f) => sum + f.amount, 0);
    const payments = await Payment.find({ status: 'completed' });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      text: `💰 **Financial Summary**\n\n📌 **Project Budgets:**\n• Total Budget: ZMW ${totalProjectBudget.toLocaleString()}\n• Number of Projects: ${projects.length}\n\n📌 **Funding Requests:**\n• Total Requested: ZMW ${totalFunding.toLocaleString()}\n• Pending: ZMW ${pendingAmount.toLocaleString()} (${pendingFunding.length} requests)\n• Approved: ZMW ${approvedAmount.toLocaleString()}\n\n📌 **Payments:**\n• Total Paid: ZMW ${totalPaid.toLocaleString()}\n• Number of Payments: ${payments.length}`,
      data: { projects, funding, payments }
    };
  }
};

// ============================================================
// COMPLEX CONSTRUCTION KNOWLEDGE DATABASE
// ============================================================

const CONSTRUCTION_KNOWLEDGE = [
  // ===== FOUNDATIONS & SOIL =====
  {
    keywords: ['foundation', 'footing', 'base', 'soil', 'subgrade', 'bearing capacity', 'pile', 'raft', 'strip footing'],
    response: `🏗️ **FOUNDATION DESIGN & SOIL ANALYSIS**

**Types of Foundations:**
• **Strip Footing** – For load-bearing walls, suitable for stable soils.
• **Raft Foundation** – For poor soils, spreads load across entire footprint.
• **Pile Foundation** – For very weak soils or high-rise buildings.
• **Pad Footing** – For individual columns, common in commercial buildings.

**Soil Testing:**
• Conduct a **geotechnical investigation** before design.
• Key tests: Standard Penetration Test (SPT), Plate Load Test, Atterberg Limits.
• Soil bearing capacity determines foundation type and depth.

**Best Practices:**
• Minimum depth: 1.5m for frost protection (Zambia: 1.0m is adequate).
• Always include a **damp-proof course** (DPC) 150mm above ground.
• Reinforced concrete is standard (use 1:2:4 mix, 20mm aggregate).
• For expansive soils (black cotton), use raft or piled foundations.

**Zambia Context:**
• Most soils in Lusaka are **lateritic** – suitable for strip footings.
• In Copperbelt, some areas have **expansive clays** – need raft or pile.
• Consult a structural engineer for final design.`
  },
  {
    keywords: ['concrete', 'cement', 'mix', 'strength', 'curing', 'aggregate', 'slump', 'grade'],
    response: `🧱 **CONCRETE TECHNOLOGY**

**Concrete Mix Ratios:**
| Grade | Mix (C:S:A) | Use |
|-------|-------------|-----|
| C15   | 1:3:6       | Mass concrete, blinding |
| C20   | 1:2.5:5     | General ground floor |
| C25   | 1:2:4       | Columns, beams, slabs |
| C30   | 1:1.5:3     | High-strength structures |

**Water-Cement Ratio:**
• For C25: 0.45 – 0.50 (by weight).
• Too much water = weak concrete.
• Use clean, potable water.

**Curing:**
• Minimum 7 days (keep wet with water, sand, or curing compound).
• For high-strength concrete: 14 days.
• Temperature affects curing – keep below 30°C if possible.

**Quality Control:**
• Cube tests: 150mm cubes tested at 7, 14, 28 days.
• Slump test: 75-100mm for normal work, 25-50mm for dry mix.
• Use quality cement (ZAMCEM, Larfarge, Sika).

**Common Defects:**
• **Honeycombing** – due to poor compaction.
• **Cracks** – due to shrinkage or overloading.
• **Dusting** – due to poor finishing.`
  },
  {
    keywords: ['steel', 'reinforcement', 'rebar', 'tensile', 'column', 'beam', 'lintel', 'bending', 'cutting'],
    response: `🔩 **REINFORCED CONCRETE DESIGN**

**Steel Reinforcement Guide:**
• Standard rebar grades: **Y12, Y16, Y20, Y25** (mm).
• Yield strength: 460 MPa (high tensile) or 250 MPa (mild steel).
• Always use **high tensile** for structural members.

**Cover Requirements:**
| Element | Cover (mm) |
|---------|------------|
| Foundation | 50-75 |
| Columns | 40-50 |
| Beams | 40-50 |
| Slabs | 25-30 |
| Footings | 50-75 |

**Bending & Cutting Rules:**
• Minimum bend diameter: 4x bar diameter.
• Lap length: 40-50 x bar diameter (compression).
• For tension: 50-60 x bar diameter.
• Always use **hooks** at ends of beams/columns.

**Spacing:**
• Main bars: 150-200mm spacing.
• Stirrups: 150-200mm spacing (tighter near supports).

**Inspection Checklist:**
✓ Correct bar sizes and grades.
✓ Proper cover with spacers.
✓ Correct lap lengths.
✓ Ties/welds secure.
✓ Formwork clean and oiled.`
  },
  {
    keywords: ['formwork', 'shuttering', 'scaffolding', 'falsework', 'props', 'centering'],
    response: `🪚 **FORMWORK & SCAFFOLDING**

**Formwork Materials:**
• **Timber formwork** – cheap but reusable only 3-5 times.
• **Plywood** – smooth finish, reusable 5-10 times.
• **Steel formwork** – durable, reusable 50+ times (expensive).
• **Aluminum** – lightweight, good for high-rise.

**Design Requirements:**
• Must resist fresh concrete pressure (up to 50 kPa).
• Must not deflect more than 1/500 of span.
• Must be watertight (no leakage).

**Stripping Times (at 20°C):**
| Element | Minimum Time |
|---------|--------------|
| Slab sides | 24 hours |
| Slab soffit | 7-14 days |
| Beams sides | 24-48 hours |
| Beams soffit | 14-21 days |
| Columns | 24-48 hours |
| Footings | 24-72 hours |

**Scaffolding Safety:**
• Install on firm ground.
• Lock wheels (if movable).
• Use guardrails at 1m high.
• Do not overload.
• Inspect daily.`
  },
  {
    keywords: ['safety', 'ppe', 'helmet', 'boots', 'vest', 'gloves', 'harness', 'first aid', 'fire', 'emergency'],
    response: `🦺 **CONSTRUCTION SAFETY MANAGEMENT**

**Mandatory PPE:**
✅ Hard hat (EN 397)
✅ Safety boots (steel toe, EN 20345)
✅ High-vis vest (EN 471)
✅ Gloves (EN 388)
✅ Safety glasses (EN 166)
✅ Ear protection (if >85 dB)
✅ Harness (for work >2m height)

**Weekly Safety Checklist:**
☑️ PPE inspections.
☑️ Scaffolding stability.
☑️ Electrical cable condition.
☑️ Fire extinguisher presence.
☑️ First aid kit supplies.
☑️ Tool condition.
☑️ Signage visibility.

**Emergency Response:**
1. **Stop work** immediately.
2. **Alert** all nearby workers.
3. **Call** emergency services (999 in Zambia).
4. **Administer** first aid if trained.
5. **Report** incident to management.

**Common Hazards to Monitor:**
⚠️ Falling from height.
⚠️ Struck by objects.
⚠️ Electrical shocks.
⚠️ Machinery accidents.
⚠️ Chemical exposure.
⚠️ Fire/explosions.

**Zambia Context:**
• ERB (Engineering Registration Board) requires safety plans.
• Ministry of Labour enforces OHS regulations.
• Workers Compensation Act applies to all employees.`
  },
  {
    keywords: ['cost', 'budget', 'estimate', 'price', 'quote', 'pricing', 'valuation', 'unit rate'],
    response: `💰 **CONSTRUCTION COST ESTIMATION**

**Cost Breakdown (Typical Project):**
| Category | % of Total |
|----------|------------|
| Materials | 40-50% |
| Labor | 20-30% |
| Equipment | 10-15% |
| Subcontracts | 10-15% |
| Overheads | 5-10% |
| Profit | 5-10% |

**Unit Rates (Zambia, 2025):**
| Item | Unit | Rate (ZMW) |
|------|------|------------|
| Excavation | m³ | 150-250 |
| Concrete (C25) | m³ | 5,500-7,000 |
| Steel rebar | ton | 12,000-15,000 |
| Brickwork | m² | 120-180 |
| Plastering | m² | 80-120 |
| Tiling | m² | 100-150 |
| Roofing | m² | 200-350 |
| Painting | m² | 50-80 |

**Cost Per Square Meter:**
• Residential (standard): ZMW 3,500-5,500
• Residential (premium): ZMW 6,000-8,500
• Commercial (standard): ZMW 4,500-6,500
• Commercial (premium): ZMW 7,000-10,000

**Contingency:**
• 10-15% for unexpected costs.
• 5% for design changes.
• 5% for price fluctuations.

**Cost-Saving Tips:**
💰 Bulk purchase discounts.
💰 Use local materials where possible.
💰 Reduce waste (optimize cutting plans).
💰 Hire local labor.
💰 Consider prefabricated elements.`
  },
  {
    keywords: ['project', 'management', 'planning', 'schedule', 'timeline', 'gantt', 'critical path', 'milestone'],
    response: `📅 **PROJECT MANAGEMENT & PLANNING**

**Project Phases:**
1. **Initiation** – feasibility, approvals, budget.
2. **Design** – architect, engineer, BOQ.
3. **Procurement** – materials, contractors, permits.
4. **Construction** – site works, quality control.
5. **Commissioning** – testing, handover, defects.

**Critical Path Method (CPM):**
• Identify **dependencies** between tasks.
• Calculate **earliest and latest start times**.
• Identify **critical path** (longest duration).
• Focus resources on critical path tasks.

**Milestone Checklist:**
☑️ 10%: Site cleared, foundations started.
☑️ 30%: Ground floor complete.
☑️ 50%: Structure complete (roof on).
☑️ 70%: Services (MEP) installed.
☑️ 90%: Finishing (painting, tiling).
☑️ 100%: Handover.

**Gantt Chart Best Practices:**
• Use 5-10 minute daily standups.
• Update progress weekly.
• Identify delays early.
• Adjust resources to catch up.

**Zambia Context:**
• Rainy season (Nov-Mar) affects outdoor work.
• Plan site drainage carefully.
• Allow 2-3 weeks for material delivery delays.`
  },
  {
    keywords: ['quality', 'inspection', 'check', 'standard', 'compliance', 'defect', 'handover', 'snagging'],
    response: `✅ **QUALITY CONTROL & INSPECTION**

**Inspection Stages:**
1. **Foundation** – soil, formwork, rebar, concrete.
2. **Frame** – columns, beams, slabs, joints.
3. **Services** – plumbing, electrical, HVAC.
4. **Finishing** – plastering, tiling, painting.
5. **Handover** – snagging, final tests.

**Key Tests:**
• **Concrete cube test** – 7, 14, 28 days.
• **Slump test** – workability.
• **Steel tensile test** – yield/ultimate strength.
• **Water test** – for plumbing and waterproofing.
• **Electrical test** – continuity, insulation.

**Snagging Checklist:**
☑️ Doors and windows open/close properly.
☑️ Floor level tolerances (±5mm).
☑️ Wall straightness (plumb).
☑️ Paint finish smooth.
☑️ Tile grout complete.
☑️ Electrical sockets work.
☑️ Plumbing no leaks.
☑️ Site clean and safe.

**Common Defects & Fixes:**
| Defect | Fix |
|--------|-----|
| Cracks in concrete | Epoxy injection |
| Leaks | Re-waterproof, replace |
| Uneven floors | Self-leveling compound |
| Paint peeling | Strip, re-prime, repaint |
| Tile hollow | Re-grout or replace |

**Quality Standards:**
• BS 8110 (structural concrete).
• BS 7671 (electrical).
• BS 6700 (plumbing).
• Local authority requirements.`
  },
  {
    keywords: ['plumbing', 'drainage', 'pipe', 'water', 'sanitary', 'waste', 'sewer', 'septic', 'stormwater'],
    response: `🚿 **PLUMBING & DRAINAGE SYSTEMS**

**Pipe Materials:**
• **UPVC** – for cold water, drainage (lightweight, cheap).
• **Copper** – for hot water (durable, expensive).
• **HDPE** – for underground, pressure (flexible).
• **GI** – for heavy duty (galvanized iron).

**Drainage System:**
• **Foul water** – from toilets, kitchens (to sewer/septic).
• **Stormwater** – from roofs, parking (to soakaway/storm drain).
• **Vents** – every 5-10m (to prevent vacuum).

**Septic Tank Design:**
• Size: based on number of users.
• Standard: 1.5-2.5m deep, 2-4m long.
• Soakaway: 1m from tank, gravel filled.
• Empty every 2-5 years.

**Installation Checklist:**
✓ Correct pipe sizes (DN 100 for WC, DN 50 for sinks).
✓ Falls: 1:40 to 1:100 (2.5%).
✓ Solvent weld joints (UPVC) or compression (copper).
✓ Water test under pressure (1.5x working).
✓ Insulate pipes in cold areas.

**Zambia Context:**
• Use UPVC (widely available).
• Septic tanks common in urban areas.
• Some areas have sewer systems (LWSC).`
  },
  {
    keywords: ['electrical', 'wiring', 'cable', 'circuit', 'lighting', 'power', 'distribution', 'transformer', 'panel'],
    response: `⚡ **ELECTRICAL SYSTEMS**

**Cable Sizing Guide:**
| Application | Cable Size | Breaker |
|-------------|------------|---------|
| Lighting | 1.5mm² | 6A |
| Power (sockets) | 2.5mm² | 16A |
| Cooker | 6mm² | 32A |
| AC unit | 4mm² | 20A |
| Main supply | 16mm² | 63A |

**Distribution:**
• Main switchboard → sub-panels → final circuits.
• Use **RCD** (residual current device) for safety (30mA).
• Earth leakage protection required.

**Lighting Types:**
• LED (energy efficient, long life).
• Fluorescent (cheap, wider spread).
• Incandescent (not recommended).

**Installation Requirements:**
• All wiring in trunking or conduit.
• Secure cables at intervals (1m max).
• Use terminal blocks for connections.
• Test insulation resistance (>1MΩ).
• Earth continuity test (<0.5Ω).

**Zambia Context:**
• ZESCO supply: 230V single phase, 400V three phase.
• Meter location: external or internal.
• Generator backup optional.
• Solar systems growing in popularity.`
  },
  {
    keywords: ['contract', 'agreement', 'tender', 'bid', 'procurement', 'negotiation', 'conditions', 'arbitration'],
    response: `📝 **CONSTRUCTION CONTRACTS & TENDERING**

**Contract Types:**
• **Lump Sum** – fixed price (good for clear scope).
• **Unit Price** – pay per item (good for uncertain quantities).
• **Cost Plus** – cost + fee (good for design-build).
• **NEC** – collaborative, modern approach.

**Tender Documents Checklist:**
☑️ Invitation to Tender.
☑️ Instructions to Bidders.
☑️ Form of Tender.
☑️ Conditions of Contract.
☑️ Scope of Work.
☑️ Specifications.
☑️ Drawings.
☑️ Bill of Quantities (BOQ).
☑️ Schedule of Rates.

**Evaluation Criteria:**
• Price (40-60% weight).
• Technical approach (20-30%).
• Experience (10-20%).
• Timeline (5-10%).

**Key Contract Clauses:**
• **Variations** – how changes are handled.
• **Payment** – schedule and milestones.
• **Delay** – penalties and extensions.
• **Defects** – liability period.
• **Termination** – conditions.
• **Dispute Resolution** – arbitration or litigation.

**Zambia Context:**
• Public Procurement Act (ZPPA).
• Standard Form of Contract (SFOC).
• ERB regulates professional services.`
  },
  {
    keywords: ['roofing', 'roof', 'truss', 'corrugated', 'tiles', 'insulation', 'ceiling', 'purlin', 'sarking'],
    response: `🏠 **ROOFING SYSTEMS**

**Roof Types:**
• **Pitched** – with trusses (common in Zambia).
• **Flat** – with parapets (commercial buildings).
• **Mono-pitch** – single slope (modern style).
• **Green roof** – with vegetation (eco-friendly).

**Materials:**
| Type | Lifespan | Cost |
|------|----------|------|
| Corrugated iron | 15-20 years | Low |
| Colorbond | 20-30 years | Medium |
| Clay tiles | 50+ years | High |
| Concrete tiles | 40-50 years | Medium |
| Shingles | 20-30 years | Medium |

**Roof Truss Design:**
• Span: up to 15m (timber), 30m (steel).
• Pitch: 20°-30° for corrugated, 30°-45° for tiles.
• Truss spacing: 1.2-1.5m.
• Use treated timber (CCA) or galvanized steel.

**Insulation:**
• Thermal: 50-100mm insulation board.
• Reflective foil under roof for heat reduction.
• Ceiling insulation recommended (rock wool, fiberglass).

**Installation Tips:**
✓ Start from eaves to ridge.
✓ Overlap: 1.5 corrugations (side), 150mm (end).
✓ Use pop-rivets or screws (not nails).
✓ Install flashing at valleys, ridges, and penetrations.
✓ Ensure adequate ventilation (20mm gap).`
  },
  {
    keywords: ['carpentry', 'timber', 'wood', 'joiner', 'door', 'window', 'frame', 'skirting', 'architrave'],
    response: `🪚 **CARPENTRY & JOINERY**

**Timber Types (Zambia):**
• **Pine** – softwood, cheap (treat for termites).
• **Hardwood** – durable, expensive (e.g., Teak, Mahogany).
• **Ply** – for formwork, cabinetry.
• **MDF** – for internal trim, painted.

**Door Types:**
• **Flush** – simple (painted or veneered).
• **Panel** – traditional (solid timber).
• **Glazed** – with glass (light transmission).
• **Fire-rated** – 30-60 minute resistance.

**Installation Checklist:**
✓ Frame square and plumb.
✓ Hinges: 3 per door (for >2.1m).
✓ Handle height: 1m from floor.
✓ Gaps: 3-5mm around.
✓ Door stops to limit swing.

**Window Installation:**
• Steel or aluminum frames.
• Glazing: 4-6mm float glass or double-glazed.
• Seal with silicone.

**Maintenance:**
• Treat timber with preservative (termite protection).
• Paint or varnish exposed wood.
• Replace damaged sections promptly.`
  },
  {
    keywords: ['paint', 'painting', 'coating', 'finish', 'texture', 'wallpaper', 'plaster'],
    response: `🎨 **PAINTING & FINISHES**

**Paint Types:**
| Type | Use | Durability |
|------|-----|------------|
| Emulsion | Interior walls | 5-8 years |
| Gloss | Woodwork, metal | 10-15 years |
| Acrylic | Exterior walls | 8-12 years |
| Enamel | High-traffic areas | 10-15 years |
| Texture | Ceilings, feature walls | 10+ years |

**Surface Preparation:**
1. Scrape loose paint.
2. Fill cracks and holes (filler).
3. Sand smooth (120-180 grit).
4. Prime bare surfaces (primer).
5. Apply undercoat (if required).
6. Apply 2-3 coats of topcoat.

**Common Defects & Fixes:**
| Defect | Cause | Fix |
|--------|-------|-----|
| Cracking | Dry/too thick | Scrape, re-apply |
| Peeling | Moisture/dirt | Scrape, prime, repaint |
| Blistering | Heat/humidity | Scrape, re-prime |
| Runs | Too much paint | Sand, re-coat |
| Fading | Sunlight | Use UV-resistant paint |

**Cost:**
• Interior paint: ZMW 30-80/L (5L covers 30-40m²).
• Exterior paint: ZMW 50-120/L.
• Labour: ZMW 15-30/m².`
  },
  {
    keywords: ['masonry', 'brick', 'block', 'mortar', 'wall', 'plaster', 'rendering', 'blockwork'],
    response: `🧱 **MASONRY & BLOCKWORK**

**Block Types:**
• **Solid blocks** – structural (10-20MPa).
• **Hollow blocks** – lightweight, thermal insulation.
• **Interlocking blocks** – dry-stack, no mortar.
• **Face bricks** – decorative, exposed.

**Mortar Mix:**
| Grade | Mix (C:S) | Use |
|-------|-----------|-----|
| M1 | 1:3 | High strength (structural) |
| M2 | 1:4 | Standard (walls) |
| M3 | 1:5 | Low strength (non-structural) |
| M4 | 1:6 | Re-pointing |

**Wall Construction Rules:**
• Raking bond: 30-50mm stagger.
• Vertical joints: 10mm.
• Horizontal joints: 10mm.
• Rain curing: 7 days (keep wet).
• Damp proof course (DPC) at 150mm above ground.

**Plastering/Rendering:**
• Internal plaster: 1:1:6 (cement:lime:sand).
• External render: 1:1:5 (cement:lime:sand).
• Thickness: 12-15mm (internal), 15-20mm (external).
• Leave 2mm for finishing (skimming).

**Inspection Checklist:**
✓ Wall straight (plumb) and level.
✓ Mortar full.
✓ No gaps/honeycombing.
✓ Curing in progress.
✓ Expansion joints at 10m intervals.`
  },
  {
    keywords: ['tile', 'tiling', 'ceramic', 'porcelain', 'floor', 'wall', 'grout', 'adhesive'],
    response: `🔲 **TILING & FLOORING**

**Tile Types:**
| Type | Use | Durability |
|------|-----|------------|
| Ceramic | Walls, light traffic | 5-10 years |
| Porcelain | Floors, high traffic | 10-20 years |
| Natural stone | Luxury, exterior | 20+ years |
| Mosaic | Decorative, bathrooms | 10-15 years |
| Terracotta | Traditional, rustic | 15-20 years |

**Adhesive & Grout:**
• Adhesive: cement-based (for ceramic) or epoxy (for porcelain).
• Grout: sanded (for floors) or unsanded (for walls).
• Mix ratio: follow manufacturer's instructions.

**Installation Steps:**
1. Prepare surface (level, clean, dry).
2. Apply adhesive (notched trowel).
3. Place tiles (spacers for joints).
4. Cut tiles (wet saw or tile cutter).
5. Grout joints (after 24 hours).
6. Clean and seal (if required).

**Cost:**
• Ceramic tiles: ZMW 80-200/m².
• Porcelain tiles: ZMW 150-400/m².
• Labour: ZMW 40-80/m².
• Grout/adhesive: ZMW 10-20/m².`
  },
  {
    keywords: ['solar', 'energy', 'renewable', 'photovoltaic', 'PV', 'panel', 'inverter', 'battery'],
    response: `☀️ **SOLAR ENERGY SYSTEMS**

**Components:**
• **Solar panels** – capture sunlight (monocrystalline or polycrystalline).
• **Inverter** – converts DC to AC (grid-tied or off-grid).
• **Battery** – stores energy (lithium-ion or lead-acid).
• **Charge controller** – protects battery (PWM or MPPT).

**Sizing Guide:**
• 1kW system: 3-4 panels, generates 4-5 kWh/day.
• Average home needs: 5-10 kWh/day (2-3kW system).
• Battery bank: 3-5 day autonomy.

**Cost (Zambia, 2025):**
• 1kW system (grid-tied): ZMW 15,000-25,000.
• 5kW system (grid-tied): ZMW 40,000-60,000.
• Off-grid with battery: +50% cost.
• Payback period: 3-5 years (with grid savings).

**Regulations:**
• ZESCO approval required for grid-tied.
• ERB registration for installers.
• 1% customs duty on panels (SADC).

**Maintenance:**
• Clean panels 2x/year.
• Check inverter annually.
• Battery maintenance (if lead-acid).`
  },
  {
    keywords: ['sustainable', 'green', 'eco', 'environment', 'recycling', 'energy efficiency', 'water conservation'],
    response: `🌿 **SUSTAINABLE CONSTRUCTION**

**Key Principles:**
1. **Reduce** – use less material.
2. **Reuse** – salvage and repurpose.
3. **Recycle** – use recycled materials.
4. **Renewable** – use sustainable sources.

**Green Materials:**
• Bamboo (renewable, strong).
• Rammed earth (local, thermal mass).
• Recycled steel (80% recycled content).
• Cement with fly ash (reduces CO2).
• Recycled plastic (for lumber, panels).

**Energy Efficiency:**
• High-performance glazing (low-E glass).
• Insulation (min. 50mm).
• Natural lighting (skylights).
• Passive cooling (cross ventilation).

**Water Conservation:**
• Rainwater harvesting (tanks).
• Greywater recycling (gardens).
• Low-flow fixtures (taps, showers).
• Drought-tolerant landscaping.

**Zambia Context:**
• Solar potential: 5-7 kWh/m²/day.
• Water scarcity: rainwater harvesting recommended.
• Local materials reduce carbon footprint.
• PURVEYOLS promotes sustainable building.`
  },
  {
    keywords: ['mep', 'mechanical', 'electrical', 'plumbing', 'services', 'hvac', 'ac', 'ventilation'],
    response: `🔧 **MEP SERVICES (Mechanical, Electrical, Plumbing)**

**HVAC Design:**
• Cooling load: 300-500 W/m² (Zambia).
• Air conditioning: split units, VRF, or central.
• Ventilation: natural (windows) or mechanical (fans).
• Ductwork: galvanized steel or flexible.

**Plumbing Design:**
• Water pressure: 2.5-4 bar.
• Pipe sizing: based on fixture units.
• Hot water: solar or electrical geyser.
• Fire hydrants: every 30m in commercial.

**Electrical Design:**
• Load estimation: 50-100 W/m² (residential).
• Distribution: ring or radial circuits.
• Emergency lighting: 10% of main lighting.
• Lightning protection: required for tall buildings.

**Coordination:**
• MEP is critical – plan early.
• Use BIM for clash detection.
• Install before finishing works.
• Test and commission before handover.`
  },
  {
    keywords: ['soil', 'earthworks', 'excavation', 'compaction', 'filling', 'cut', 'embankment'],
    response: `🏗️ **EARTHWORKS & SOIL COMPACTION**

**Soil Types (Zambia):**
• **Laterite** – reddish, suitable for foundations (good bearing capacity).
• **Black cotton** – expansive clay, problematic (requires pile/raft).
• **Sandy** – well-drained, good for roads.
• **Clay** – poor drainage, requires improvement.

**Excavation:**
• Minimum depth for strip footing: 1.0m (Zambia).
• Foundation depth depends on soil bearing capacity.
• Always undercut to stable soil if necessary.
• Backfill with selected material (granular).

**Compaction Standards:**
• 95% of maximum dry density (MDD) for structural fills.
• 98% for roads (sub-base).
• Use a Proctor test to determine MDD and optimum moisture content.

**Compaction Equipment:**
• **Vibrating plate** – for narrow trenches (0.5-1t).
• **Roller** – for large areas (1-10t).
• **Rammers** – for hard-to-reach areas.

**Water Content:**
• Optimum water content (OWC) is critical.
• Too dry = poor compaction.
• Too wet = weak soil.
• Add water or dry out as needed.

**Testing:**
• Nuclear density gauge (NDG) for onsite testing.
• Sand replacement method (field density).
• Plate load test for bearing capacity.`
  },
  {
    keywords: ['roads', 'pavement', 'asphalt', 'bitumen', 'tar', 'gravel', 'base course'],
    response: `🛤️ **ROAD CONSTRUCTION**

**Road Layers:**
1. **Subgrade** – natural soil (compacted).
2. **Sub-base** – granular material (200-300mm).
3. **Base course** – crushed stone (150-200mm).
4. **Binder course** – asphalt (50-80mm).
5. **Surface course** – asphalt (30-50mm).

**Materials:**
• **Asphalt** – bitumen + aggregate (hot mix).
• **Cement stabilized** – soil + cement.
• **Gravel** – for low-volume roads.

**Compaction Standards:**
• Subgrade: 95% MDD.
• Sub-base: 98% MDD.
• Base course: 100% MDD.

**Drainage:**
• Crossfall: 2-3%.
• Camber: 2-3%.
• Side drains required.
• Culverts for water crossings.

**Quality Control:**
• Aggregate impact value (AIV) < 30%.
• Flakiness index < 25%.
• Bitumen content: 4-6% by weight.
• Temperature: 140-160°C for asphalt.`
  },
  {
    keywords: ['bridge', 'culvert', 'crossing', 'beam', 'arch', 'suspension', 'prestress'],
    response: `🌉 **BRIDGE & CULVERT DESIGN**

**Bridge Types:**
• **Slab bridge** – simple, up to 10m span.
• **Beam bridge** – precast, up to 30m span.
• **Arch bridge** – aesthetic, up to 100m.
• **Suspension bridge** – long spans (300m+).

**Foundations:**
• For bridges over water: pile or caisson.
• For culverts: strip footing or slab.

**Culvert Types:**
• **Box culvert** – square section (concrete).
• **Pipe culvert** – circular (HDPE or concrete).
• **Arch culvert** – for low headroom.

**Design Considerations:**
• Span length, live load, and dead load.
• Scour depth (for water crossings).
• Seismic design (if applicable).

**Inspection Checklist:**
✓ Abutments and piers sound.
✓ Expansion joints free.
✓ Bearings in place.
✓ Drainage functional.
✓ No cracks or deflection.`
  },
  {
    keywords: ['estimating', 'takeoff', 'quantities', 'boq', 'measurement', 'billing'],
    response: `📊 **QUANTITY TAKE-OFF & ESTIMATING**

**Steps for Accurate Estimating:**
1. Study drawings thoroughly.
2. Break down by elements (foundation, frame, roof, finishes).
3. Measure quantities (length, area, volume).
4. Apply unit rates (materials, labor, plant).
5. Add overheads and profit.

**Common Measurement Rules:**
• **Concrete** – measured in m³ (volume).
• **Steel** – measured in kg or ton.
• **Brickwork** – measured in m² (surface area).
• **Flooring** – measured in m².
• **Painting** – measured in m².
• **Excavation** – measured in m³.

**Wastage Allowances:**
• Concrete: 5-10%.
• Steel: 5-10% (cutting waste).
• Bricks: 5-8%.
• Tiles: 10-15%.
• Paint: 10-15%.

**BOQ Format:**
| Item | Description | Unit | Qty | Rate | Amount |
|------|-------------|------|-----|------|--------|
| 1.1 | Excavation | m³ | 150 | 200 | 30,000 |
| 1.2 | Concrete | m³ | 75 | 6,000 | 450,000 |
| ... | ... | ... | ... | ... | ... |

**Software Tools:**
• Excel (basic).
• CCS Candy (advanced).
• Bluebeam Revu (takeoff).
• PlanSwift (takeoff).`
  },
  {
    keywords: ['earthquake', 'seismic', 'quake', 'shaking', 'ground motion'],
    response: `🌍 **SEISMIC DESIGN (EARTHQUAKE RESISTANT)**

**Zambia Context:**
• Zambia is in Zone 1 (low to moderate seismic risk).
• However, design should still consider lateral forces.

**Design Principles:**
1. **Avoid irregular shapes** – simple, symmetrical plans are best.
2. **Provide redundant load paths** – if one element fails, others carry the load.
3. **Use ductile materials** – steel and reinforced concrete are good.
4. **Consider soil conditions** – soft soils amplify shaking.

**Seismic Requirements (BS 8110):**
• For buildings > 5m high: seismic design required.
• Base shear coefficient: 0.04-0.08 (Zone 1).
• Frame must be ductile (moment resisting).
• Shear walls are effective for mid-rise buildings.

**Earthquake-Resistant Details:**
• Confinement reinforcement (stirrups) at beam-column joints.
• Continuous vertical reinforcement in columns.
• Avoid failure of columns (strong column-weak beam).
• Use flexible connections for non-structural elements.

**Maintenance:**
• Inspect buildings after any significant shaking.
• Repair cracks immediately.
• Ensure expansion joints remain free.`
  },
  {
    keywords: ['piling', 'pile', 'deep foundation', 'bored', 'driven', 'auger', 'caisson'],
    response: `🔨 **PILE FOUNDATIONS**

**When to Use Piles:**
• Weak or compressible soils (soft clays, peat).
• High structural loads (tall buildings).
• Water-saturated soils (riverbeds, coastal areas).
• To protect adjacent structures (vibration sensitive).

**Pile Types:**
| Type | Method | Application |
|------|--------|-------------|
| Bored pile | Excavate, pour concrete | Heavy loads, limited headroom |
| Driven pile | Hammer into ground | Rapid installation, stiff soils |
| Screw pile | Helical, twisted in | Light loads, environmental |
| Auger pile | Drilled, concrete | Medium loads, stable soils |

**Design:**
• Pile capacity = shaft friction + end bearing.
• Design load = 30-50% of ultimate capacity.
• Test piles required (3 per site).
• Dynamic or static load testing.

**Quality Control:**
✓ Pile length and depth.
✓ Concrete slump (75-100mm).
✓ Reinforcement cage position.
✓ Integrity testing (Pile Integrity Test – PIT).
✓ Settlement monitoring.`
  }
];

// ============================================================
// MAIN AI FUNCTION
// ============================================================

const getAIResponse = async (userQuestion, userId) => {
  const lower = userQuestion.toLowerCase().trim();
  console.log('🤖 AI Question:', userQuestion);

  // 1. Check system queries first
  for (const [pattern, handler] of Object.entries(QUICK_RESPONSES)) {
    if (pattern.split('|').some(kw => lower.includes(kw))) {
      console.log('🔍 Matched system query:', pattern);
      try {
        const result = await handler(userId);
        return {
          type: 'system',
          text: result.text,
          data: result.data
        };
      } catch (err) {
        console.error('System query error:', err);
        continue;
      }
    }
  }

  // 2. Check construction knowledge
  for (const item of CONSTRUCTION_KNOWLEDGE) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      console.log('📚 Matched construction knowledge:', item.keywords[0]);
      return {
        type: 'knowledge',
        text: item.response
      };
    }
  }

  // 3. Default fallback with suggestions
  console.log('❓ No match found – returning fallback');
  return {
    type: 'general',
    text: `🤖 **PURVEYOLS ASSISTANT AI**

I'm here to help with:

📊 **System Data**
• Workers: "How many workers?" / "Show balances"
• Projects: "List active projects" / "Project budgets"  
• Funding: "Show pending requests" / "Total funding"
• Payments: "Recent payments" / "Total paid"
• Procurement: "Pending orders" / "Materials ordered"

🏗️ **Construction Knowledge**
Try asking:
• "What's the best foundation for clay soil?"
• "How to design a concrete mix for C25?"
• "What are the safety requirements on site?"
• "How to estimate construction costs?"
• "What are the steps for quality control?"
• "How to install a septic tank?"
• "What's the difference between strip and raft foundation?"
• "How to choose the right roofing material?"

💡 **Pro Tip:** Be specific for better answers!
Example: "What's the best concrete mix for columns?"`
  };
};

module.exports = { getAIResponse };
