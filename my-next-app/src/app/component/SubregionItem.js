'use client';

import React, { useEffect, useState } from 'react';
import iso3166 from 'iso-3166-2';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);

const weatherCodeToIcon = {
  0: "clear-day.svg", 1: "clear-day.svg", 2: "cloudy-1-day.svg", 3: "cloudy-3-day.svg",
  45: "fog-day.svg", 48: "fog-day.svg", 51: "rainy-1-day.svg", 53: "rainy-2-day.svg",
  55: "rainy-3-day.svg", 56: "rain-and-sleet-mix.svg", 57: "rain-and-sleet-mix.svg",
  61: "rainy-1-day.svg", 63: "rainy-2-day.svg", 65: "rainy-3-day.svg",
  66: "rain-and-sleet-mix.svg", 67: "rain-and-sleet-mix.svg", 71: "snowy-1-day.svg",
  73: "snowy-2-day.svg", 75: "snowy-3-day.svg", 77: "snowy-1-day.svg",
  80: "rainy-1-day.svg", 81: "rainy-2-day.svg", 82: "rainy-3-day.svg",
  85: "snowy-1-day.svg", 86: "snowy-3-day.svg", 95: "thunderstorms.svg",
  96: "isolated-thunderstorms-day.svg", 99: "severe-thunderstorm.svg"
};

const weatherCodeMap = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
  55: "Dense drizzle", 56: "Light freezing drizzle", 57: "Dense freezing drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Light freezing rain", 67: "Heavy freezing rain", 71: "Slight snowfall",
  73: "Moderate snowfall", 75: "Heavy snowfall", 77: "Snow grains",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  85: "Slight snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
  96: "Thunderstorm + hail", 99: "Heavy thunderstorm + hail"
};

export default function SubregionItem({ regionCode }) {
  const [weather, setWeather] = useState(null);
  const [latlng, setLatlng] = useState(null);

  const [countryCode] = regionCode.split('-');
  const countryData = iso3166.country(countryCode);
  const subregion = countryData?.sub?.[regionCode];


  useEffect(() => {
    if (!subregion || !countryData) return;
  
    const timeout = setTimeout(() => {
      const query = `${subregion.name}, ${countryData.name}`;
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  
      fetch(nominatimUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setLatlng([lat, lon]);
  
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,wind_speed_10m&timezone=auto`;
  
            return fetch(weatherUrl);
          } else {
            throw new Error("Location not found");
          }
        })
        .then((res) => res.json())
        .then((data) => setWeather(data.current))
        .catch((err) => console.error("Weather error:", err));
    }, Math.floor(Math.random() * 60000)); // 0 to 60000 ms
  
    return () => clearTimeout(timeout); // Cleanup on unmount
  }, [regionCode]);
  



  return (
    <div className="p-4 border rounded shadow-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 max-w-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-bold">{subregion.name}</h3>
          <p className="text-sm text-gray-500">
            <strong>Region Code:</strong> {regionCode}
          </p>
          <p className="text-sm text-gray-500">
            <strong>Country:</strong> {countryData.name}
          </p>
          {latlng && (
            <p className="text-sm text-gray-500">
              <strong>Lat/Lon:</strong> {latlng[0].toFixed(2)}, {latlng[1].toFixed(2)}
            </p>
          )}
        </div>
        {weather && (
          <div className="flex flex-col items-center ml-4">
            <img
              src={`/weather/animated/${weatherCodeToIcon[weather.weathercode]}`}
              alt={weatherCodeMap[weather.weathercode]}
              className="w-16 h-16 mb-2"
            />
            <div className="text-center text-sm">
              <p>{weatherCodeMap[weather.weathercode]}</p>
              <p>🌡️ {weather.temperature_2m}°C</p>
              <p>💨 {weather.wind_speed_10m} km/h</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
