// /Users/entheos/Documents/Ghost-Factory/src/lib/templateConfig.js

const DEFAULT_CANVAS_SIZE = 1410;

function formatWords(value) {
  return String(value)
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/\$/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatLayerLabel(layerKey) {
  return formatWords(layerKey);
}

export function formatTraitLabel(traitKey) {
  if (!traitKey || traitKey === "none") return "None";
  return formatWords(traitKey);
}

export function createGhostFactoryTemplateConfig({ traitManifest, layerOrder }) {
  return {
    name: "Ghost Factory Trait Pack",
    description:
      "A layered trait-pack config exported from Ghost Factory. Use it as a starting point for your own avatar, sticker, PFP, or character builder.",
    canvas: {
      width: DEFAULT_CANVAS_SIZE,
      height: DEFAULT_CANVAS_SIZE,
    },
    layers: layerOrder.map((layerId) => {
      const layer = traitManifest[layerId];

      return {
        id: layerId,
        label: layer?.label || formatLayerLabel(layerId),
        required: layerId === "background" || layerId === "skin",
        traits: Object.entries(layer?.options || {}).map(([key, path]) => ({
          key,
          label: formatTraitLabel(key),
          path,
        })),
      };
    }),
    rules: [
      {
        id: "duck-mask-above-head",
        description: "Render duck mask mouth assets above the head layer.",
        when: {
          layer: "mouth",
          traitContains: "mask_duck",
        },
        moveLayerAfter: {
          layer: "mouth",
          after: "head",
        },
      },
      {
        id: "translucent-muscles-locks-arms",
        description:
          "The translucent muscles skin requires matching translucent muscle arms and no jetpack.",
        when: {
          layer: "skin",
          trait: "translucent_muscles",
        },
        forceSelection: {
          hand_left: "muscles_left_translucent",
          hand_right: "muscles_right_translucent",
          propulsion: "none",
        },
      },
    ],
  };
}
