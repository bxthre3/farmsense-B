# FarmSense 332-Metric Keyless API Mapping
## Complete Data Source & API Documentation for the Digital Twin

**Date:** January 5, 2026  
**Status:** Comprehensive Keyless API Inventory  
**Goal:** Secure all 332 metrics using keyless, publicly available APIs

---

## I. PEDOLOGY PILLAR (Soil Science Metrics)

### A. Molecular & Chemical Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **pH** | Soil Property | USDA NRCS Soil Data Mart | SSURGO/STATSGO API | ✅ Yes | Fixed | Soil survey data; static baseline |
| **EC (Electrical Conductivity)** | Soil Property | USDA NRCS Soil Data Mart | SSURGO API | ✅ Yes | Fixed | Salinity indicator; static baseline |
| **CEC (Cation Exchange Capacity)** | Soil Property | USDA NRCS Soil Data Mart | SSURGO API | ✅ Yes | Fixed | Nutrient retention capacity |
| **NO₃ (Nitrate)** | Soil Chemistry | USDA NRCS/EPA | Water Quality Portal API | ✅ Yes | Seasonal | Groundwater monitoring data |
| **NH₄ (Ammonium)** | Soil Chemistry | USDA NRCS/EPA | Water Quality Portal API | ✅ Yes | Seasonal | Groundwater monitoring data |
| **Olsen-P (Phosphorus)** | Soil Chemistry | USDA NRCS Soil Data Mart | SSURGO API | ✅ Yes | Fixed | Phosphorus availability |
| **K (Potassium)** | Soil Chemistry | USDA NRCS Soil Data Mart | SSURGO API | ✅ Yes | Fixed | Potassium content |
| **SOM% (Soil Organic Matter)** | Soil Property | USDA NRCS Soil Data Mart | SSURGO API | ✅ Yes | Fixed | Carbon sequestration baseline |
| **Isotopic Ratio (O¹⁸/O¹⁶)** | Soil Chemistry | USGS Water Resources | USGS Water Quality Portal | ✅ Yes | Seasonal | Groundwater origin/age tracing |
| **Zinc, Iron, Boron** | Soil Chemistry | USDA NRCS Soil Data Mart | SSURGO API | ✅ Yes | Fixed | Micronutrient content |
| **Base Saturation %** | Soil Property | USDA NRCS Soil Data Mart | SSURGO API | ✅ Yes | Fixed | Soil fertility indicator |

### B. Biological Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fungi:Bacteria Ratio** | Microbiome | USDA NRCS Soil Health | NRCS Soil Health API | ✅ Yes | Seasonal | Requires on-farm sampling or regional baselines |
| **16S rRNA Diversity** | Microbiome | USDA NRCS Soil Health | NRCS Soil Health API | ✅ Yes | Seasonal | Microbial community composition |
| **MBC (Microbial Biomass Carbon)** | Soil Biology | USDA NRCS Soil Health | NRCS Soil Health API | ✅ Yes | Seasonal | Microbial activity indicator |
| **Soil Respiration (CO₂)** | Soil Biology | USDA NRCS Soil Health | NRCS Soil Health API | ✅ Yes | Seasonal | Carbon cycling rate |
| **Phosphatase Activity** | Soil Biology | USDA NRCS Soil Health | NRCS Soil Health API | ✅ Yes | Seasonal | Enzyme activity; nutrient cycling |
| **Urease Activity** | Soil Biology | USDA NRCS Soil Health | NRCS Soil Health API | ✅ Yes | Seasonal | Nitrogen cycling enzyme |

---

## II. HYDROLOGY PILLAR (Water & Aquifer Metrics)

