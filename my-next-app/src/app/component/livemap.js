"use client";

import React, { useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import * as d3 from "d3-geo";
import LocationCard from "./LocationCard";

// ---- Geo helpers ----
const GEO_URL =
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

// Convert (lat, lon) to 3D coordinates on sphere
function latLonToVec3(lat, lon, radius = 1.5) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Convert 3D point to (lat, lon)
function vec3ToLatLon(vec) {
  const r = vec.length();
  const phi = Math.acos(vec.y / r);
  const theta = Math.atan2(vec.z, -vec.x);
  const lat = 90 - (phi * 180) / Math.PI;
  const lon = (theta * 180) / Math.PI - 180;
  return [lat, lon];
}

// ---- Country borders ----
function CountryBorders({ geoData, selectedIso }) {
  const radius = 1.51;
  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#ffffff", // pure white
    linewidth: 3,     // thicker lines (note: WebGL1 ignores linewidth > 1 on most platforms)
    transparent: false,
    opacity: 1,
  });
  const highlightMaterial = new THREE.LineBasicMaterial({
    color: "#ffffff", // pure white
    linewidth: 5,     // even thicker for selected country
    transparent: false,
    opacity: 1,
  });

  return (
    <group>
      {geoData.features.map((feature, i) => {
        const isSelected =
          selectedIso === feature.properties.id ||
          selectedIso === feature.properties.ISO_A3;
        const polygons =
          feature.geometry.type === "Polygon"
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates;
        return (
          <group key={i}>
            {polygons.map((polygon, j) => {
              const ring = polygon[0];
              const points = ring.map(([lon, lat]) =>
                latLonToVec3(lat, lon, radius)
              );
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              return (
                <line
                  key={j}
                  geometry={geometry}
                  material={isSelected ? highlightMaterial : lineMaterial}
                />
              );
            })}
          </group>
        );
      })}
    </group>
  );
}


// ---- Click marker ----
function ClickCircle({ position }) {
  const meshRef = useRef();
  if (!position) return null;
  const offset = 0.11;
  const lifted = position
    .clone()
    .normalize()
    .multiplyScalar(position.length() + offset);

  useEffect(() => {
    if (meshRef.current && position) {
      meshRef.current.lookAt(
        new THREE.Vector3().copy(position).multiplyScalar(2)
      );
    }
  }, [position]);

  // innerRadius and outerRadius determine border thickness
  return (
    <mesh ref={meshRef} position={lifted}>
      <ringGeometry args={[0.06, 0.07, 64]} />
      <meshBasicMaterial
        color="yellow"
        side={THREE.DoubleSide}
        transparent={true}
        opacity={1}
      />
    </mesh>
  );
}

