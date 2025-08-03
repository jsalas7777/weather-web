'use client';

import React from 'react';
import iso3166 from 'iso-3166-2';
import SubregionItem from './SubregionItem';
import Link from 'next/link'; // ✅ Import Link

export default function Subregions({ country }) {
  const isSubregion = country.includes('-');
  const countryCode = isSubregion ? country.split('-')[0].toUpperCase() : country.toUpperCase();

  const countryData =
    iso3166.country(countryCode) ||
    iso3166.country(iso3166.codes[countryCode]);

  if (!countryData || !countryData.sub) {
    return (
      <div className="text-red-600 font-medium mt-4">
        No subregions found for code: {country}
      </div>
    );
  }

  const regions = Object.keys(countryData.sub);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-md shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Subregions of {countryData.name}
      </h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {regions.map((regionCode) => (
          <Link key={regionCode} href={`/weather?region=${regionCode}`}>
            <SubregionItem regionCode={regionCode} />
          </Link>
        ))}
      </div>
    </div>
  );
}