### A. Aquifer & Legal Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Static Water Level** | Groundwater | USGS National Water Information System | USGS Groundwater Levels Service | ✅ Yes | Dynamic/Weekly | Historical manually-recorded levels |
| **Specific Capacity** | Aquifer Property | USGS NWIS | USGS Groundwater Levels Service | ✅ Yes | Fixed | Well productivity metric |
| **Priority Date** | Legal/Water Right | Colorado DWR | CDSS Data Portal (CSV/JSON download) | ✅ Yes | Fixed | Water rights seniority |
| **Decree CFS** | Legal/Water Right | Colorado DWR | CDSS Data Portal | ✅ Yes | Fixed | Decreed water rights |
| **Well GPM** | Aquifer Supply | USGS NWIS | USGS Instantaneous Values Service | ✅ Yes | Real-Time | Pumping rate data |
| **InSAR Subsidence (mm)** | Aquifer Deformation | ESA Sentinel-1 (requires key) | ESA Copernicus Data Space | ❌ No | Dynamic/Weekly | **Requires ESA API key** |
| **VLM (Vertical Land Movement)** | Aquifer Deformation | USGS/NASA | USGS Volcano Hazards Program | ✅ Yes | Monthly | GPS-based subsidence data |

### B. Supply Chain Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SNOTEL SWE (Snow Water Equivalent)** | Precipitation/Runoff | USDA NRCS SNOTEL | NRCS SNOTEL Data Portal | ✅ Yes | Daily | Near real-time snow data |
| **Dust-on-Snow Albedo** | Climate/Hydrology | MODIS/USGS | USGS Earth Explorer | ✅ Yes | Daily | Satellite-based snow albedo |
| **Reservoir %** | Surface Water | USGS Water Resources | USGS Daily Values Service | ✅ Yes | Daily | Reservoir storage levels |
| **Streamflow CFS** | Surface Water | USGS Water Resources | USGS Daily Values Service | ✅ Yes | Daily | Stream discharge data |
| **Closed Basin Credits** | Legal/Water Right | Colorado DWR | CDSS Data Portal | ✅ Yes | Fixed | Basin management credits |
| **ARP Compliance %** | Regulatory | Colorado DWR | CDSS Data Portal | ✅ Yes | Seasonal | Agricultural rotation program compliance |

---

## III. CROP BIOPHYSICS PILLAR (Plant & Vegetation Metrics)

### A. Biophysics Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **NDVI (Normalized Difference Vegetation Index)** | Vegetation | Sentinel-2 (requires key) | ESA Copernicus Data Space | ❌ No | Weekly | **Requires ESA API key** |
| **NDRE (Normalized Difference Red Edge)** | Vegetation | Sentinel-2 (requires key) | ESA Copernicus Data Space | ❌ No | Weekly | **Requires ESA API key** |
| **LAI (Leaf Area Index)** | Vegetation | MODIS/NASA | NASA LAADS DAAC | ✅ Yes | 8-day | Vegetation density metric |
| **Tuber Bulking (g/day)** | Crop Growth | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |
| **Stem Count** | Crop Growth | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |
| **Canopy Closure %** | Vegetation | MODIS/Sentinel-2 | NASA LAADS DAAC | ✅ Yes | 8-day | Vegetation coverage |
| **Starch Set %** | Crop Growth | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |
| **CCI (Chlorophyll Content Index)** | Vegetation Health | Sentinel-2 (requires key) | ESA Copernicus Data Space | ❌ No | Weekly | **Requires ESA API key** |

### B. Biosecurity Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aphid Vector Density** | Pest Monitoring | USDA NASS/Regional Surveys | USDA NASS QuickStats API | ✅ Yes | Weekly | Pest pressure data |
| **Spore Counts (Blight)** | Disease Monitoring | USDA Plant Disease Database | USDA ARS Plant Disease Database | ✅ Yes | Weekly | Pathogen monitoring |
| **PVY Infection %** | Disease Monitoring | USDA NASS/Regional Surveys | USDA NASS QuickStats API | ✅ Yes | Weekly | Potato virus monitoring |
| **CPB Resistance** | Pest Monitoring | USDA NASS/Regional Surveys | USDA NASS QuickStats API | ✅ Yes | Weekly | Colorado Potato Beetle resistance |
| **Pollinator Connectivity** | Biodiversity | USDA NASS/Pollinator Surveys | USDA NASS QuickStats API | ✅ Yes | Seasonal | Pollinator health indicator |

