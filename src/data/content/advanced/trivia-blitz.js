/**
 * Advanced Trivia Blitz — Content Data
 * College-level soil science questions.
 * Sources: USDA Soil Health Lesson Plans PDF + upgraded kid content + credible web sources.
 *
 * Rounds:
 * - Upgraded from kid: Soil Health Principles, Indigenous Farming, Carbon Cycle,
 *   Climate Change, Agronomy Careers, Soil Art & Culture, Conservation Practices
 * - New from PDF: Bulk Density & Compaction, Soil Texture & Structure,
 *   Nitrogen Cycle Processes, Phosphorus Management, Soil Infiltration & Water,
 *   Electrical Conductivity, Soil pH & Management
 */

export const ROUNDS = [
  // ─── ROUND 1: Soil Health Principles ───
  {
    id: 'soil-health-principles',
    title: 'Soil Health Principles',
    questions: [
      {
        text: 'The five principles of soil health — soil cover, minimal disturbance, plant diversity, living roots, and livestock integration — are designed to mimic which natural system?',
        choices: ['Tropical rainforest canopy dynamics', 'Native grassland and prairie ecosystems', 'Deep ocean nutrient cycling', 'Volcanic soil formation processes'],
        correct: 1,
      },
      {
        text: 'Why does maintaining living roots year-round improve soil health more than leaving fields fallow?',
        choices: ['Living roots prevent all weeds from germinating', 'Root exudates feed soil microbes, maintaining biological activity and nutrient cycling', 'Roots physically prevent wind from reaching the soil surface', 'Living roots eliminate the need for any fertilizer inputs'],
        correct: 1,
      },
      {
        text: 'Reducing soil disturbance preserves mycorrhizal fungal networks. What is the primary benefit these networks provide to plants?',
        choices: ['Nitrogen fixation from atmospheric N₂', 'Enhanced phosphorus uptake and water access beyond the root zone', 'Direct photosynthesis support through chloroplast transfer', 'Physical protection of roots from nematode attack'],
        correct: 1,
      },
      {
        text: 'Plant diversity in crop rotations reduces pest and disease pressure through which ecological mechanism?',
        choices: ['Allelopathic suppression of all organisms', 'Breaking host-specific pest and pathogen life cycles', 'Reducing soil moisture to levels unfavorable for pests', 'Increasing UV radiation reaching the soil surface'],
        correct: 1,
      },
      {
        text: 'Livestock integration through managed grazing contributes to soil health by:',
        choices: ['Compacting soil to reduce erosion', 'Stimulating plant regrowth and cycling nutrients through manure deposition', 'Eliminating all above-ground biomass for maximum sunlight penetration', 'Removing organic matter to reduce fire risk'],
        correct: 1,
      },
      {
        text: 'Which soil health principle is most directly compromised by conventional moldboard plowing?',
        choices: ['Plant diversity', 'Livestock integration', 'Minimal disturbance', 'Soil cover'],
        correct: 2,
      },
      {
        text: 'The concept of "armor on the soil" in soil health management refers to:',
        choices: ['Plastic mulch films applied before planting', 'Maintaining a layer of crop residue or cover on the soil surface to protect against raindrop impact and erosion', 'Applying lime to form a hard protective crust', 'Deep-rooted perennials forming a dense mat underground'],
        correct: 1,
      },
      {
        text: 'Which soil health principle is most directly linked to building cation exchange capacity and improving nutrient retention over time?',
        choices: ['Livestock integration', 'Minimal disturbance', 'Increasing soil organic matter through diverse plant inputs', 'Reducing irrigation frequency'],
        correct: 2,
      },
      {
        text: 'Soil health management systems aim to reduce reliance on external inputs. Which metric most directly measures progress toward this goal?',
        choices: ['Acres farmed per year', 'Fertilizer nitrogen use efficiency and pest control costs over time', 'The number of different crop varieties planted', 'Tractor hours per growing season'],
        correct: 1,
      },
      {
        text: 'In healthy, undisturbed soil, which organism type creates macropores that dramatically improve water infiltration and aeration?',
        choices: ['Nematodes', 'Protozoa', 'Earthworms', 'Rhizobia'],
        correct: 2,
      },
    ],
  },

  // ─── ROUND 2: Indigenous Farming ───
  {
    id: 'indigenous-farming',
    title: 'Indigenous Farming',
    questions: [
      {
        text: 'In the Three Sisters system, beans fix nitrogen that benefits the corn and squash. This nitrogen fixation is performed by which organisms?',
        choices: ['The bean plant cells directly', 'Rhizobium bacteria in root nodules of the bean plants', 'Mycorrhizal fungi attached to bean roots', 'Free-living cyanobacteria in the soil surface'],
        correct: 1,
      },
      {
        text: 'Aztec chinampas achieved high productivity because the raised bed design provided:',
        choices: ['Protection from all flooding events', 'Continuous nutrient supply from surrounding lake sediments and excellent drainage', 'Complete isolation from soil-borne diseases', 'Year-round frozen soil conditions'],
        correct: 1,
      },
      {
        text: 'Inca terrace farming in the Andes addressed multiple challenges simultaneously. Besides erosion control, what did terraces provide?',
        choices: ['Increased wind exposure for pest control', 'Microclimates allowing cultivation of crops at different elevations', 'Direct access to underground water tables', 'Flat land for livestock grazing exclusively'],
        correct: 1,
      },
      {
        text: 'Aboriginal Australian fire-stick farming creates a mosaic landscape. What ecological benefit does this mosaic pattern provide?',
        choices: ['Eliminates all non-native species', 'Creates diverse habitats at different stages of regrowth, supporting biodiversity', 'Sterilizes soil for disease-free planting', 'Prevents all future fire events'],
        correct: 1,
      },
      {
        text: 'The Zai pit technique from West Africa involves digging small holes and adding organic matter before planting. Why is this effective in degraded, crusted soils?',
        choices: ['It raises soil pH to optimal levels', 'It concentrates scarce water and nutrients directly at the planting site', 'It prevents all insect damage to seedlings', 'It eliminates the need for any seed selection'],
        correct: 1,
      },
      {
        text: 'Which principle shared by most indigenous farming systems is now central to modern regenerative agriculture?',
        choices: ['Maximum tillage for weed control', 'Monoculture for yield optimization', 'Polyculture and mimicking natural ecosystem diversity', 'Chemical-intensive pest management'],
        correct: 2,
      },
      {
        text: 'Milpa agriculture, practiced throughout Mesoamerica, is distinguished from simple Three Sisters gardening by:',
        choices: ['Using only one crop species per plot', 'A slash-and-burn rotation that rests land for several years to restore fertility before re-planting', 'Irrigation from constructed canal systems only', 'Exclusive cultivation of domesticated animals'],
        correct: 1,
      },
      {
        text: 'Southeast Asian floating rice cultivation in flooded paddies provides a nitrogen benefit because:',
        choices: ['Rice roots fix atmospheric nitrogen directly', 'Cyanobacteria and azolla ferns in flooded fields perform biological nitrogen fixation', 'Flood water carries dissolved synthetic nitrogen from upstream', 'Anaerobic conditions concentrate nitrogen from decomposing fish'],
        correct: 1,
      },
      {
        text: 'Dry stone walling terraces in Mediterranean farming regions primarily reduced which soil degradation process on hillside vineyards and orchards?',
        choices: ['Salinization from sea spray', 'Compaction from livestock grazing', 'Water erosion and soil loss from steep slopes', 'Frost heaving of roots in winter'],
        correct: 2,
      },
      {
        text: 'Amazonian polyculture and agroforestry systems were more ecologically stable than monocultures because they:',
        choices: ['Used only native animal species as labor', 'Concentrated all production in a single season to minimize risk', 'Mimicked the structure and diversity of natural forest layers, cycling nutrients and reducing pest pressure', 'Relied on annual river flooding as the sole nutrient source'],
        correct: 2,
      },
    ],
  },

  // ─── ROUND 3: Bulk Density & Compaction (from PDF) ───
  {
    id: 'bulk-density',
    title: 'Bulk Density & Compaction',
    questions: [
      {
        text: 'Bulk density is calculated by dividing the mass of dry soil by its:',
        choices: ['Wet weight', 'Total volume (including pore space)', 'Particle density', 'Water content'],
        correct: 1,
      },
      {
        text: 'A typical bulk density for a productive agricultural topsoil is approximately:',
        choices: ['0.5 g/cm³', '1.0–1.4 g/cm³', '2.0–2.5 g/cm³', '3.0+ g/cm³'],
        correct: 1,
      },
      {
        text: 'Soil compaction reduces pore space, which directly impairs:',
        choices: ['Soil color and appearance', 'Root penetration, water infiltration, and gas exchange', 'Soil mineral composition', 'The number of sand particles present'],
        correct: 1,
      },
      {
        text: 'Which management practice is most likely to cause subsoil compaction below the tillage zone?',
        choices: ['Cover cropping with deep-rooted species', 'Repeated heavy equipment traffic on wet soil', 'Application of composted organic matter', 'Rotational grazing with adequate rest periods'],
        correct: 1,
      },
      {
        text: 'Increasing soil organic matter typically decreases bulk density because:',
        choices: ['Organic matter is denser than mineral soil', 'Organic matter promotes aggregation, creating more pore space', 'Organic matter dissolves sand particles', 'Organic matter increases soil weight'],
        correct: 1,
      },
      {
        text: 'In the USDA soil health assessment, bulk density values above which threshold generally indicate compaction problems in loamy soils?',
        choices: ['0.8 g/cm³', '1.0 g/cm³', '1.6 g/cm³', '2.5 g/cm³'],
        correct: 2,
      },
      {
        text: 'Why is wet soil significantly more susceptible to compaction than dry soil?',
        choices: ['Wet soil has higher organic matter content', 'Water films between particles act as a lubricant, allowing particles to rearrange and pack more tightly under load', 'Dry soil is already fully compacted', 'Wet soil contains more clay, which is harder to compress'],
        correct: 1,
      },
      {
        text: 'A penetrometer measures soil resistance to a probe. Resistance above which threshold (in MPa) is commonly considered to restrict root elongation?',
        choices: ['0.5 MPa', '2.0 MPa', '5.0 MPa', '10.0 MPa'],
        correct: 1,
      },
      {
        text: 'Controlled traffic farming (CTF) reduces compaction by:',
        choices: ['Eliminating all field equipment from the farm', 'Restricting all field traffic to permanent, fixed wheel tracks, leaving the rest of the field undisturbed', 'Reducing planting density to lower equipment passes', 'Using only hand tools for soil management'],
        correct: 1,
      },
      {
        text: 'Subsoil compaction is particularly problematic because, unlike topsoil compaction:',
        choices: ['It is easily reversed by a single tillage pass', 'It does not affect crop roots', 'It can persist for decades because normal tillage equipment does not reach subsoil depths', 'It only occurs in sandy soils'],
        correct: 2,
      },
    ],
  },

  // ─── ROUND 4: Soil Texture & Structure (from PDF) ───
  {
    id: 'soil-texture-structure',
    title: 'Soil Texture & Structure',
    questions: [
      {
        text: 'Soil texture refers to the relative proportions of three particle sizes. What are they?',
        choices: ['Gravel, pebbles, and boulders', 'Sand, silt, and clay', 'Organic matter, minerals, and water', 'Calcium, iron, and aluminum'],
        correct: 1,
      },
      {
        text: 'The "ribbon test" performed in the field estimates soil texture by:',
        choices: ['Measuring how far a moistened soil sample can be squeezed into a ribbon', 'Observing the color of a soil sample under UV light', 'Timing how quickly water drains through a sample', 'Weighing a sample before and after drying'],
        correct: 0,
      },
      {
        text: 'Soil structure refers to how individual particles group together into aggregates. Which structure type indicates the healthiest topsoil?',
        choices: ['Massive (no visible structure)', 'Platy (flat, horizontal plates)', 'Granular (small, rounded aggregates)', 'Columnar (tall, vertical columns)'],
        correct: 2,
      },
      {
        text: 'Sandy soils drain quickly but have poor nutrient-holding capacity. This is because sand particles have:',
        choices: ['Very high surface area relative to volume', 'Very low surface area relative to volume, reducing cation exchange sites', 'Too many negative charges attracting water', 'A crystalline structure that binds all nutrients permanently'],
        correct: 1,
      },
      {
        text: 'Which soil texture class, found at the center of the textural triangle, has roughly equal influence of sand, silt, and clay properties?',
        choices: ['Sandy clay', 'Silt loam', 'Loam', 'Clay loam'],
        correct: 2,
      },
      {
        text: 'Soil aggregates are held together primarily by:',
        choices: ['Gravity and soil weight', 'Organic matter, fungal hyphae, root exudates, and microbial products', 'Chemical bonds between sand grains', 'Water tension exclusively'],
        correct: 1,
      },
      {
        text: 'Silt particles are intermediate in size between sand and clay. What property makes silt-dominated soils highly susceptible to surface crusting?',
        choices: ['Silt particles are too large to form aggregates and collapse under raindrop impact', 'Silt has very high organic matter content that seals the surface', 'Silt carries a strong positive charge that repels water', 'Silt particles are magnetically attracted to each other and form an impermeable layer'],
        correct: 0,
      },
      {
        text: 'Prismatic soil structure is most commonly found in subsoil horizons. What does this structure indicate about water and root movement?',
        choices: ['Excellent lateral and vertical movement due to abundant pore space', 'Limited lateral movement — water and roots move primarily along the vertical faces between prisms', 'No restriction to root or water movement in any direction', 'Exclusively horizontal water movement through the profile'],
        correct: 1,
      },
      {
        text: 'The slake test evaluates soil aggregate stability. An aggregate that quickly disintegrates in water indicates:',
        choices: ['High organic matter and stable biological binding agents', 'Poor aggregate stability, suggesting low organic matter and susceptibility to erosion', 'Optimal soil moisture content for tillage', 'The presence of beneficial mycorrhizal fungi'],
        correct: 1,
      },
      {
        text: 'Soil texture is a permanent physical characteristic, while soil structure can change. Which management action most rapidly degrades soil structure?',
        choices: ['Planting a diverse cover crop mix', 'Applying composted manure', 'Tillage of wet, vulnerable soils that breaks apart aggregates formed by biological activity', 'Reducing synthetic fertilizer applications'],
        correct: 2,
      },
    ],
  },

  // ─── ROUND 5: Nitrogen Cycle Processes (from PDF) ───
  {
    id: 'nitrogen-cycle',
    title: 'Nitrogen Cycle',
    questions: [
      {
        text: 'Biological nitrogen fixation converts atmospheric N₂ into ammonia (NH₃). Which enzyme catalyzes this reaction?',
        choices: ['Urease', 'Nitrogenase', 'Nitrate reductase', 'Deaminase'],
        correct: 1,
      },
      {
        text: 'Nitrification is a two-step oxidation process. Which bacterial genera are primarily responsible for converting ammonium to nitrite?',
        choices: ['Rhizobium', 'Nitrosomonas', 'Nitrobacter', 'Clostridium'],
        correct: 1,
      },
      {
        text: 'Denitrification returns nitrogen to the atmosphere. Under what conditions does this process predominantly occur?',
        choices: ['Well-aerated, sandy soils', 'Waterlogged, anaerobic soils with available carbon', 'Frozen soils during winter', 'Extremely acidic conditions (pH < 3)'],
        correct: 1,
      },
      {
        text: 'Why is nitrate (NO₃⁻) more prone to leaching than ammonium (NH₄⁺)?',
        choices: ['Nitrate is a gas that escapes the soil', 'Nitrate carries a negative charge and is repelled by negatively charged soil particles', 'Ammonium is heavier and sinks deeper', 'Nitrate is consumed by all plants instantly'],
        correct: 1,
      },
      {
        text: 'Volatilization of ammonia (NH₃) is a significant nitrogen loss pathway when:',
        choices: ['Urea fertilizer is incorporated deep into moist soil', 'Urea is surface-applied on warm, high-pH soils without rain or incorporation', 'Anhydrous ammonia is injected below the surface', 'Manure is composted before application'],
        correct: 1,
      },
      {
        text: 'Cover crops reduce nitrogen leaching primarily by:',
        choices: ['Releasing nitrogen into the atmosphere through their leaves', 'Absorbing residual soil nitrate into plant biomass during the off-season', 'Increasing denitrification rates in the root zone', 'Physically blocking water movement through the soil profile'],
        correct: 1,
      },
      {
        text: 'Mineralization converts organic nitrogen to ammonium. Which factor most accelerates this process?',
        choices: ['Low soil temperature and high moisture', 'Warm soil temperatures, adequate moisture, and diverse microbial communities', 'High soil pH above 8.5', 'Absence of oxygen in the soil'],
        correct: 1,
      },
      {
        text: 'The C:N ratio of organic residues influences whether nitrogen is mineralized or immobilized. Residues with a C:N ratio above approximately 25:1 tend to:',
        choices: ['Release nitrogen immediately, boosting crop growth', 'Cause immobilization, with microbes consuming inorganic nitrogen from the soil to decompose the residue', 'Have no effect on soil nitrogen levels', 'Increase denitrification rates regardless of conditions'],
        correct: 1,
      },
      {
        text: 'Nitrous oxide (N₂O) is an important greenhouse gas. Which soil nitrogen process is the primary source of agricultural N₂O emissions?',
        choices: ['Nitrogen fixation by legumes', 'Nitrification and denitrification occurring simultaneously in microsites with variable oxygen', 'Ammonia volatilization from urea', 'Plant uptake of nitrate from the soil solution'],
        correct: 1,
      },
      {
        text: 'Which soil management practice most directly reduces the risk of nitrate leaching to groundwater?',
        choices: ['Moldboard plowing in fall to prepare a seedbed', 'Split nitrogen applications timed to match crop demand throughout the growing season', 'Applying all fertilizer nitrogen in a single pre-season pass', 'Increasing soil compaction to slow water movement'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 6: Conservation Practices ───
  {
    id: 'conservation-practices',
    title: 'Conservation Practices',
    questions: [
      {
        text: 'No-till farming preserves soil structure by eliminating moldboard plowing. What biological benefit does this provide?',
        choices: ['It eliminates all soil-dwelling insects', 'It preserves mycorrhizal fungal networks and earthworm habitat', 'It increases soil temperature for faster decomposition', 'It prevents all weed seed germination'],
        correct: 1,
      },
      {
        text: 'Contour farming reduces water erosion by:',
        choices: ['Channeling water downhill more efficiently', 'Creating ridges perpendicular to the slope that slow water flow and increase infiltration', 'Removing all vegetation from the slope', 'Compacting soil along the contour lines'],
        correct: 1,
      },
      {
        text: 'Prairie strips — narrow bands of native perennial vegetation within crop fields — have been shown to reduce sediment loss by:',
        choices: ['About 10%', 'About 30%', 'Over 90%', 'Less than 5%'],
        correct: 2,
      },
      {
        text: 'Integrated pest management (IPM) in conservation agriculture uses a hierarchy of controls. What is the first line of defense?',
        choices: ['Broad-spectrum pesticide application', 'Cultural practices like crop rotation, resistant varieties, and habitat management', 'Releasing predatory insects in large quantities', 'Genetic modification of all crop species'],
        correct: 1,
      },
      {
        text: 'Riparian buffer zones along waterways protect water quality by:',
        choices: ['Increasing stream flow velocity', 'Filtering sediment, absorbing excess nutrients, and stabilizing stream banks with root systems', 'Channeling agricultural runoff directly into the stream', 'Removing all vegetation to reduce water consumption'],
        correct: 1,
      },
      {
        text: 'Managed rotational grazing improves pasture soil health compared to continuous grazing because:',
        choices: ['Livestock compact the soil more evenly', 'Rest periods allow grass recovery, root regrowth, and soil biology restoration', 'Animals eat only the weeds during rotation', 'Manure distribution is concentrated in fewer areas'],
        correct: 1,
      },
      {
        text: 'Drainage water management (DWM) uses control structures on tile drainage systems to:',
        choices: ['Eliminate all tile drainage from a field permanently', 'Raise the water table during the growing season to increase crop-accessible moisture and reduce nutrient loss', 'Accelerate drainage after heavy rain events only', 'Pump water from deeper aquifers to irrigate crops'],
        correct: 1,
      },
      {
        text: 'Bioreactors placed at tile drainage outlets use woodchip media to remove nitrate from drainage water through which process?',
        choices: ['Physical filtration blocking nitrate ions', 'Denitrification by microbes in the anoxic woodchip bed converting nitrate to nitrogen gas', 'Adsorption of nitrate onto woodchip cellulose', 'Precipitation of nitrate as a solid mineral compound'],
        correct: 1,
      },
      {
        text: 'Saturated buffers direct tile water through the soil profile of a vegetated buffer. The primary benefit over a conventional tile outlet is:',
        choices: ['Faster drainage to waterways', 'Denitrification and plant uptake remove nitrate as tile water moves through the buffer soil', 'Prevention of all phosphorus loss from the field', 'Elimination of the need for riparian vegetation'],
        correct: 1,
      },
      {
        text: 'Wetland restoration on agricultural land provides multiple ecosystem services. Which benefit is most relevant to downstream water quality?',
        choices: ['Wetlands release stored sediment into streams during flood events', 'Wetlands intercept and process nutrient-laden runoff through biological uptake, sedimentation, and denitrification', 'Wetlands increase stream flow velocity to dilute pollutants', 'Wetlands attract wildlife that consumes excess algae in waterways'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 7: Soil pH & Management (from PDF) ───
  {
    id: 'soil-ph',
    title: 'Soil pH & Management',
    questions: [
      {
        text: 'Soil pH is a measure of hydrogen ion concentration. A pH of 5 is how many times more acidic than a pH of 7?',
        choices: ['2 times', '10 times', '100 times', '1000 times'],
        correct: 2,
      },
      {
        text: 'Most nutrient availability for crops is optimal in the pH range of:',
        choices: ['4.0–5.0', '6.0–7.5', '8.5–9.5', '3.0–4.0'],
        correct: 1,
      },
      {
        text: 'At very low soil pH (below 5.0), which element becomes soluble at potentially toxic levels to many crops?',
        choices: ['Calcium', 'Magnesium', 'Aluminum', 'Potassium'],
        correct: 2,
      },
      {
        text: 'Agricultural lime (CaCO₃) raises soil pH by:',
        choices: ['Adding hydrogen ions to the soil', 'Neutralizing hydrogen ions and releasing calcium and carbonate', 'Coating soil particles with an alkaline film', 'Killing acid-producing bacteria'],
        correct: 1,
      },
      {
        text: 'Which nitrogen fertilizer source has the greatest potential to acidify soil over time?',
        choices: ['Calcium nitrate', 'Anhydrous ammonia', 'Urea', 'Ammonium sulfate'],
        correct: 3,
      },
      {
        text: 'In western South Dakota, soils tend to be more alkaline (pH > 7.5) due to:',
        choices: ['High rainfall leaching bases from the soil', 'Low rainfall and accumulation of calcium carbonate from calcareous parent material', 'Volcanic ash deposits', 'Intensive irrigation with acidic water'],
        correct: 1,
      },
      {
        text: 'Soil acidification in intensively cropped fields is commonly caused by which combination of factors?',
        choices: ['High rainfall leaching calcium and magnesium, and H⁺ ions released during nitrification of ammonium-based fertilizers', 'Excessive lime application over many years', 'Planting deep-rooted cover crops that release alkaline compounds', 'Reduced irrigation frequency in arid climates'],
        correct: 0,
      },
      {
        text: 'Sulfur is sometimes applied to reduce soil pH for crops like blueberries. How does elemental sulfur lower pH?',
        choices: ['It directly dissolves carbonate minerals in the soil', 'Soil bacteria oxidize elemental sulfur to sulfuric acid, releasing H⁺ ions', 'It physically displaces calcium from exchange sites', 'Sulfur absorbs water from the soil, concentrating acids already present'],
        correct: 1,
      },
      {
        text: 'Buffer pH is used by soil labs in addition to water pH. Why is buffer pH useful for lime recommendations?',
        choices: ['It is easier to measure than water pH', 'Buffer pH reflects the soil\'s capacity to resist pH change — soils with high buffering capacity require more lime to raise pH', 'Buffer pH measures salinity, not acidity', 'Buffer pH is identical to water pH in all soil types'],
        correct: 1,
      },
      {
        text: 'Iron and manganese become more soluble at low pH. For most crops, excess soluble manganese causes:',
        choices: ['Improved photosynthesis efficiency', 'Toxicity symptoms including leaf spots, interveinal chlorosis, and stunted growth', 'Enhanced nitrogen fixation in legumes', 'Increased root branching and depth'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 8: Phosphorus Management (from PDF) ───
  {
    id: 'phosphorus',
    title: 'Phosphorus Management',
    questions: [
      {
        text: 'Phosphorus is essential for plants primarily because it is a key component of:',
        choices: ['Chlorophyll molecules', 'ATP (energy currency), DNA, and cell membranes', 'Cellulose cell walls', 'Stomatal guard cells'],
        correct: 1,
      },
      {
        text: 'Unlike nitrogen, phosphorus does not have a significant atmospheric cycle. Why?',
        choices: ['Phosphorus is too heavy to become airborne', 'Phosphorus does not form stable gaseous compounds under normal conditions', 'Bacteria cannot metabolize phosphorus', 'Phosphorus is only found in volcanic rock'],
        correct: 1,
      },
      {
        text: 'Phosphorus availability in soil is most limited at which pH extremes?',
        choices: ['Only at very low pH (acidic)', 'Only at very high pH (alkaline)', 'At both very low and very high pH, with optimal availability around pH 6.0–7.5', 'pH has no effect on phosphorus availability'],
        correct: 2,
      },
      {
        text: 'Phosphorus loss from agricultural fields to waterways primarily occurs through:',
        choices: ['Volatilization into the atmosphere', 'Surface runoff carrying sediment-bound phosphorus and dissolved phosphorus', 'Deep leaching to groundwater in most soils', 'Plant transpiration releasing phosphorus as gas'],
        correct: 1,
      },
      {
        text: 'Why do mycorrhizal fungi play a critical role in phosphorus nutrition for most plants?',
        choices: ['They manufacture phosphorus from nitrogen', 'Their hyphae extend far beyond the root zone, accessing phosphorus the roots cannot reach', 'They break down rocks to release phosphorus directly', 'They store phosphorus in the atmosphere for later plant use'],
        correct: 1,
      },
      {
        text: 'Excess phosphorus in waterways leads to eutrophication. What is the primary harmful effect?',
        choices: ['Water becomes too clear for fish', 'Algal blooms deplete dissolved oxygen, causing fish kills and dead zones', 'Phosphorus crystallizes and blocks stream flow', 'Water pH drops to lethal levels immediately'],
        correct: 1,
      },
      {
        text: 'Phosphorus "fixation" in acidic soils occurs primarily because phosphate ions react with:',
        choices: ['Calcium carbonate, forming insoluble precipitates', 'Iron and aluminum oxides on soil particle surfaces, forming insoluble compounds', 'Organic matter, permanently binding phosphorus in humus', 'Potassium ions, forming potassium phosphate crystals'],
        correct: 1,
      },
      {
        text: 'In alkaline soils, phosphorus availability decreases because phosphate reacts with:',
        choices: ['Organic matter and is immobilized by microbes', 'Calcium to form sparingly soluble calcium phosphate compounds', 'Potassium and sodium to form soluble but toxic salts', 'Clay minerals and is locked into the crystal lattice permanently'],
        correct: 1,
      },
      {
        text: 'The 4R Nutrient Stewardship framework for phosphorus management stands for the right source, right rate, right time, and:',
        choices: ['Right rotation', 'Right place', 'Right rainfall', 'Right residue management'],
        correct: 1,
      },
      {
        text: 'Stratification of phosphorus at the soil surface is a common challenge in no-till systems because:',
        choices: ['Surface phosphorus is immediately lost to volatilization in warm weather', 'Crops can only access phosphorus concentrated at the surface during early growth, leaving subsoil deficient and increasing runoff risk', 'Surface phosphorus prevents earthworms from surfacing after rain', 'Phosphorus in the topsoil inhibits mycorrhizal fungal development'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 9: Soil Art & Culture ───
  {
    id: 'soil-art-culture',
    title: 'Soil Art & Culture',
    questions: [
      {
        text: 'Bògòlanfini (mudcloth) uses fermented mud containing iron compounds. The permanence of the dye relies on:',
        choices: ['Simple staining that washes out over time', 'Chemical bonding between iron in the mud and plant tannins pre-applied to the cloth', 'Heat-setting the mud in a kiln', 'UV exposure activating mineral pigments'],
        correct: 1,
      },
      {
        text: 'Terra preta ("dark earth") in the Amazon is an ancient soil modification. What makes it remarkably fertile compared to surrounding oxisols?',
        choices: ['It contains volcanic minerals from eruptions', 'High charcoal (biochar) content, bone fragments, and concentrated organic waste added by indigenous peoples', 'Natural river flooding deposited unique clay minerals', 'European colonists imported fertile topsoil'],
        correct: 1,
      },
      {
        text: 'Japanese Dorodango — the art of polishing mud balls — demonstrates which property of fine clay particles?',
        choices: ['Magnetic attraction between particles', 'The ability of clay to compact and polish to a glossy finish under repeated pressure', 'Clay particles naturally repel each other when dry', 'Clay produces a chemical reaction with human skin oils'],
        correct: 1,
      },
      {
        text: 'Rammed earth construction, used for sections of the Great Wall of China, creates strong walls by:',
        choices: ['Mixing soil with cement', 'Compressing moist soil with high clay content into forms, layer by layer', 'Firing bricks made from soil at high temperatures', 'Stacking dried mud bricks with mortar'],
        correct: 1,
      },
      {
        text: 'Ochre pigments have been used in art for over 40,000 years. The range of colors (yellow, red, brown) comes from different:',
        choices: ['Plant species mixed with the clay', 'Oxidation states of iron minerals (goethite, hematite, limonite)', 'Carbon content in the pigment', 'Bacterial communities living in the clay'],
        correct: 1,
      },
      {
        text: 'Adobe construction in the American Southwest uses sun-dried bricks made from clay soil mixed with straw. The straw serves as:',
        choices: ['Decoration only', 'Tensile reinforcement that prevents cracking as the brick dries and shrinks', 'A food source for beneficial bacteria in the wall', 'Waterproofing material'],
        correct: 1,
      },
      {
        text: 'Geosmin, a compound produced by Streptomyces bacteria in soil, is responsible for which well-known sensory experience?',
        choices: ['The visual dark color of rich prairie soils', 'The earthy smell of rain on dry soil, celebrated in literature, poetry, and fragrance globally', 'The red color of iron-rich tropical soils', 'The gritty texture of sandy soils used in pottery'],
        correct: 1,
      },
      {
        text: 'Traditional Korean onggi pottery relies on specific local clays. The porous microstructure of onggi vessels is intentional because:',
        choices: ['It makes the pottery lighter for transport', 'Micro-pores allow controlled gas exchange that ferments foods like kimchi while preventing spoilage organisms from entering', 'It creates a decorative crackled glaze effect', 'Porous walls allow water to seep out and cool stored beverages'],
        correct: 1,
      },
      {
        text: 'Ancient Egyptian kohl eyeliner, made partly from lead-based minerals and galena, is an example of:',
        choices: ['Purely cosmetic use of soil minerals with no functional benefit', 'Cultural use of soil-derived minerals where modern research suggests it may have had antibacterial properties despite lead toxicity', 'Volcanic ash applied to prevent sun damage', 'Clay-based pigment sourced exclusively from the Nile floodplain'],
        correct: 1,
      },
      {
        text: 'The Nazca Lines in Peru, some of the world\'s largest geoglyphs, were created by:',
        choices: ['Carving deep trenches into bedrock', 'Removing the reddish-brown surface layer to expose the lighter-colored soil beneath', 'Piling soil into raised mound formations visible from the air', 'Using plant pigments to paint large areas of desert pavement'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 10: Agronomy Careers ───
  {
    id: 'agronomy-careers',
    title: 'Agronomy Careers',
    questions: [
      {
        text: 'A Certified Crop Advisor (CCA) provides recommendations on crop management, nutrient planning, and pest control. What is their primary goal?',
        choices: ['Maximizing chemical inputs for highest yield', 'Optimizing crop production while promoting sustainable stewardship of natural resources', 'Selling the most expensive seed varieties', 'Replacing farmers with automated systems'],
        correct: 1,
      },
      {
        text: 'A soil scientist working for NRCS (Natural Resources Conservation Service) primarily:',
        choices: ['Sells fertilizer products to farmers', 'Maps soils, assesses land capability, and provides conservation planning assistance', 'Operates commercial farms for government research', 'Regulates international soil trade agreements'],
        correct: 1,
      },
      {
        text: 'Plant breeders in agronomy work to develop crop varieties with improved traits. What modern tool has accelerated this field?',
        choices: ['Mechanical harvesting equipment', 'Genomic selection and marker-assisted breeding', 'Social media marketing platforms', 'Satellite-based weather forecasting exclusively'],
        correct: 1,
      },
      {
        text: 'An environmental engineer in agriculture might design systems for:',
        choices: ['Only building farm structures', 'Managing water quality, waste treatment, and erosion control infrastructure', 'Trading agricultural commodities on financial markets', 'Forecasting crop prices'],
        correct: 1,
      },
      {
        text: 'A precision agriculture specialist uses technology to optimize farming inputs. Which tools are central to this career?',
        choices: ['Only hand tools and visual observation', 'GPS, remote sensing, variable-rate application equipment, and data analytics', 'Traditional almanac-based planting calendars', 'Laboratory-only soil analysis with no field work'],
        correct: 1,
      },
      {
        text: 'A climatologist studying agriculture focuses on how climate variability and change affects crop production. Their work informs:',
        choices: ['Only historical record-keeping with no practical application', 'Planting date recommendations, crop insurance programs, and adaptation strategies', 'Marketing campaigns for seed companies', 'International diplomatic negotiations exclusively'],
        correct: 1,
      },
      {
        text: 'A forest soil scientist differs from a traditional agronomist primarily in that they focus on:',
        choices: ['Maximizing short-term crop yields through synthetic inputs', 'Analyzing how soil properties support long-term forest ecosystem function, timber productivity, and watershed health', 'Designing irrigation systems for row crops only', 'Marketing timber products to international buyers'],
        correct: 1,
      },
      {
        text: 'A seed analyst\'s core responsibilities include evaluating seed lots for:',
        choices: ['Market price fluctuations and commodity trading', 'Purity, germination rate, viability, and freedom from weed seed or disease contamination', 'Genetic modification status and patent compliance', 'Soil compatibility and nutrient content of seeds'],
        correct: 1,
      },
      {
        text: 'What distinguishes modern farm management from traditional approaches?',
        choices: ['Modern farm managers ignore soil data in favor of market data', 'Integration of precision agriculture tools, data analytics, and long-term stewardship planning alongside production goals', 'Modern farm managers outsource all agronomic decisions to chemical company representatives', 'Traditional and modern farm management are identical in practice'],
        correct: 1,
      },
      {
        text: 'A biological engineer working in agriculture might design:',
        choices: ['Financial models for commodity futures markets', 'Systems such as constructed wetlands, anaerobic digesters, or composting facilities that use biological processes to manage waste', 'Social media campaigns for agricultural advocacy groups', 'Satellite tracking systems for farm equipment only'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 11: Electrical Conductivity (from PDF) ───
  {
    id: 'electrical-conductivity',
    title: 'Electrical Conductivity',
    questions: [
      {
        text: 'Soil electrical conductivity (EC) is a proxy measurement for:',
        choices: ['Soil organic matter content', 'Soluble salt concentration in the soil solution', 'Soil temperature at root depth', 'The number of earthworms present'],
        correct: 1,
      },
      {
        text: 'An EC reading above 4 dS/m generally classifies a soil as:',
        choices: ['Non-saline', 'Slightly saline', 'Saline, causing yield reduction in sensitive crops', 'Optimal for all crop growth'],
        correct: 2,
      },
      {
        text: 'Sodium-affected (sodic) soils have high exchangeable sodium percentage. This causes:',
        choices: ['Improved water infiltration', 'Dispersion of clay particles, poor structure, surface crusting, and reduced infiltration', 'Increased organic matter decomposition', 'Enhanced root growth in all crops'],
        correct: 1,
      },
      {
        text: 'In irrigated agriculture, what is the primary management practice to prevent salt buildup?',
        choices: ['Reducing irrigation to absolute minimum', 'Applying enough water to leach salts below the root zone (leaching fraction)', 'Adding more salt-based fertilizers', 'Increasing soil compaction to slow water movement'],
        correct: 1,
      },
      {
        text: 'Electromagnetic induction (EMI) sensors measure soil EC across a field. This data is useful for:',
        choices: ['Predicting exact crop yields per plant', 'Mapping spatial variability in soil salinity, texture, and moisture for precision management', 'Determining the exact species of soil bacteria present', 'Measuring atmospheric CO₂ concentrations'],
        correct: 1,
      },
      {
        text: 'Gypsum (CaSO₄) is applied to sodic soils to:',
        choices: ['Increase soil sodium levels', 'Displace sodium from exchange sites with calcium, improving soil structure', 'Raise soil pH above 9.0', 'Add nitrogen for crop growth'],
        correct: 1,
      },
      {
        text: 'Soil salinity primarily damages crops by:',
        choices: ['Directly poisoning plant cells with sodium ions only', 'Creating osmotic stress that reduces water uptake even when soil appears moist — plants experience "physiological drought"', 'Blocking sunlight absorption in leaves', 'Destroying mycorrhizal fungi exclusively, with no direct plant effects'],
        correct: 1,
      },
      {
        text: 'The sodium adsorption ratio (SAR) is calculated from sodium, calcium, and magnesium concentrations. A high SAR combined with low EC indicates:',
        choices: ['An ideal growing environment for salt-tolerant crops', 'A sodic soil condition where sodium damages structure without excessive total salt concentration', 'Soil that requires no management intervention', 'Very high organic matter content'],
        correct: 1,
      },
      {
        text: 'Which crop category generally shows the greatest sensitivity to soil salinity?',
        choices: ['Salt marsh grasses and halophytes', 'Vegetables and strawberries, which show yield loss at EC above 1-2 dS/m', 'Cotton and barley, which tolerate EC above 7 dS/m', 'Wheat and sugar beets, which are highly salt-tolerant'],
        correct: 1,
      },
      {
        text: 'In precision agriculture, apparent soil EC (ECa) measurements are useful for delineating management zones because ECa correlates with:',
        choices: ['Crop yield only, with no relationship to soil properties', 'Multiple soil properties simultaneously including texture, organic matter, moisture, and salinity', 'Atmospheric humidity and temperature above the field', 'The depth of the water table measured from the surface'],
        correct: 1,
      },
    ],
  },

  // ─── ROUND 12: Soil Infiltration & Water (from PDF) ───
  {
    id: 'soil-infiltration',
    title: 'Soil Infiltration & Water',
    questions: [
      {
        text: 'Soil infiltration rate measures how quickly water enters the soil surface. Which soil property has the greatest influence?',
        choices: ['Soil color', 'Soil structure, texture, and surface conditions', 'Soil depth to bedrock only', 'The type of crops previously grown'],
        correct: 1,
      },
      {
        text: 'A simple field test for infiltration involves timing how long it takes for a known volume of water to drain into the soil. This is called:',
        choices: ['The ribbon test', 'A single-ring infiltrometer test', 'A slake test', 'A Proctor compaction test'],
        correct: 1,
      },
      {
        text: 'Soil with good aggregation and high organic matter typically has higher infiltration rates because:',
        choices: ['Organic matter repels water', 'Well-aggregated soil has more macropores that allow rapid water entry', 'Organic matter makes soil hydrophobic', 'Aggregation eliminates all micropores'],
        correct: 1,
      },
      {
        text: 'When infiltration rate is lower than rainfall intensity, the excess water becomes:',
        choices: ['Absorbed by plant leaves', 'Surface runoff, which can cause erosion and carry pollutants to waterways', 'Stored in the atmosphere', 'Permanently lost from the water cycle'],
        correct: 1,
      },
      {
        text: 'No-till farming generally improves infiltration compared to conventional tillage because:',
        choices: ['It compacts the surface layer', 'Surface residue protects against raindrop impact and biological pores (worm channels) remain intact', 'It removes all organic matter from the surface', 'It increases surface sealing from rain'],
        correct: 1,
      },
      {
        text: 'The USDA soil health assessment uses infiltration rate as an indicator. Faster infiltration generally indicates:',
        choices: ['Degraded, compacted soil', 'Healthy soil with good structure, biological activity, and organic matter', 'Excessive salinity problems', 'Soil that is too sandy for agriculture'],
        correct: 1,
      },
      {
        text: 'Hydrophobic (water-repellent) soils resist infiltration even when dry. This condition is most commonly caused by:',
        choices: ['High clay content that forms an impermeable surface', 'Organic compounds from decomposing plant residues or fungal activity coating soil particles', 'Excessive lime application raising pH above 9', 'Compaction from heavy equipment at depth'],
        correct: 1,
      },
      {
        text: 'An aggregate that holds together in water for over 10 minutes during a slake test indicates:',
        choices: ['High salinity and sodium saturation', 'Strong biological binding agents and good organic matter, associated with stable infiltration capacity', 'Very high sand content with no fine particles', 'Soil that has been recently tilled and compacted'],
        correct: 1,
      },
      {
        text: 'Preferential flow through macropores can be both beneficial and problematic because:',
        choices: ['It always increases drought resilience by recharging deep aquifers quickly', 'While it increases infiltration and reduces runoff, it can bypass the topsoil\'s filtering capacity and transport pollutants to groundwater', 'Macropore flow is only observed in sandy soils with no clay', 'It eliminates surface runoff completely in all soil types'],
        correct: 1,
      },
      {
        text: 'Soil water potential describes water availability to plants. When soil water potential drops below approximately -1.5 MPa, most crops experience:',
        choices: ['Optimal water uptake and maximum photosynthesis', 'The permanent wilting point — soil moisture is too tightly held by soil particles for roots to extract', 'Waterlogging that limits gas exchange', 'Enhanced nutrient uptake due to concentrated soil solution'],
        correct: 1,
      },
    ],
  },
]

export const ROUND_TIME = 60 // seconds per round in topic mode

export { PLAYER_COLORS } from './shared.js'

export const INSTRUCTIONS = {
  intro: 'Test your soil science knowledge across 12 rounds of up to 10 questions each. Answer quickly for bonus points!',
  topicMode: 'Answer questions in each round. You have 60 seconds per round.',
  endlessMode: 'Random questions from all categories. 60 seconds per player.',
  completion: 'Outstanding! You\'ve demonstrated expert-level knowledge across all soil science categories.',
}

export const RULES = [
  'Choose Topic Mode (12 rounds, 60s each) or Endless Shuffle (random, no time limit per round).',
  'Each question is multiple choice with 4 options.',
  'Base score: 100 points per correct answer.',
  'Speed bonus: +50 pts if answered in under 5 seconds, +25 pts if under 10 seconds.',
  'In multiplayer, turns rotate after each question.',
  'Topic Mode ends after 12 rounds. Endless Shuffle continues until you quit.',
  'Highest score at the end wins!',
]

export const IMPACT_MESSAGES = {
  'soil-health-principles': 'Farms implementing all five soil health principles report improved yields, reduced input costs, and increased resilience to drought within 3-5 years.',
  'conservation-practices': 'Prairie strips occupying just 10% of a field\'s area can reduce sediment loss by 95% and total phosphorus loss by 90%.',
  'nitrogen-cycle': 'Proper nitrogen management through cover crops and precision application can reduce nitrate leaching to groundwater by 40-70%.',
  'soil-infiltration': 'Healthy soils can absorb over 1 inch of rainfall per hour. Degraded soils may absorb less than 0.1 inches, turning rain into destructive runoff.',
  'bulk-density': 'Reducing soil compaction through controlled traffic and cover cropping can increase water storage by thousands of gallons per acre.',
  'phosphorus': 'Agricultural phosphorus runoff is the leading cause of freshwater eutrophication. Conservation buffers can capture over 50% of phosphorus in runoff.',
}
