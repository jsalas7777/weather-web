import React, { useEffect, useState } from "react";

// Open-Meteo weather API URL
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weathercode,wind_speed_10m";

// LocationCard Component
export default function LocationCard({ lat, lon, country }) {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  useEffect(() => {
    if (lat == null || lon == null) return;
    setWeatherLoading(true);
    setWeatherError("");
    fetch(
      WEATHER_URL
        .replace("{lat}", encodeURIComponent(lat))
        .replace("{lon}", encodeURIComponent(lon))
    )
      .then((res) => res.json())
      .then((data) => {
        if (data && data.current) {
          setWeather({
            temperature_2m: data.current.temperature_2m,
            wind_speed_10m: data.current.wind_speed_10m,
            weathercode: data.current.weathercode,
          });
        } else {
          setWeather(null);
          setWeatherError("No weather data");
        }
      })
      .catch(() => {
        setWeather(null);
        setWeatherError("Error loading weather");
      })
      .finally(() => setWeatherLoading(false));
  }, [lat, lon]);

  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        left: 16,
        color: "white",
        background: "#155fa0ee",
        borderRadius: 12,
        padding: "10px 18px",
        fontWeight: 500,
        fontSize: 18,
        letterSpacing: 1,
        boxShadow: "0 2px 16px #0006",
        zIndex: 5,
        minWidth: 290,
      }}
    >
      {lat == null || lon == null ? (
        <>No location selected</>
      ) : (
        <>
          <div>
            <b>
              {country
                ? `Country: ${country}`
                : "Country: Unknown"}
            </b>
          </div>
          <div style={{ fontSize: 15, margin: "4px 0" }}>
            Lat: {lat.toFixed(4)}, Lon: {lon.toFixed(4)}
          </div>
          <hr style={{ margin: "8px 0", opacity: 0.25 }} />
          <div>
            <b>Weather:</b>
            {weatherLoading ? (
              <span style={{ marginLeft: 8 }}>Loading...</span>
            ) : weatherError ? (
              <span style={{ color: "#ffd580", marginLeft: 8 }}>{weatherError}</span>
            ) : weather ? (
              <div style={{ marginTop: 2 }}>
                Temp: {weather.temperature_2m}°C<br />
                Wind: {weather.wind_speed_10m} m/s<br />
                Code: {weather.weathercode}
              </div>
            ) : (
              <span style={{ marginLeft: 8 }}>No weather data</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