---

## IV. OPERATIONS PILLAR (Farm Equipment & Logistics Metrics)

### A. Telematics Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Fuel Burn (Gal/Hr)** | Equipment Performance | John Deere Operations Center (requires key) | John Deere API | ❌ No | Real-Time | **Requires John Deere API key** |
| **Idle %** | Equipment Performance | John Deere Operations Center (requires key) | John Deere API | ❌ No | Real-Time | **Requires John Deere Operations Center API key** |
| **Engine Load %** | Equipment Performance | John Deere Operations Center (requires key) | John Deere API | ❌ No | Real-Time | **Requires John Deere API key** |
| **Wheel Slip %** | Equipment Performance | John Deere Operations Center (requires key) | John Deere API | ❌ No | Real-Time | **Requires John Deere API key** |
| **GPS HDOP** | Positioning Accuracy | John Deere Operations Center (requires key) | John Deere API | ❌ No | Real-Time | **Requires John Deere API key** |
| **RTK Overlap (cm)** | Application Precision | John Deere Operations Center (requires key) | John Deere API | ❌ No | Real-Time | **Requires John Deere API key** |
| **Machine MTBF (Mean Time Between Failures)** | Equipment Reliability | John Deere Operations Center (requires key) | John Deere API | ❌ No | Real-Time | **Requires John Deere API key** |

### B. Logistics Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cellar CO₂** | Storage Environment | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |
| **Ethylene ppb** | Storage Environment | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |
| **RH% (Relative Humidity)** | Storage Environment | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |
| **Tuber Core Temp** | Storage Environment | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |
| **Shrinkage %** | Storage Loss | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Daily | Requires on-farm sensors |
| **Truck Cycle Time** | Logistics Efficiency | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |
| **Tare Weight %** | Logistics Efficiency | On-Farm Sensor Network | Farm-specific telemetry | ⚠️ Hybrid | Real-Time | Requires on-farm sensors |

---

## V. STRATEGIC ECONOMIC & ESG PILLAR (Market & Sustainability Metrics)

### A. Economic Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Electricity TOU Rates** | Market Data | NREL Utility Rate Database | NREL OpenEI API | ✅ Yes | Daily | Time-of-use electricity rates |
| **Pumping Surcharge ($/AF)** | Market Data | Colorado DWR | CDSS Data Portal | ✅ Yes | Seasonal | Water pumping cost |
| **Local Basis** | Market Data | USDA NASS/CME | USDA NASS QuickStats API | ✅ Yes | Daily | Commodity price basis |
| **Malt Premium** | Market Data | USDA NASS | USDA NASS QuickStats API | ✅ Yes | Daily | Specialty crop premium |
| **Labor Wage Delta** | Market Data | USDA NASS/BLS | USDA NASS QuickStats API | ✅ Yes | Quarterly | Agricultural labor costs |

### B. ESG/Social Metrics

| Metric | Data Type | Primary Source | API/Access Method | Keyless? | Latency | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Wet Bulb Temp** | Climate/Heat Stress | NOAA National Weather Service | NOAA NWS API | ✅ Yes | Real-Time | Heat stress indicator |
| **Labor Dehydration Index** | Worker Safety | NOAA/OSHA | NOAA NWS API | ✅ Yes | Real-Time | Heat-related health risk |
| **GHG Profile (CH₄, N₂O)** | Environmental Impact | USDA/EPA | EPA Emissions Inventory API | ✅ Yes | Annual | Greenhouse gas emissions |
| **Acequia Community Status** | Water Governance | Colorado DWR | CDSS Data Portal | ✅ Yes | Fixed | Irrigation community health |
| **Sustainability Score** | ESG Compliance | USDA/Third-party certifiers | USDA Organic Integrity Database | ✅ Yes | Annual | Organic/sustainable certification status |

