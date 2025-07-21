/* // src/hooks/useGhostConfig.js */
import { useState, useEffect, useCallback } from 'react';
import { TRAIT_MANIFEST, LAYER_ORDER, COHESIVE_THEMES } from '@/data/traits';

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

 const handleCohesiveRandomize = () => {
     const newConfig = { ...staticConfig };
 
     if (!lockedTraits.skin) {
         const skinOptions = Object.keys(TRAIT_MANIFEST.skin.options);
         newConfig.skin = skinOptions[Math.floor(Math.random() * skinOptions.length)];
     }
     const selectedSkinKey = newConfig.skin || '';
 
     const skinParts = selectedSkinKey.split('_');
     let skinTheme = COHESIVE_THEMES.find(theme => skinParts.includes(theme)) || skinParts[0];
 
     if (!lockedTraits.propulsion) {
       const trait = TRAIT_MANIFEST.propulsion;
       if (trait) {
         let allOptions = Object.keys(trait.options).filter(k => k !== 'none');
         if (skinTheme !== 'onesie') {
           allOptions = allOptions.filter(key => !key.includes('onesie'));
         }
         
         const jetpackOptions = allOptions.filter(key => key.includes('jetpack'));
         const otherOptions = allOptions.filter(key => !key.includes('jetpack'));
 
         if (Math.random() < 0.5 && jetpackOptions.length > 0) {
           newConfig.propulsion = jetpackOptions[Math.floor(Math.random() * jetpackOptions.length)];
         } else if (otherOptions.length > 0) {
           newConfig.propulsion = otherOptions[Math.floor(Math.random() * otherOptions.length)];
         } else if (jetpackOptions.length > 0) {
           newConfig.propulsion = jetpackOptions[Math.floor(Math.random() * jetpackOptions.length)];
         } else {
           newConfig.propulsion = 'none';
         }
       }
     }
 
     ['background', 'head', 'eyes', 'mouth'].forEach(layerKey => {
       if (!lockedTraits[layerKey]) {
         const trait = TRAIT_MANIFEST[layerKey];
         if (trait) {
           let allOptions = Object.keys(trait.options);
           if (skinTheme !== 'onesie') {
             allOptions = allOptions.filter(key => !key.includes('onesie'));
           }
           
           const candidateOptions = allOptions.filter(key => 
             !COHESIVE_THEMES.some(theme => theme !== skinTheme && theme !== 'white' && theme !== 'gold' && key.includes(theme))
           );
 
           let finalSelectionPool = candidateOptions.filter(key => key.includes(skinTheme));
           if (finalSelectionPool.length === 0) finalSelectionPool = candidateOptions;
 
           const nonNoneOptions = finalSelectionPool.filter(key => key !== 'none');
           newConfig[layerKey] = nonNoneOptions.length > 0 
             ? nonNoneOptions[Math.floor(Math.random() * nonNoneOptions.length)] 
             : (finalSelectionPool.length > 0 ? finalSelectionPool[0] : 'none');
         }
       }
     });
 
     const propulsionTrait = newConfig.propulsion || '';
     const isJetpack = propulsionTrait.includes('jetpack');
 
     const ONESIE_HAND_SUFFIX_MAP = {
         duck: 'yellow', fox: 'fox', pig: 'pig', shark: 'shark', bear: 'bear', bull: 'bull', cat: 'cat', 
         dog: 'dog', wolf: 'wolf', goat: 'goat', koala: 'koala', monkey: 'monkey', froggie: 'green', 
         turtle: 'green', dino: 'green', seal: 'grey', penguin: 'grey', gorilla: 'grey', chicken: 'white', panda: 'white'
     };
     
     if (isJetpack) {
         if (!lockedTraits.hand_left) {
             let targetLeftKey = null;
             if (skinTheme === 'onesie') {
                 const animal = Object.keys(ONESIE_HAND_SUFFIX_MAP).find(a => selectedSkinKey.includes(a));
                 if (animal) targetLeftKey = `onesie_jetpack_left_${ONESIE_HAND_SUFFIX_MAP[animal]}`;
             } else {
                 targetLeftKey = `${skinTheme}_jetpack_left`;
             }
             if (TRAIT_MANIFEST.hand_left.options[targetLeftKey]) {
                 newConfig.hand_left = targetLeftKey;
             } else {
                 const fallbackKey = skinTheme === 'onesie' ? 'onesie_jetpack_left_white' : 'white_jetpack_left';
                 newConfig.hand_left = TRAIT_MANIFEST.hand_left.options[fallbackKey] ? fallbackKey : 'none';
             }
         }
         if (!lockedTraits.hand_right) newConfig.hand_right = 'none';
     } else {
         const MUSCLE_CHANCE = 0.20;
         let useMuscles = Math.random() < MUSCLE_CHANCE;
 
         let suffix = skinTheme;
         if (skinTheme === 'onesie') {
             const animal = Object.keys(ONESIE_HAND_SUFFIX_MAP).find(a => selectedSkinKey.includes(a));
             suffix = animal ? ONESIE_HAND_SUFFIX_MAP[animal] : 'white';
         }
         const leftKey = `${skinTheme === 'onesie' ? 'onesie_' : ''}muscles_left_${suffix}`;
         const rightKey = `${skinTheme === 'onesie' ? 'onesie_' : ''}muscles_right_${suffix}`;
         
         if (useMuscles && (!TRAIT_MANIFEST.hand_left.options[leftKey] || !TRAIT_MANIFEST.hand_right.options[rightKey])) {
             useMuscles = false;
         }
 
         if (useMuscles && !lockedTraits.hand_left && !lockedTraits.hand_right) {
             newConfig.hand_left = leftKey;
             newConfig.hand_right = rightKey;
         } else {
             if (!lockedTraits.hand_left) {
               let pool = Object.keys(TRAIT_MANIFEST.hand_left.options).filter(k => !k.includes('jetpack') && !k.includes('muscles'));
               if (skinTheme !== 'onesie') pool = pool.filter(k => !k.includes('onesie'));
               
               const themeOptions = pool.filter(k => k.includes(skinTheme));
               const finalPool = themeOptions.length > 0 ? themeOptions : pool.filter(k => k !== 'none');
               newConfig.hand_left = finalPool.length > 0 ? finalPool[Math.floor(Math.random() * finalPool.length)] : 'none';
             }
             if (!lockedTraits.hand_right) {
               let pool = Object.keys(TRAIT_MANIFEST.hand_right.options).filter(k => !k.includes('muscles'));
               if (skinTheme !== 'onesie') pool = pool.filter(k => !k.includes('onesie'));
               
               const themeOptions = pool.filter(k => k.includes(skinTheme));
               const finalPool = themeOptions.length > 0 ? themeOptions : pool.filter(k => k !== 'none');
               newConfig.hand_right = finalPool.length > 0 ? finalPool[Math.floor(Math.random() * finalPool.length)] : 'none';
             }
         }
     }
 
     if (!lockedTraits.mouth && newConfig.mouth === 'none' && newConfig.eyes !== 'mask_skull') {
         const mouthOptions = Object.keys(TRAIT_MANIFEST.mouth.options).filter(key => key !== 'none');
         if (mouthOptions.length > 0) newConfig.mouth = mouthOptions[Math.floor(Math.random() * mouthOptions.length)];
     }
     
     setStaticConfig(newConfig);
   };
   
   const handleRandomizeClick = useCallback(() => {
    if (randomizeMode === 'cohesive') {
      handleCohesiveRandomize();
    } else {
      handleRandomizeStatic();
    }
  }, [randomizeMode, handleCohesiveRandomize, handleRandomizeStatic]);

  useEffect(() => {
    handleRandomizeClick();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleDownload = useCallback((size = 1410) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    const imagesToDraw = LAYER_ORDER.map(layer => {
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


  // This new effect enforces the rule for the translucent_muscles skin
  useEffect(() => {
    if (staticConfig.skin === 'translucent_muscles') {
      const requiredLeftHand = 'muscles_left_translucent';
      const requiredRightHand = 'muscles_right_translucent';

      // Only update if the hands are not already correct, to prevent infinite loops
      if (staticConfig.hand_left !== requiredLeftHand || staticConfig.hand_right !== requiredRightHand) {
        setStaticConfig(prevConfig => ({
          ...prevConfig,
          hand_left: requiredLeftHand,
          hand_right: requiredRightHand,
        }));
      }
    }
  }, [staticConfig.skin, staticConfig.hand_left, staticConfig.hand_right]);

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