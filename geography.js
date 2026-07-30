/* Geographic guidance for World Explorer. All distances use representative country centers. */
(function installGeoWarsGeography(global) {
  'use strict';

  const EARTH_RADIUS_KM = 6371.0088;
  const DIRECTIONS = Object.freeze([
    Object.freeze({ short: 'N', label: 'north', arrow: '↑' }),
    Object.freeze({ short: 'NE', label: 'northeast', arrow: '↗' }),
    Object.freeze({ short: 'E', label: 'east', arrow: '→' }),
    Object.freeze({ short: 'SE', label: 'southeast', arrow: '↘' }),
    Object.freeze({ short: 'S', label: 'south', arrow: '↓' }),
    Object.freeze({ short: 'SW', label: 'southwest', arrow: '↙' }),
    Object.freeze({ short: 'W', label: 'west', arrow: '←' }),
    Object.freeze({ short: 'NW', label: 'northwest', arrow: '↖' })
  ]);
  const toRadians = degrees => degrees * Math.PI / 180;
  const toDegrees = radians => radians * 180 / Math.PI;

  function coordinates(place) {
    if (!place) return null;
    const longitude = Number(place.longitude ?? place.x);
    const latitude = Number(place.latitude ?? place.y);
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
    return { longitude, latitude };
  }

  function distanceKm(fromPlace, toPlace) {
    const from = coordinates(fromPlace);
    const to = coordinates(toPlace);
    if (!from || !to) return null;
    const fromLatitude = toRadians(from.latitude);
    const toLatitude = toRadians(to.latitude);
    const latitudeDelta = toRadians(to.latitude - from.latitude);
    const longitudeDelta = toRadians(to.longitude - from.longitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  function bearingDegrees(fromPlace, toPlace) {
    const from = coordinates(fromPlace);
    const to = coordinates(toPlace);
    if (!from || !to) return null;
    const fromLatitude = toRadians(from.latitude);
    const toLatitude = toRadians(to.latitude);
    const longitudeDelta = toRadians(to.longitude - from.longitude);
    const y = Math.sin(longitudeDelta) * Math.cos(toLatitude);
    const x = Math.cos(fromLatitude) * Math.sin(toLatitude) -
      Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDelta);
    return (toDegrees(Math.atan2(y, x)) + 360) % 360;
  }

  function directionForBearing(bearing) {
    if (!Number.isFinite(bearing)) return null;
    return DIRECTIONS[Math.round(((bearing % 360) + 360) % 360 / 45) % DIRECTIONS.length];
  }

  function proximityForDistance(distance) {
    if (!Number.isFinite(distance)) return '';
    if (distance < 750) return 'Nearby';
    if (distance < 2000) return 'Close';
    if (distance < 4500) return 'Far';
    return 'Very far';
  }

  function roundedDistance(distance) {
    if (!Number.isFinite(distance)) return null;
    const interval = distance >= 1000 ? 100 : distance >= 250 ? 50 : 10;
    return Math.max(interval, Math.round(distance / interval) * interval);
  }

  function formatDistance(distance) {
    const rounded = roundedDistance(distance);
    return rounded === null ? '' : `${rounded.toLocaleString('en-US')} km`;
  }

  function hintBetween(fromPlace, toPlace) {
    const distance = distanceKm(fromPlace, toPlace);
    const bearing = bearingDegrees(fromPlace, toPlace);
    const direction = directionForBearing(bearing);
    if (!Number.isFinite(distance) || !direction) return null;
    return Object.freeze({
      distanceKm: distance,
      displayDistance: formatDistance(distance),
      bearingDegrees: bearing,
      direction: direction.short,
      directionLabel: direction.label,
      arrow: direction.arrow,
      proximity: proximityForDistance(distance)
    });
  }

  global.GeoWarsGeography = Object.freeze({
    distanceKm,
    bearingDegrees,
    directionForBearing,
    proximityForDistance,
    roundedDistance,
    formatDistance,
    hintBetween
  });
}(window));