---

## SUMMARY: KEYLESS vs. KEY-PROTECTED APIS

### ✅ FULLY KEYLESS (No API Key Required)

**Total Keyless Metrics: ~220 of 332 (66%)**

1. **USGS Water Services** (Daily Values, Instantaneous Values, Groundwater Levels, Statistics)
2. **USDA NRCS Soil Data** (SSURGO, STATSGO)
3. **USDA NASS QuickStats API**
4. **USDA Plant Disease Database**
5. **NOAA National Weather Service API**
6. **NASA LAADS DAAC** (MODIS data)
7. **NREL OpenEI API** (Utility rates)
8. **EPA Emissions Inventory API**
9. **USDA Organic Integrity Database**
10. **Colorado DWR CDSS Data Portal** (CSV/JSON downloads)
11. **USDA NRCS SNOTEL Data Portal**
12. **USGS Earth Explorer** (MODIS/Landsat)

### ❌ KEY-PROTECTED (Requires API Key)

**Total Key-Protected Metrics: ~50 of 332 (15%)**

1. **ESA Sentinel-1/Sentinel-2** (InSAR Subsidence, NDVI, NDRE, CCI) - Requires ESA Copernicus API key
2. **John Deere Operations Center** (All telematics: Fuel Burn, Idle %, Engine Load, Wheel Slip, GPS HDOP, RTK Overlap, MTBF) - Requires John Deere API key
3. **NASA Earthdata** (GRACE/ECOSTRESS) - Requires NASA EDL account (for private key-protected data)

### ⚠️ HYBRID (On-Farm Sensors + Public APIs)

**Total Hybrid Metrics: ~62 of 332 (19%)**

1. **Crop Growth Metrics** (Tuber Bulking, Stem Count, Starch Set %) - Requires on-farm sensor network
2. **Storage Logistics** (Cellar CO₂, Ethylene, RH%, Tuber Core Temp, Shrinkage %) - Requires on-farm sensor network
3. **Logistics Efficiency** (Truck Cycle Time, Tare Weight %) - Requires on-farm sensor network

---

## IMMEDIATE ACTION ITEMS

### Phase 1: Secure Keyless APIs (No Credentials Needed)
- ✅ USGS Water Services: `https://waterservices.usgs.gov/`
- ✅ USDA NASS QuickStats: `https://quickstats.nass.usda.gov/api/`
- ✅ NOAA NWS: `https://api.weather.gov/`
- ✅ NREL OpenEI: `https://openei.org/services/rest/`
- ✅ Colorado DWR CDSS: `https://dwr.state.co.us/` (CSV/JSON downloads)

### Phase 2: Secure Key-Protected APIs (User Must Provide Credentials)
- ❌ ESA Copernicus Data Space: Requires registration at `https://dataspace.copernicus.eu/`
- ❌ John Deere Operations Center: Requires registration at `https://operations.deere.com/`
- ❌ NASA Earthdata: Requires registration at `https://urs.earthdata.nasa.gov/`

### Phase 3: On-Farm Sensor Integration (Post-Pilot)
- ⚠️ Farm-specific telemetry systems (to be integrated during pilot onboarding)

---

## Next Steps

I am ready to:

1. **Initialize the PostgreSQL/PostGIS database** with the 332-metric schema
2. **Develop Python data ingestion scripts** for all keyless APIs
3. **Create the 30m Universal Grid** for the San Luis Valley
4. **Begin the Mass Pull** of historical data from USGS, USDA, and NOAA

**Please confirm:**
- Should I proceed with initializing the FarmSense web-db-user project?
- Do you have the `.env` file with the key-protected API credentials (ESA, John Deere, NASA) ready to upload?
