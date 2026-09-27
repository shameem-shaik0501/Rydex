import mongoApi from "../services/mongoApi";

const defaultLocations = [
  {
    id: "LOC-CENTER",
    city: "Hyderabad",
    name: "City Center (Abids & Nampally)",
    address: "Near Central Station, Abids Main Road, Hyderabad - 500001",
    deliveryCharge: 0,
    latitude: 17.3916,
    longitude: 78.4739,
  },
  {
    id: "LOC-HITEC",
    city: "Hyderabad",
    name: "Hitec City / Madhapur",
    address: "Near Cyber Towers, Hitec City Phase 2, Madhapur, Hyderabad - 500081",
    deliveryCharge: 350,
    latitude: 17.4485,
    longitude: 78.3756,
  },
  {
    id: "LOC-GACHI",
    city: "Hyderabad",
    name: "Gachibowli Financial District",
    address: "Opp. WaveRock SEZ, ISB Road, Gachibowli, Hyderabad - 500032",
    deliveryCharge: 450,
    latitude: 17.4239,
    longitude: 78.3428,
  },
  {
    id: "LOC-AIRPORT",
    city: "Hyderabad",
    name: "Rajiv Gandhi Int'l Airport (Shamshabad)",
    address: "Terminal 1 Arrival Plaza, RGIA, Shamshabad, Hyderabad - 500409",
    deliveryCharge: 800,
    latitude: 17.2403,
    longitude: 78.4294,
  },
  {
    id: "LOC-SEC",
    city: "Hyderabad",
    name: "Secunderabad Railway Station",
    address: "Station Road, Regimental Bazaar, Secunderabad - 500003",
    deliveryCharge: 250,
    latitude: 17.4411,
    longitude: 78.4983,
  },
  {
    id: "LOC-JUBILEE",
    city: "Hyderabad",
    name: "Jubilee Hills / Banjara Hills",
    address: "Road No. 36, Near Metro Station, Jubilee Hills, Hyderabad - 500033",
    deliveryCharge: 300,
    latitude: 17.4326,
    longitude: 78.4071,
  },
  {
    id: "LOC-KUKAT",
    city: "Hyderabad",
    name: "Kukatpally / KPHB Colony",
    address: "Near Forum Mall, KPHB 7th Phase, Hyderabad - 500072",
    deliveryCharge: 400,
    latitude: 17.4875,
    longitude: 78.3953,
  },
  {
    id: "LOC-BEGUM",
    city: "Hyderabad",
    name: "Begumpet Airport Area",
    address: "Near Lifestyle Building, Prakash Nagar, Begumpet, Hyderabad - 500016",
    deliveryCharge: 200,
    latitude: 17.4448,
    longitude: 78.4682,
  },
];

export function getStoredLocations() {
  try {
    const saved = localStorage.getItem("locations_admin");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading stored locations", e);
  }
  return defaultLocations;
}

export function saveLocations(locations) {
  try {
    localStorage.setItem("locations_admin", JSON.stringify(locations));
    mongoApi.syncLocations(locations);
  } catch (e) {
    console.error("Error saving locations", e);
  }
}

export default defaultLocations;
