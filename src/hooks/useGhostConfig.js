/* // src/hooks/useGhostConfig.js */
import { useState, useEffect, useCallback } from 'react';
import { TRAIT_MANIFEST, COHESIVE_THEMES } from '@/data/traits';
import { getDisplayOrder, LAYER_ORDER } from '@/lib/traitUtils'; 

export function useGhostConfig() {
  const [staticConfig, setStaticConfig] = useState({});
  const [randomizeMode, setRandomizeMode] = useState('cohesive');
  const [lockedTraits, setLockedTraits] = useState({});
  const [isNftLoading, setIsNftLoading] = useState(false);

  const handleToggleLock = useCallback((layer) => {
    setLockedTraits(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleSelectStaticTrait = useCallback((layer, optionKey) => {
    setStaticConfig(prevConfig => ({ ...prevConfig, [layer]: optionKey }));
  }, []);

  const handleLoadNft = useCallback(async (serial) => {
    setIsNftLoading(true);
    const tokenId = '0.0.878200';
    const mirrorNodeUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${tokenId}/nfts/${serial}`;
    try {
      const mirrorResponse = await fetch(mirrorNodeUrl);
      if (!mirrorResponse.ok) throw new Error(`NFT #${serial} not found.`);
      const nftData = await mirrorResponse.json();
      const ipfsPointer = atob(nftData.metadata);
      if (!ipfsPointer.startsWith('ipfs://')) throw new Error('Unsupported metadata format.');
      
      const ipfsCid = ipfsPointer.replace('ipfs://', '');
      const ipfsUrl = `https://ipfs.io/ipfs/${ipfsCid}`;
      const ipfsResponse = await fetch(ipfsUrl);
      if (!ipfsResponse.ok) throw new Error(`Could not retrieve metadata from IPFS.`);
      const metadataJson = await ipfsResponse.json();

      const rawAttributes = {};
      metadataJson.attributes.forEach(attr => {
        const layerKey = attr.trait_type.toLowerCase().replace(/ /g, '_');
        rawAttributes[layerKey] = attr.value.toLowerCase();
      });

      const skinValue = rawAttributes.skin || '';
      const skinTheme = COHESIVE_THEMES.find(theme => skinValue.includes(theme));
      const newConfig = {};
      const allLayerKeys = Object.keys(TRAIT_MANIFEST);

      allLayerKeys.forEach(layerKey => {
        if (lockedTraits[layerKey]) {
          newConfig[layerKey] = staticConfig[layerKey];
          return;
        }
        const cleanValue = rawAttributes[layerKey]?.replace(/ /g, '_');
        if (!cleanValue || cleanValue === 'none') {
          newConfig[layerKey] = 'none';
          return;
        }
        const optionsForLayer = Object.keys(TRAIT_MANIFEST[layerKey].options);
        let foundKey = null;
        if (skinTheme && layerKey !== 'skin' && layerKey !== 'background') {
          const possibleKeys = [`${cleanValue}_${skinTheme}`, `${skinTheme}_${cleanValue}`];
          if (skinTheme === 'onesie') possibleKeys.push(`${cleanValue}_onesie`, `onesie_${cleanValue}`);
          foundKey = optionsForLayer.find(optKey => possibleKeys.includes(optKey.toLowerCase()));
        }
        if (!foundKey) foundKey = optionsForLayer.find(optKey => optKey.toLowerCase() === cleanValue);
        newConfig[layerKey] = foundKey || 'none';
      });
      setStaticConfig(newConfig);
    } catch (error) {
      console.error("Failed to load NFT:", error);
      alert(error.message);
    } finally {
      setIsNftLoading(false);
    }
  }, [lockedTraits, staticConfig]);

  const handleRandomizeStatic = useCallback(() => {
    const newConfig = { ...staticConfig };
    LAYER_ORDER.forEach(layer => {
      if (!lockedTraits[layer]) {
        const trait = TRAIT_MANIFEST[layer];
        if (trait) {
          const options = Object.keys(trait.options);
          newConfig[layer] = options[Math.floor(Math.random() * options.length)];
        }
      }
    });
    setStaticConfig(newConfig);
  }, [lockedTraits, staticConfig]);

  const handleCohesiveRandomize = useCallback(() => {
    const newConfig = { ...staticConfig };
    if (!lockedTraits.skin) {
        const skinOptions = Object.keys(TRAIT_MANIFEST.skin.options);
        newConfig.skin = skinOptions[Math.floor(Math.random() * skinOptions.length)];
    }
    const selectedSkinKey = newConfig.skin || '';
    const skinParts = selectedSkinKey.split('_');
    const skinTheme = COHESIVE_THEMES.find(theme => skinParts.includes(theme)) || skinParts[0];

    const pools = {};
    const layersToProcess = ['background', 'propulsion', 'head', 'eyes', 'mouth', 'hand_left', 'hand_right'];
    
    layersToProcess.forEach(layerKey => {
        if (lockedTraits[layerKey]) return;
        if (layerKey === 'propulsion' && selectedSkinKey === 'translucent_muscles') {
            const allPropulsion = Object.keys(TRAIT_MANIFEST.propulsion.options);
            pools[layerKey] = allPropulsion.filter(key => !key.includes('jetpack'));
            return;
        }
        const allOptions = Object.keys(TRAIT_MANIFEST[layerKey].options).filter(k => k !== 'none' && k !== null);
        const themePool = allOptions.filter(key => key.includes(skinTheme));
        const defaultPool = allOptions.filter(key => !COHESIVE_THEMES.some(theme => key.includes(theme)));
        if (skinTheme === 'robot' && (layerKey === 'eyes' || layerKey === 'mouth')) {
            pools[layerKey] = themePool;
        } else if (skinTheme === 'onesie' && layerKey === 'propulsion') {
            pools[layerKey] = themePool;
        } else if (skinTheme === 'onesie' && layerKey === 'mouth') {
            const filteredDefaults = defaultPool.filter(key => key !== 'drool' && key !== 'mask_duck');
            pools[layerKey] = [...themePool, ...filteredDefaults];
        } else {
            pools[layerKey] = [...themePool, ...defaultPool];
        }
    });

    ['background', 'head', 'eyes', 'mouth'].forEach(layerKey => {
        if (pools[layerKey] && pools[layerKey].length > 0) {
            newConfig[layerKey] = pools[layerKey][Math.floor(Math.random() * pools[layerKey].length)];
        } else if (!lockedTraits[layerKey]) {
            newConfig[layerKey] = 'none';
        }
    });
    
    if (pools.propulsion && pools.propulsion.length > 0) {
        const jetpackOptions = pools.propulsion.filter(key => key.includes('jetpack'));
        const otherOptions = pools.propulsion.filter(key => !key.includes('jetpack'));
        if (Math.random() < 0.5 && jetpackOptions.length > 0) {
            newConfig.propulsion = jetpackOptions[Math.floor(Math.random() * jetpackOptions.length)];
        } else if (otherOptions.length > 0) {
            newConfig.propulsion = otherOptions[Math.floor(Math.random() * otherOptions.length)];
        } else if (jetpackOptions.length > 0) {
            newConfig.propulsion = jetpackOptions[Math.floor(Math.random() * jetpackOptions.length)];
        }
    } else if (!lockedTraits.propulsion) {
        newConfig.propulsion = 'none';
    }

    const propulsionTrait = newConfig.propulsion || '';
    const isJetpack = propulsionTrait.includes('jetpack');
    const ONESIE_HAND_SUFFIX_MAP = { duck: 'duck', fox: 'fox', pig: 'pig', shark: 'shark', bear: 'bear', bull: 'bull', cat: 'cat', dog: 'dog', wolf: 'wolf', goat: 'goat', koala: 'koala', monkey: 'monkey', froggie: 'green', turtle: 'green', dino: 'green', seal: 'grey', penguin: 'grey', gorilla: 'grey', chicken: 'white', panda: 'white' };
    
    if (isJetpack) {
        if (!lockedTraits.hand_left) {
            let targetLeftKey = null;
            if (skinTheme === 'onesie') {
                const animal = Object.keys(ONESIE_HAND_SUFFIX_MAP).find(a => selectedSkinKey.includes(a));
                const suffix = animal ? ONESIE_HAND_SUFFIX_MAP[animal] : 'white';
                targetLeftKey = `onesie_jetpack_left_${suffix}`;
            } else {
                targetLeftKey = `${skinTheme}_jetpack_left`;
            }
            newConfig.hand_left = TRAIT_MANIFEST.hand_left.options[targetLeftKey] ? targetLeftKey : 'none';
        }
        if (!lockedTraits.hand_right) newConfig.hand_right = 'none';
    } else {
        const MUSCLE_CHANCE = 0.15;
        const WATERGUN_CHANCE = 0.15;
        let useMuscles = Math.random() < MUSCLE_CHANCE;
        let useWatergun = !useMuscles && (Math.random() < WATERGUN_CHANCE);
        if (useMuscles) {
            let suffix = skinTheme;
            if (skinTheme === 'onesie') {
                const animal = Object.keys(ONESIE_HAND_SUFFIX_MAP).find(a => selectedSkinKey.includes(a));
                suffix = animal ? ONESIE_HAND_SUFFIX_MAP[animal] : 'white';
            }
            const leftKey = `onesie_muscles_left_${suffix}`;
            const rightKey = `onesie_muscles_right_${suffix}`;
            if (!TRAIT_MANIFEST.hand_left.options[leftKey] || !TRAIT_MANIFEST.hand_right.options[rightKey]) {
                useMuscles = false;
            }
            if (useMuscles && !lockedTraits.hand_left && !lockedTraits.hand_right) {
                newConfig.hand_left = leftKey;
                newConfig.hand_right = rightKey;
            }
        } 
        if (useWatergun) {
            const leftWatergun = pools.hand_left?.find(k => k.includes('watergun'));
            const rightWatergun = pools.hand_right?.find(k => k.includes('watergun'));
            if (leftWatergun && rightWatergun && !lockedTraits.hand_left && !lockedTraits.hand_right) {
                newConfig.hand_left = leftWatergun;
                newConfig.hand_right = rightWatergun;
            } else {
                useWatergun = false;
            }
        }
        if (!useMuscles && !useWatergun) {
            if (!lockedTraits.hand_left && pools.hand_left) {
                const finalPool = pools.hand_left.filter(k => !k.includes('muscles') && !k.includes('jetpack'));
                let selection = finalPool.length > 0 ? finalPool[Math.floor(Math.random() * finalPool.length)] : 'none';
                if (selection.includes('blade_knife') && skinTheme === 'onesie') {
                  const animal = Object.keys(ONESIE_HAND_SUFFIX_MAP).find(a => selectedSkinKey.includes(a));
                  const suffix = animal ? ONESIE_HAND_SUFFIX_MAP[animal] : 'white';
                  const targetKey = `onesie_blade_knife_${suffix}`;
                  selection = TRAIT_MANIFEST.hand_left.options[targetKey] ? targetKey : 'onesie_blade_knife_white';
                }
                newConfig.hand_left = selection;
            }
            if (!lockedTraits.hand_right && pools.hand_right) {
                const finalPool = pools.hand_right.filter(k => !k.includes('muscles') && !k.includes('watergun'));
                newConfig.hand_right = finalPool.length > 0 ? finalPool[Math.floor(Math.random() * finalPool.length)] : 'none';
            }
        }
    }

    if (!lockedTraits.mouth && (newConfig.mouth === 'none' || newConfig.mouth === null) && newConfig.eyes !== 'mask_skull') {
        const mouthOptions = Object.keys(TRAIT_MANIFEST.mouth.options).filter(key => key !== 'none' && key !== null);
        if (mouthOptions.length > 0) newConfig.mouth = mouthOptions[Math.floor(Math.random() * mouthOptions.length)];
    }
    
    setStaticConfig(newConfig);
  }, [lockedTraits, staticConfig]);

  const handleRandomizeClick = useCallback(() => {
    if (randomizeMode === 'cohesive') {
      handleCohesiveRandomize();
    } else {
      handleRandomizeStatic();
    }
  }, [randomizeMode, handleCohesiveRandomize, handleRandomizeStatic]);

  useEffect(() => {
    handleRandomizeClick();
  }, []);

  const handleDownload = useCallback((size = 1410) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    const displayOrder = getDisplayOrder(staticConfig);
    const imagesToDraw = displayOrder.map(layer => {
      const url = TRAIT_MANIFEST[layer]?.options[staticConfig[layer]];
      if (url) {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      }
      return Promise.resolve(null);
    });
    Promise.all(imagesToDraw).then(images => {
      images.forEach(img => {
        if (img) ctx.drawImage(img, 0, 0, size, size);
      });
      const link = document.createElement('a');
      link.download = `dpgc-creation-${size}px.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }, [staticConfig]);

  useEffect(() => {
    if (staticConfig.skin === 'translucent_muscles') {
      const updates = {};
      const requiredLeftHand = 'muscles_left_translucent';
      const requiredRightHand = 'muscles_right_translucent';

      if (staticConfig.hand_left !== requiredLeftHand || staticConfig.hand_right !== requiredRightHand) {
        updates.hand_left = requiredLeftHand;
        updates.hand_right = requiredRightHand;
      }
      if (staticConfig.propulsion?.includes('jetpack')) {
        updates.propulsion = 'none';
      }
      if (Object.keys(updates).length > 0) {
        setStaticConfig(prevConfig => ({ ...prevConfig, ...updates }));
      }
    }
  }, [staticConfig.skin, staticConfig.hand_left, staticConfig.hand_right, staticConfig.propulsion]);

  return {
    staticConfig,
    lockedTraits,
    randomizeMode,
    isNftLoading,
    onModeChange: setRandomizeMode,
    onToggleLock: handleToggleLock,
    onTraitSelect: handleSelectStaticTrait,
    onRandomize: handleRandomizeClick,
    onDownload: handleDownload,
    onNftLoad: handleLoadNft,
  };
}