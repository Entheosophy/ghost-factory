/* // src/lib/traitUtils.js */

export const TRAIT_COLOR_MAP = {
  zombie: '#ceddba',
  glitch: '#cc01ff',
  bubble: '#d543b0',
  robot: '#b9b9b9',
  blobby: '#68ce60',
  ice: '#60aad1',
  goblin: '#97a55e',
  onesie: '#ff8502',
  gold: '#ffd800',
  glow: '#38e9b7',
  // Onesies
  duck: '#ffec57', // yellow
  froggie: '#88cc59',  // GREEN
  turtle: '#88cc59',// GREEN
  dino: '#88cc59',  // GREEN
  wolf: '#a1a1aa',  // grey
  seal: '#a1a1aa',  // grey
  goat: '#a1a1aa',  // grey
  koala: '#a8b1b6', // grey
  bear: '#90664d',  // brown
  bull: '#956a3c',  // brown
  dog: '#b89570',  // light brown
  cat: '#f0f0f0',   // light grey
  chicken: '#ffffff',// white
  panda: '#ffffff', // white
  gorilla: '#5b5b5b', //dark grey
  penguin: '#5b5b5b', //dark grey
  monkey: '#c06d44', // light brown
  pig: '#ffbcb1', // pink
  shark: '#9ac9f2', // blue
  fox: '#e37a1d', // orange
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


// --- NEWLY ADDED FOR DUCK MASK FIX ---

// Moved from traits.js to be accessible by the utility function
export const LAYER_ORDER = ['background', 'skin', 'propulsion', 'hand_left', 'mouth', 'eyes', 'head', 'hand_right'];

/**
 * Returns the correct display order for layers.
 * If a duck mask is selected, it moves the 'mouth' layer to render after 'head'.
 * @param {object} config The current staticConfig object.
 * @returns {string[]} An array of layer keys in the correct rendering order.
 */
export function getDisplayOrder(config) {
  if (config?.mouth?.includes('mask_duck')) {
    const defaultOrder = [...LAYER_ORDER];
    // Find and remove 'mouth'
    const mouthIndex = defaultOrder.indexOf('mouth');
    if (mouthIndex === -1) return LAYER_ORDER; // Safety check
    const mouth = defaultOrder.splice(mouthIndex, 1)[0];
    
    // Find 'head' and insert 'mouth' after it
    const headIndex = defaultOrder.indexOf('head');
    if (headIndex === -1) return LAYER_ORDER; // Safety check
    defaultOrder.splice(headIndex + 1, 0, mouth);
    
    return defaultOrder;
  }
  return LAYER_ORDER;
}