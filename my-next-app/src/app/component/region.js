"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import worldCountries from "world-countries";
import Subregions from "./subregions";

countries.registerLocale(enLocale);

const weatherCodeToIcon = {
  0: "clear-day.svg",
  1: "clear-day.svg",
  2: "cloudy-1-day.svg",
  3: "cloudy-3-day.svg",
  45: "fog-day.svg",
  48: "fog-day.svg",
  51: "rainy-1-day.svg",
  53: "rainy-2-day.svg",
  55: "rainy-3-day.svg",
  56: "rain-and-sleet-mix.svg",
  57: "rain-and-sleet-mix.svg",
  61: "rainy-1-day.svg",
  63: "rainy-2-day.svg",
  65: "rainy-3-day.svg",
  66: "rain-and-sleet-mix.svg",
  67: "rain-and-sleet-mix.svg",
  71: "snowy-1-day.svg",
  73: "snowy-2-day.svg",
  75: "snowy-3-day.svg",
  77: "snowy-1-day.svg",
  80: "rainy-1-day.svg",
  81: "rainy-2-day.svg",
  82: "rainy-3-day.svg",
  85: "snowy-1-day.svg",
  86: "snowy-3-day.svg",
  95: "thunderstorms.svg",
  96: "isolated-thunderstorms-day.svg",
  99: "severe-thunderstorm.svg",
};

const weatherCodeMap = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm + hail",
  99: "Heavy thunderstorm + hail",
};



export default function Region({ useGPS = false }) {
  const mapRef = useRef(null);
  const searchParams = useSearchParams();
  const regionParam = searchParams.get('region') || 'US';

  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState(null);
  const [locationName, setLocationName] = useState('Unknown Location');

  useEffect(() => {
    const fetchCoordinates = async () => {
      try {
        
        if (useGPS && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              setCenter([lon, lat]);
        
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
              const data = await res.json();
        
              const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Current Location';
              setLocationName(city);
            },
            (err) => {
              console.warn('GPS error:', err.message);
              fallbackToRegion();
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
        
        
        else {
          fallbackToRegion();
        }
      } catch {
        fallbackToRegion();
      }
    };

    const fallbackToRegion = async () => {
      const [countryCode, subCode] = regionParam.toUpperCase().split('-');
      const isoName = countries.getName(countryCode, 'en');

      if (subCode) {
        try {
          const query = `${subCode}, ${isoName}`;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
          );
          const data = await res.json();
          if (data.length > 0) {
            const loc = data[0];
            setCenter([parseFloat(loc.lon), parseFloat(loc.lat)]);
            setLocationName(loc.display_name || `${subCode}, ${isoName}`);
          } else {
            throw new Error('No data');
          }
        } catch {
          setError(`Failed to locate ${subCode} in ${isoName}`);
        }
      } else {
        const match = worldCountries.find((c) => c.cca2 === countryCode);
        if (match) {
          setCenter([match.latlng[1], match.latlng[0]]);
          setLocationName(isoName);
        } else {
          setError('Country not found');
        }
      }
    };

    fetchCoordinates();
  }, [regionParam, useGPS]);

  useEffect(() => {
    if (!center) return;
    const [lon, lat] = center;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setCurrent(data.current);
        const daily = data.daily.time.map((time, i) => ({
          date: new Date(time).toLocaleDateString(undefined, {
            weekday: 'short',
          }),
          max: data.daily.temperature_2m_max[i],
          min: data.daily.temperature_2m_min[i],
          weathercode: data.daily.weathercode[i],
        }));
        setForecast(daily);
      })
      .catch(() => setError('Failed to load weather'));
  }, [center]);

  return (
    <div className="p-8 font-sans text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4">📍 {locationName}</h1>
      {error && <p className="text-red-500">{error}</p>}

      {current && (
        <div className="space-y-1 mb-6">
          <p><strong>🌡️ Temperature:</strong> {current.temperature_2m}°C</p>
          <p><strong>☁️ Conditions:</strong> {weatherCodeMap[current.weathercode]}</p>
          <p><strong>💨 Wind:</strong> {current.wind_speed_10m} km/h</p>
        </div>
      )}

      {forecast.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-2">7-Day Forecast</h2>
          <div className="flex overflow-x-auto gap-4 pb-4">
            {forecast.map((day, i) => (
              <div key={i} className="min-w-[140px] border rounded-md p-4 text-center bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700">
                <img
                  src={`/weather/animated/${weatherCodeToIcon[day.weathercode]}`}
                  alt={weatherCodeMap[day.weathercode]}
                  className="w-16 h-16 mb-2 mx-auto"
                />
                <strong>{day.date}</strong>
                <p>{weatherCodeMap[day.weathercode]}</p>
                <p>↑ {day.max}°C</p>
                <p>↓ {day.min}°C</p>
              </div>
            ))}
          </div>

          <h3 className="text-lg font-medium mt-4 mb-2">📈 Temperature Chart</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={forecast}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--tooltip-bg)',
                  border: '1px solid var(--tooltip-border)',
                  color: 'var(--tooltip-text)',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
                labelStyle={{ color: 'var(--tooltip-label)' }}
                itemStyle={{ color: 'var(--tooltip-text)' }}
              />
              <Line type="monotone" dataKey="max" stroke="#f87171" name="Max Temp" />
              <Line type="monotone" dataKey="min" stroke="#60a5fa" name="Min Temp" />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}

      {!useGPS && regionParam.length === 2 && <Subregions country={regionParam.toUpperCase()} />}
    </div>
  );
}