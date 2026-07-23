import { ChecklistTemplate, VehicleCategory } from "./types";

// Shared helper to generate base road vehicle checklist sections
const getBaseRoadSections = () => [
  {
    title: "A. Exterior - Left & Right Paired Checks",
    items: [
      { id: "ext_windscreen", label: "Windscreen: no chips or cracks, wipers working", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_headlamp_l", label: "Headlamp - Left Front", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_headlamp_r", label: "Headlamp - Right Front", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_indicator_lf", label: "Indicator - Left Front", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_indicator_rf", label: "Indicator - Right Front", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_taillight_l", label: "Tail Light - Left Rear", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_taillight_r", label: "Tail Light - Right Rear", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_indicator_lr", label: "Indicator - Left Rear", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_indicator_rr", label: "Indicator - Right Rear", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_reverse_l", label: "Reverse Light - Left", is_safety_critical: false, expected_type: "yn" as const },
      { id: "ext_reverse_r", label: "Reverse Light - Right", is_safety_critical: false, expected_type: "yn" as const },
      { id: "ext_brake_l", label: "Brake Light - Left Rear", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_brake_r", label: "Brake Light - Right Rear", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_number_plate_light", label: "Number Plate Light", is_safety_critical: false, expected_type: "yn" as const },
      { id: "ext_reflectors", label: "Lenses & Reflectors Intact", is_safety_critical: false, expected_type: "yn" as const },
      { id: "ext_mirror_l", label: "Side Mirror - Left (undamaged & adjusted)", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_mirror_r", label: "Side Mirror - Right (undamaged & adjusted)", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_door_fl", label: "Door - Front Left (closes & locks securely)", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_door_fr", label: "Door - Front Right (closes & locks securely)", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_tyre_fl", label: "Steering Tyre FL - Tread depth (min 4/32\" / 3.2mm), sidewalls, torque", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_tyre_fr", label: "Steering Tyre FR - Tread depth (min 4/32\" / 3.2mm), sidewalls, torque", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_tyre_rl", label: "Rear Tyre RL - Tread depth (min 2/32\" / 1.6mm), sidewalls, torque", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_tyre_rr", label: "Rear Tyre RR - Tread depth (min 2/32\" / 1.6mm), sidewalls, torque", is_safety_critical: true, expected_type: "yn" as const },
      { id: "ext_body_sec", label: "Bumper, bonnet, plates & fuel cap secure", is_safety_critical: false, expected_type: "yn" as const },
    ]
  },
  {
    title: "B. Engine Compartment Fluids & Battery",
    items: [
      { id: "eng_oil", label: "Engine oil level correct", is_safety_critical: true, expected_type: "yn" as const },
      { id: "eng_coolant", label: "Radiator coolant / water level sufficient", is_safety_critical: true, expected_type: "yn" as const },
      { id: "eng_brake_fluid", label: "Brake fluid level sufficient", is_safety_critical: true, expected_type: "yn" as const },
      { id: "eng_battery", label: "Battery cables secure & clean, no corrosion", is_safety_critical: false, expected_type: "yn" as const },
      { id: "eng_belt", label: "Fan belt condition & tension", is_safety_critical: false, expected_type: "yn" as const },
    ]
  },
  {
    title: "C. Cabin & Interior Checks",
    items: [
      { id: "cab_seatbelts", label: "Seatbelts (driver & passenger) functional", is_safety_critical: true, expected_type: "yn" as const },
      { id: "cab_brake", label: "Parking brake holds / releases cleanly", is_safety_critical: true, expected_type: "yn" as const },
      { id: "cab_horn", label: "Horn working", is_safety_critical: true, expected_type: "yn" as const },
      { id: "cab_mirrors", label: "Rearview mirrors adjusted", is_safety_critical: false, expected_type: "yn" as const },
      { id: "cab_loose_items", label: "No loose items inside cab floor/dash", is_safety_critical: false, expected_type: "yn" as const },
    ]
  },
  {
    title: "D. Emergency Boot Equipment",
    items: [
      { id: "boot_triangle", label: "Emergency warning triangle present", is_safety_critical: true, expected_type: "yn" as const },
      { id: "boot_spare_wheel", label: "Spare wheel, jack & spanner serviceable", is_safety_critical: false, expected_type: "yn" as const },
    ]
  },
  {
    title: "E. Documentation",
    items: [
      { id: "doc_licence_disc", label: "Vehicle licence disc displayed and in date", is_safety_critical: true, expected_type: "yn" as const },
    ]
  }
];

export const checklistTemplates: Record<string, ChecklistTemplate> = {
  // 1. Motorcycle
  motorcycle_code_a: {
    category: "motorcycle_code_a",
    version: 1,
    type: "pre_use",
    sections: [
      {
        title: "Exterior & Controls",
        items: [
          { id: "mc_chain", label: "Drive chain: tension and lubrication", is_safety_critical: true, expected_type: "yn" },
          { id: "mc_tyres", label: "Tyres: pressure, tread, spoke integrity", is_safety_critical: true, expected_type: "yn" },
          { id: "mc_brakes", label: "Front and rear brake levers responsive", is_safety_critical: true, expected_type: "yn" },
          { id: "mc_lights", label: "Headlight, tail light and indicators functional", is_safety_critical: true, expected_type: "yn" },
          { id: "mc_helmet", label: "PPE: helmet & high-vis vest present", is_safety_critical: true, expected_type: "yn" },
        ]
      }
    ]
  },

  // 2. Code B
  light_vehicle_code_b: {
    category: "light_vehicle_code_b",
    version: 1,
    type: "pre_use",
    sections: getBaseRoadSections(),
  },

  // 3. Code EB (Bakkie + Trailer)
  light_vehicle_trailer_code_eb: {
    category: "light_vehicle_trailer_code_eb",
    version: 1,
    type: "pre_use",
    sections: [
      ...getBaseRoadSections(),
      {
        title: "F. Trailer Attachment Specifics",
        items: [
          { id: "trail_coupling", label: "Hitch coupling: locking mechanism engaged", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_safety_chain", label: "Safety breakaway cable / chain attached", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_lights_l", label: "Trailer lights - Left indicator & tail cluster", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_lights_r", label: "Trailer lights - Right indicator & tail cluster", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_tyres_l", label: "Trailer Left Tyre - tread, nuts & pressure", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_tyres_r", label: "Trailer Right Tyre - tread, nuts & pressure", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_load_secured", label: "Trailer load properly secured, tailgate locked", is_safety_critical: true, expected_type: "yn" },
        ]
      }
    ]
  },

  // 4. Code C1 (Heavy Rigid Truck <= 16T)
  heavy_vehicle_code_c1: {
    category: "heavy_vehicle_code_c1",
    version: 1,
    type: "pre_use",
    sections: [
      ...getBaseRoadSections(),
      {
        title: "F. Heavy Rigid Vehicle Specifics",
        items: [
          { id: "hv_roadworthy", label: "Roadworthy inspection (COF) current (last 12 months)", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_air_brakes", label: "Air brakes: pressure builds, no audible air leaks", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_clutch", label: "Clutch pedal adjustment & free play", is_safety_critical: false, expected_type: "yn" },
          { id: "hv_u_joints", label: "Drive line U-joints: checked for looseness", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_diff_leak", label: "Differential check: no active oil dripping", is_safety_critical: false, expected_type: "yn" },
          { id: "hv_exhaust", label: "Exhaust: no leaks under cab or turbo section", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_frame", label: "Chassis frame: no structural cracks, bed secure", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_alarm", label: "Backup travel alarm functional (min 87 dB)", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_fire_ext", label: "Emergency fire extinguisher & safety cones present", is_safety_critical: true, expected_type: "yn" },
        ]
      }
    ]
  },

  // 5. Code C (Extra Heavy Rigid Truck > 16T)
  extra_heavy_vehicle_code_c: {
    category: "extra_heavy_vehicle_code_c",
    version: 1,
    type: "pre_use",
    sections: [
      ...getBaseRoadSections(),
      {
        title: "F. Heavy Rigid Vehicle Specifics",
        items: [
          { id: "hv_roadworthy", label: "Roadworthy inspection (COF) current (last 12 months)", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_air_brakes", label: "Air brakes: pressure builds, no audible air leaks", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_clutch", label: "Clutch pedal adjustment & free play", is_safety_critical: false, expected_type: "yn" },
          { id: "hv_u_joints", label: "Drive line U-joints: checked for looseness", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_suspension_axle1", label: "Axle 1 Suspension: spring blades, shocks, airbags", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_suspension_axle2", label: "Axle 2 Suspension: spring blades, shocks, airbags", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_suspension_axle3", label: "Axle 3 Suspension: spring blades, shocks, airbags", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_diff_leak", label: "Differential check: no active oil dripping", is_safety_critical: false, expected_type: "yn" },
          { id: "hv_exhaust", label: "Exhaust: no leaks under cab or turbo section", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_frame", label: "Chassis frame: no structural cracks, bed secure", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_alarm", label: "Backup travel alarm functional (min 87 dB)", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_fire_ext", label: "Emergency fire extinguisher & safety cones present", is_safety_critical: true, expected_type: "yn" },
        ]
      }
    ]
  },

  // 6. Code EC1 (Rigid + Drawbar combination)
  heavy_combination_code_ec1: {
    category: "heavy_combination_code_ec1",
    version: 1,
    type: "pre_use",
    sections: [
      ...getBaseRoadSections(),
      {
        title: "F. Articulated Coupling & Trailer Specifics",
        items: [
          { id: "hv_roadworthy", label: "COF roadworthy certificates for all combination units", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_air_brakes", label: "Air brakes: pressure builds, no audible leaks", is_safety_critical: true, expected_type: "yn" },
          { id: "coup_hitch", label: "Coupling kingpin or drawbar hitch engaged & locked", is_safety_critical: true, expected_type: "yn" },
          { id: "coup_breakaway", label: "Trailer emergency breakaway safety cable secured", is_safety_critical: true, expected_type: "yn" },
          { id: "coup_glad_hands", label: "Glad hand air connectors sealed, no leaks", is_safety_critical: true, expected_type: "yn" },
          { id: "coup_electrics", label: "Trailer electrical coils secure, connection solid", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_tyres_axle1_l", label: "Trailer Axle 1 Tyre L: tread & nuts tight", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_tyres_axle1_r", label: "Trailer Axle 1 Tyre R: tread & nuts tight", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_tyres_axle2_l", label: "Trailer Axle 2 Tyre L: tread & nuts tight", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_tyres_axle2_r", label: "Trailer Axle 2 Tyre R: tread & nuts tight", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_lights_l", label: "Trailer Rear Left light cluster working", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_lights_r", label: "Trailer Rear Right light cluster working", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_load_sec", label: "Load secured: cargo straps & headboard locked", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_legs", label: "Trailer landing legs/dolly fully raised & locked", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_licence", label: "Trailer unit licence discs current and visible", is_safety_critical: true, expected_type: "yn" },
        ]
      }
    ]
  },

  // 7. Code EC (Extra heavy horse-and-trailer superlinks / tankers)
  extra_heavy_combination_code_ec: {
    category: "extra_heavy_combination_code_ec",
    version: 1,
    type: "pre_use",
    sections: [
      ...getBaseRoadSections(),
      {
        title: "F. Articulated Coupling & Superlink Specifics",
        items: [
          { id: "hv_roadworthy", label: "COF roadworthy certificates for tractor + link trailers", is_safety_critical: true, expected_type: "yn" },
          { id: "hv_air_brakes", label: "Air brakes: pressure builds, no audible leaks", is_safety_critical: true, expected_type: "yn" },
          { id: "coup_hitch", label: "Coupling kingpin or drawbar hitch engaged & locked", is_safety_critical: true, expected_type: "yn" },
          { id: "coup_breakaway", label: "Trailer emergency breakaway safety cable secured", is_safety_critical: true, expected_type: "yn" },
          { id: "coup_glad_hands", label: "Glad hand air connectors sealed, no leaks", is_safety_critical: true, expected_type: "yn" },
          { id: "coup_electrics", label: "Trailer electrical coils secure, connection solid", is_safety_critical: true, expected_type: "yn" },
          { id: "trail1_tyres_axle1_l", label: "Link Trailer 1 Axle 1 Tyre L: tread & nuts tight", is_safety_critical: true, expected_type: "yn" },
          { id: "trail1_tyres_axle1_r", label: "Link Trailer 1 Axle 1 Tyre R: tread & nuts tight", is_safety_critical: true, expected_type: "yn" },
          { id: "trail2_tyres_axle1_l", label: "Link Trailer 2 Axle 1 Tyre L: tread & nuts tight", is_safety_critical: true, expected_type: "yn" },
          { id: "trail2_tyres_axle1_r", label: "Link Trailer 2 Axle 1 Tyre R: tread & nuts tight", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_lights_l", label: "Link Trailers Rear Left light cluster working", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_lights_r", label: "Link Trailers Rear Right light cluster working", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_load_sec", label: "Tanker valves shut/link cargo straps secured", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_legs", label: "Trailer landing legs/dolly fully raised & locked", is_safety_critical: true, expected_type: "yn" },
          { id: "trail_licence", label: "Trailer units licence discs current and visible", is_safety_critical: true, expected_type: "yn" },
        ]
      }
    ]
  },

  // 8. Earthmoving Equipment (Dozer, Excavator, TLB, Grader)
  earthmoving_heavy_equipment: {
    category: "earthmoving_heavy_equipment",
    version: 1,
    type: "pre_use",
    sections: [
      {
        title: "Visual Walk-Around & Under-Cab (P/M/R)",
        items: [
          { id: "em_rops", label: "ROPS (Roll-Over Protection Structure) secured & approved seatbelt", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_brakes", label: "Brake assembly check: fluid, shoes & response", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_steering", label: "Steering linkages: play & joint tightness", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_exhaust", label: "Exhaust spark arrester present & clear", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_glass", label: "Sweeps, deflectors, glass panels, screens intact", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_belly_plate", label: "Belly plates & radiator guards secure & debris-free", is_safety_critical: false, expected_type: "pmr" },
          { id: "em_sprockets", label: "Sprockets/Idlers: spokes welds, tooth wear", is_safety_critical: false, expected_type: "pmr" },
          { id: "em_tracks", label: "Tracks & rollers: track tension, loose pads", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_blade", label: "Dozer blade/bucket pins, trunnion bolts & welds", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_hydraulics", label: "Hydraulic pipes, rams, cylinders holding pressure", is_safety_critical: true, expected_type: "pmr" },
        ]
      },
      {
        title: "Engine Running Checks (P/M/R)",
        items: [
          { id: "em_gauges", label: "Dashboard warning light panel, temp & oil gauges", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_travel_alarm", label: "Backup reverse alarm working (min 87 dB)", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_leaks", label: "No engine leaks (fuel system, water or differential)", is_safety_critical: true, expected_type: "pmr" },
          { id: "em_housekeeping", label: "Cab housekeeping: clean of flammables & dirt", is_safety_critical: false, expected_type: "pmr" },
        ]
      }
    ]
  },

  // 9. Mobile Elevated Work Platforms (MEWP)
  mewp_aerial_lift: {
    category: "mewp_aerial_lift",
    version: 1,
    type: "pre_use",
    sections: [
      {
        title: "Visual Walk-Around Check (Ground Level)",
        items: [
          { id: "mewp_manual", label: "Operator manual present in weather-resistant holder", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_rescue", label: "Rescue plan & site risk assessment present on hand", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_wheels", label: "Wheels: pressure, no splits/exposed braiding, rims secure", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_fluids", label: "Hydraulic levels correct, no leaking cylinders/hoses", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_outriggers", label: "Outriggers/stabilizers condition, pins & retainers secure", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_weld_cracks", label: "Chassis/boom/scissor packs: no weld cracks or misalignment", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_platform", label: "Platform: guardrails, entrance gates & harness points secure", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_decals", label: "SWL / Wind limits decal legible & inspection decal current", is_safety_critical: true, expected_type: "pmr" },
        ]
      },
      {
        title: "Function Checks (Tested from Ground & Platform)",
        items: [
          { id: "mewp_estops", label: "Emergency stop buttons & emergency lowering valves functional", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_controls", label: "Ground and platform controls move freely & auto-return", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_interlock", label: "Platform dead-man/foot switch interlocks working", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_speed_limit", label: "Elevated drive speed auto-reduction functioning", is_safety_critical: true, expected_type: "pmr" },
          { id: "mewp_lights", label: "Tilt sensors, descent alarms & beacons working", is_safety_critical: true, expected_type: "pmr" },
        ]
      }
    ]
  },

  // 10. Attachments / Support Equipment
  attachment_power_tool: {
    category: "attachment_power_tool",
    version: 1,
    type: "pre_use",
    sections: [
      {
        title: "Visual and Mechanical (Y/N)",
        items: [
          { id: "tool_guards", label: "Cutting blade guards & shields intact and secured", is_safety_critical: true, expected_type: "yn" },
          { id: "tool_teeth", label: "Cutting chain teeth: sharp, tensioned & lubricated", is_safety_critical: true, expected_type: "yn" },
          { id: "tool_pumps", label: "Pump housing seals intact, builds pressure, no leaks", is_safety_critical: true, expected_type: "yn" },
          { id: "tool_idle", label: "Engine starts, idles & shuts down cleanly with switch", is_safety_critical: true, expected_type: "yn" },
        ]
      }
    ]
  },

  // 11. General Plant (Fallback template - 10 Sections)
  general_heavy_plant: {
    category: "general_heavy_plant",
    version: 1,
    type: "pre_use",
    sections: [
      {
        title: "1. Documentation & records",
        items: [
          { id: "pl_manual", label: "Operator manual & logbook present", is_safety_critical: false, expected_type: "yn" },
          { id: "pl_cert", label: "Equipment inspection certifications current", is_safety_critical: true, expected_type: "yn" },
        ]
      },
      {
        title: "2. Visual inspection",
        items: [
          { id: "pl_leaks", label: "Walk-around complete: no structural cracks, no active fluid leaks", is_safety_critical: true, expected_type: "yn" },
          { id: "pl_covers", label: "Guards, shields & covers properly mounted and secure", is_safety_critical: true, expected_type: "yn" },
        ]
      },
      {
        title: "3. Fluid levels & lubrication",
        items: [
          { id: "pl_oil", label: "Engine oil, coolant, hydraulic and fuel levels correct", is_safety_critical: true, expected_type: "yn" },
          { id: "pl_grease", label: "Mechanical pivot joints greased", is_safety_critical: false, expected_type: "yn" },
        ]
      },
      {
        title: "4. Controls & safety devices",
        items: [
          { id: "pl_estop", label: "Emergency stop switches and warning indicators function", is_safety_critical: true, expected_type: "yn" },
        ]
      },
      {
        title: "5. Electrical & lighting",
        items: [
          { id: "pl_battery", label: "Battery connections secure, beacons working", is_safety_critical: false, expected_type: "yn" },
        ]
      },
      {
        title: "6. Hydraulic & mechanical systems",
        items: [
          { id: "pl_hoses", label: "Hydraulic hoses, cylinders and couplings show no damage", is_safety_critical: true, expected_type: "yn" },
        ]
      },
      {
        title: "7. Operator's cabin",
        items: [
          { id: "pl_cab", label: "Cabin clean, windows clear, fire extinguisher charged", is_safety_critical: true, expected_type: "yn" },
        ]
      },
      {
        title: "8. Worksite & environment",
        items: [
          { id: "pl_site", label: "Working area stable, clear of power lines, steps dry", is_safety_critical: false, expected_type: "yn" },
        ]
      },
      {
        title: "9. Test run",
        items: [
          { id: "pl_engine_run", label: "Engine runs smoothly: no abnormal noise or vibration", is_safety_critical: true, expected_type: "yn" },
        ]
      },
      {
        title: "10. Final checks",
        items: [
          { id: "pl_ppe", label: "Loose materials secured, operator equipped with correct PPE", is_safety_critical: true, expected_type: "yn" },
        ]
      }
    ]
  }
};
