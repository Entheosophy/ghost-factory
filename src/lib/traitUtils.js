// src/lib/traitUtils.js

const TRAIT_COLOR_MAP = {
  zombie: '#ceddba',
  glitch: '#cc01ff',
  bubble: '#d543b0',
  robot: '#b9b9b9',
  blobby: '#68ce60',
  ice: '#60aad1',
  goblin: '#97a55e',
  onesie: '#ff8502',
  gold: '#ffd800',
};

const DEFAULT_COLOR = '#FFFFFF';

/**
 * Returns a hex color code for a given trait key based on its class.
 * @param {string} traitKey The key of the trait (e.g., 'zombie_crown').
 * @returns {string} The corresponding hex color code.
 */
export function getTraitColor(traitKey) {
  if (!traitKey) return DEFAULT_COLOR;
  
  const keyParts = traitKey.toLowerCase().split('_');
  
  for (const className in TRAIT_COLOR_MAP) {
    if (keyParts.includes(className)) {
      return TRAIT_COLOR_MAP[className];
    }
  }

  return DEFAULT_COLOR;
}