// ---- Clickable Sphere ----
function ClickableSphere({ geoData, onSelect, isDraggingRef }) {
  const meshRef = useRef();
  const { camera } = useThree();

  // Track a simple gesture state
  const gestureRef = useRef({
    down: false,
    startX: 0,
    startY: 0,
    moved: false,
    startedOnGlobe: false,
  });

  const MOVE_THRESHOLD_PX = 6;

  const handlePointerDown = (e) => {
    // Do NOT stopPropagation; let OrbitControls receive the event too
    gestureRef.current.down = true;
    gestureRef.current.startX = e.clientX;
    gestureRef.current.startY = e.clientY;
    gestureRef.current.moved = false;
    gestureRef.current.startedOnGlobe = true; // we're on the sphere mesh
  };

  const handlePointerMove = (e) => {
    if (!gestureRef.current.down) return;
    const dx = e.clientX - gestureRef.current.startX;
    const dy = e.clientY - gestureRef.current.startY;
    if (Math.hypot(dx, dy) > MOVE_THRESHOLD_PX) {
      gestureRef.current.moved = true;
    }
  };

  const handlePointerUp = (e) => {
    const { down, moved, startedOnGlobe } = gestureRef.current;
    gestureRef.current.down = false;

    // Only treat as a click if it started on globe, didn't move, and controls aren't dragging
    if (!down || !startedOnGlobe || moved || isDraggingRef?.current) return;

    const point = e.point.clone(); // r3f gives you the intersection point in world space
    const [lat, lon] = vec3ToLatLon(point);

    if (geoData) {
      const found = geoData.features.find((feature) =>
        d3.geoContains(feature, [lon, lat])
      );
      if (found) {
        const countryName = found.properties.name;
        const countryIso = found.properties.id || found.properties.ISO_A3;
        onSelect({ iso: countryIso, name: countryName }, [lat, lon], point);
      } else {
        onSelect(null, [lat, lon], point);
      }
    }
  };

  const handlePointerCancel = () => {
    gestureRef.current.down = false;
    gestureRef.current.moved = false;
    gestureRef.current.startedOnGlobe = false;
  };

  return (
    <mesh
      ref={meshRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshBasicMaterial color="white" transparent opacity={0} />
    </mesh>
  );
}



// ---- Animated Orbit Controls ----
function AnimatedOrbitControls({ targetLatLon, animate, onAnimationEnd, dragStateRef }) {
  const controls = useRef();
  const { camera } = useThree();

  const [animating, setAnimating] = useState(false);
  const targetRef = useRef({ lat: 0, lon: 0 });

  useEffect(() => {
    if (!controls.current) return;
    const onStart = () => { if (dragStateRef) dragStateRef.current = true; };
    const onEnd = () => { if (dragStateRef) dragStateRef.current = false; };
    controls.current.addEventListener("start", onStart);
    controls.current.addEventListener("end", onEnd);
    return () => {
      controls.current.removeEventListener("start", onStart);
      controls.current.removeEventListener("end", onEnd);
    };
  }, [dragStateRef]);

  useEffect(() => {
    if (animate && targetLatLon) {
      targetRef.current = { lat: targetLatLon[0], lon: targetLatLon[1] };
      setAnimating(true);
    }
  }, [targetLatLon, animate]);

  useFrame((_, delta) => {
    if (animating && controls.current && targetRef.current) {
      const radius = camera.position.length();
      const targetVec = latLonToVec3(targetRef.current.lat, targetRef.current.lon, 0);
      const t = 0.035;
      controls.current.target.lerp(targetVec, t);

      const desiredPhi = ((90 - targetRef.current.lat) * Math.PI) / 180;
      const desiredTheta = ((targetRef.current.lon + 180) * Math.PI) / 180;
      const desiredPosition = new THREE.Vector3(
        -radius * Math.sin(desiredPhi) * Math.cos(desiredTheta),
        radius * Math.cos(desiredPhi),
        radius * Math.sin(desiredPhi) * Math.sin(desiredTheta)
      );
      camera.position.lerp(desiredPosition, t);

      if (
        controls.current.target.distanceTo(targetVec) < 0.01 &&
        camera.position.distanceTo(desiredPosition) < 0.01
      ) {
        controls.current.target.copy(targetVec);
        camera.position.copy(desiredPosition);
        setAnimating(false);
        onAnimationEnd?.();
      }
    }
  });

  useEffect(() => {
    if (controls.current) {
      controls.current.enablePan = false;
      controls.current.minDistance = 2.2;
      controls.current.maxDistance = 8;
    }
  }, []);

  useFrame(() => {
    if (controls.current && !animating) {
      const dist = camera.position.length();
      controls.current.rotateSpeed = Math.max(0.05, dist * 0.13);
      controls.current.zoomSpeed = Math.min(1.2, Math.max(0.7, 0.3 + dist * 0.12));
    }
  });

  return <OrbitControls ref={controls} />;
}


// ---- SearchBar ----
export function SearchBar({ geoData, onSelect, loading }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef();

  function handleInputChange(e) {
    const val = e.target.value;
    setInput(val);
    setError("");
    if (geoData && val.trim()) {
      const search = val.trim().toLowerCase();
      const filtered = geoData.features
        .filter((f) => {
          const name = f.properties.name?.toLowerCase() || "";
          const id = f.properties.id?.toLowerCase() || "";
          const iso = f.properties.ISO_A3?.toLowerCase() || "";
          return name.includes(search) || id === search || iso === search;
        })
        .sort((a, b) => a.properties.name.localeCompare(b.properties.name))
        .slice(0, 10);
      setSuggestions(filtered);
      setShowDropdown(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  }

  function handleSuggestionSelect(feature) {
    const centroid = d3.geoCentroid(feature); // [lon, lat]
    const lat = centroid[1];
    const lon = centroid[0];
    if (onSelect) {
      onSelect(
        {
          name: feature.properties.name,
          iso: feature.properties.id || feature.properties.ISO_A3,
        },
        [lat, lon],
        latLonToVec3(lat, lon, 1.5)
      );
    }
    setInput("");
    setSuggestions([]);
    setShowDropdown(false);
    setError("");
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!input.trim() || !geoData) return;
    const match = geoData.features.find(
      (f) =>
        f.properties.name &&
        f.properties.name.toLowerCase() === input.trim().toLowerCase()
    );
    if (match) handleSuggestionSelect(match);
    else setError("Country not found.");
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      autoComplete="off"
      style={{
        position: "absolute",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        background: "#143d6b",
        borderRadius: 12,
        boxShadow: "0 2px 10px #0005",
        padding: "10px 18px",
        minWidth: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
          placeholder={loading ? "Loading countries..." : "Search country name"}
          disabled={loading}
          style={{
            border: "none",
            outline: "none",
            padding: "8px 10px",
            borderRadius: 8,
            fontSize: 16,
            background: "#213d5b",
            color: "white",
            width: 180,
          }}
        />
        <button
          type="submit"
          style={{
            background: "#2088ff",
            color: "white",
            border: "none",
            borderRadius: 7,
            padding: "7px 18px",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: 1,
            cursor: "pointer",
          }}
          disabled={loading}
        >
          Go
        </button>
      </div>
      {showDropdown && (
        <ul
          style={{
            margin: 0,
            padding: 0,
            position: "absolute",
            left: 0,
            right: 0,
            top: 50,
            background: "#132c4b",
            borderRadius: 8,
            boxShadow: "0 4px 14px #0004",
            listStyle: "none",
            zIndex: 50,
          }}
        >
          {suggestions.map((f, idx) => (
            <li
              key={f.properties.name}
              tabIndex={0}
              style={{
                padding: "7px 14px",
                cursor: "pointer",
                fontSize: 16,
                borderBottom:
                  idx < suggestions.length - 1 ? "1px solid #18304d" : "none",
              }}
              onMouseDown={() => handleSuggestionSelect(f)}
            >
              {f.properties.name}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <span style={{ color: "#ffbe40", fontSize: 14, marginTop: 4 }}>
          {error}
        </span>
      )}
    </form>
  );
}

// ---- MAIN GLOBE COMPONENT ----
export default function Globe() {
  const [geoData, setGeoData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [clickedLatLon, setClickedLatLon] = useState(null);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [animateTo, setAnimateTo] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    fetch(GEO_URL)
      .then((r) => r.json())
      .then(setGeoData);
  }, []);

  // When clicked or searched, set animation target
  function handleSelect(country, latlon, position) {
    setSelectedCountry(country);
    setClickedLatLon(latlon);
    setClickedPosition(position);
    if (latlon) {
      setAnimateTo(latlon);
      setIsAnimating(true);
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0c1529",
        position: "relative",
      }}
    >
      {/* --- Search bar above the globe --- */}
      <SearchBar geoData={geoData} onSelect={handleSelect} loading={!geoData} />

      <Canvas camera={{ position: [0, 0, 4.2], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 8, 8]} intensity={0.7} />
        <Suspense fallback={null}>
          {/* Globe */}
          <mesh>
            <sphereGeometry args={[1.5, 64, 64]} />
            <meshStandardMaterial
              color="#155fa0"
              roughness={0.7}
              metalness={0.2}
              transparent
              opacity={0.98}
            />
          </mesh>
          {/* Borders */}
          {geoData && (
            <CountryBorders
              geoData={geoData}
              selectedIso={selectedCountry?.iso}
            />
          )}
          {/* Click marker */}
          {clickedPosition && <ClickCircle position={clickedPosition} />}
          {/* Click handler sphere */}
          {geoData && (
            <ClickableSphere geoData={geoData} onSelect={handleSelect} />
          )}
        </Suspense>
        {/* --- Animated OrbitControls --- */}
        <AnimatedOrbitControls
          targetLatLon={animateTo}
          animate={isAnimating}
          onAnimationEnd={() => setIsAnimating(false)}
        />
      </Canvas>

      {selectedCountry && (
        <LocationCard
          lat={clickedLatLon?.[0]}
          lon={clickedLatLon?.[1]}
          country={selectedCountry.name}
          iso={selectedCountry.iso}
        />
      )}
    </div>
  );
}
