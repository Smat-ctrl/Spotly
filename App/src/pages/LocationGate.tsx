import { useNavigate } from "react-router-dom";
import Discover from "./Discover";

async function reverseGeocode(latitude: number, longitude: number) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Could not resolve current location");
  }

  const data = await res.json();
  const address = data.address || {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.county;
  const state = address.state || address.region;
  const country = address.country;

  return {
    latitude,
    longitude,
    city,
    state,
    country,
    label:
      [city, state, country].filter(Boolean).join(", ") ||
      data.display_name ||
      `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`,
  };
}

export default function LocationGate() {
  const navigate = useNavigate();

  const handleAllowLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const location = await reverseGeocode(latitude, longitude);
          localStorage.setItem("spotly_location", JSON.stringify(location));
        } catch {
          localStorage.setItem(
            "spotly_location",
            JSON.stringify({ latitude, longitude }),
          );
        }

        navigate("/discover");
      },
      () => {
        alert("Could not get your location.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  return (
    <div className="relative min-h-screen">
      <Discover />

      <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm" />

      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-5 text-center">
            <h1 className="text-2xl font-semibold">Enable Location</h1>
            <p className="text-sm text-gray-600">
              We need your location to show nearby food spots.
            </p>
            <button
              onClick={handleAllowLocation}
              className="rounded-lg bg-[#FF2056] px-5 py-2 text-white"
            >
              Allow Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
