/* // src/App.jsx */
import { useState, useEffect } from 'react';
import { TRAIT_MANIFEST, LAYER_ORDER } from './data/traits';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import GIF from 'gif.js';

// Import New Modular Components
import { StaticComposerPanel } from '@/components/StaticComposerPanel';
import { AnimationStudioPanel } from '@/components/AnimationStudioPanel';

// Import UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// A defined list of major themes for the cohesive randomizer
const COHESIVE_THEMES = ['zombie', 'onesie', 'goblin', 'glitch', 'gold', 'robot', 'ice', 'white'];

function App() {
  // State for Static Composer
  const [staticConfig, setStaticConfig] = useState({});
  const [randomizeMode, setRandomizeMode] = useState('cohesive'); // 'full' or 'cohesive'
  const [lockedTraits, setLockedTraits] = useState({});
  
  // State for Animation Studio
  const [frames, setFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [fps, setFps] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // dnd-kit sensor configuration
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Initialize with a random character
  useEffect(() => {
    handleRandomizeClick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Trait Locking Logic ---
  const handleToggleLock = (layer) => {
    setLockedTraits(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // --- Static Composer Logic ---
  const handleSelectStaticTrait = (layer, optionKey) => {
    setStaticConfig(prevConfig => ({ ...prevConfig, [layer]: optionKey }));
  };

  const handleRandomizeStatic = () => {
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
  };

  const handleCohesiveRandomize = () => {
    const newConfig = { ...staticConfig };

    if (!lockedTraits.skin) {
        const skinOptions = Object.keys(TRAIT_MANIFEST.skin.options);
        newConfig.skin = skinOptions[Math.floor(Math.random() * skinOptions.length)];
    }
    const selectedSkinKey = newConfig.skin || '';

    const skinParts = selectedSkinKey.split('_');
    let skinTheme = COHESIVE_THEMES.find(theme => skinParts.includes(theme)) || skinParts[0];

    // FIX: Handle propulsion with weighted jetpack chance first
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
        // FIX: Proactively decide if we should use muscles based on a chance
        const MUSCLE_CHANCE = 0.20; // 20% chance
        let useMuscles = Math.random() < MUSCLE_CHANCE;

        let suffix = skinTheme;
        if (skinTheme === 'onesie') {
            const animal = Object.keys(ONESIE_HAND_SUFFIX_MAP).find(a => selectedSkinKey.includes(a));
            suffix = animal ? ONESIE_HAND_SUFFIX_MAP[animal] : 'white';
        }
        const leftKey = `${skinTheme === 'onesie' ? 'onesie_' : ''}muscles_left_${suffix}`;
        const rightKey = `${skinTheme === 'onesie' ? 'onesie_' : ''}muscles_right_${suffix}`;
        
        if (useMuscles && (!TRAIT_MANIFEST.hand_left.options[leftKey] || !TRAIT_MANIFEST.hand_right.options[rightKey])) {
            useMuscles = false; // Disable if the matching muscle set doesn't exist for the theme
        }

        if (useMuscles && !lockedTraits.hand_left && !lockedTraits.hand_right) {
            newConfig.hand_left = leftKey;
            newConfig.hand_right = rightKey;
        } else {
            // Default path: randomize non-jetpack, non-muscle hands
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
  
  const handleRandomizeClick = () => {
    if (randomizeMode === 'cohesive') handleCohesiveRandomize();
    else handleRandomizeStatic();
  };

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const CANVAS_SIZE = 1410;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
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
        if (img) ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      });
      const link = document.createElement('a');
      link.download = 'dpgc-creation.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  // --- Animation Studio Logic ---
  const handleUpdateFrame = (layer, optionKey) => {
    if (frames.length === 0) return;
    const newFrames = [...frames];
    newFrames[activeFrameIndex].config = { ...newFrames[activeFrameIndex].config, [layer]: optionKey };
    setFrames(newFrames);
  };

  const handleAddFrame = () => {
    const newConfig = frames.length > 0 ? { ...frames[activeFrameIndex].config } : staticConfig;
    const newFrame = { id: self.crypto.randomUUID(), config: newConfig };
    const newFrames = [...frames, newFrame];
    setFrames(newFrames);
    setActiveFrameIndex(newFrames.length - 1);
  };

  const handleDuplicateFrame = (index) => {
    const frameToDuplicate = { ...frames[index], id: self.crypto.randomUUID() };
    const newFrames = [...frames.slice(0, index + 1), frameToDuplicate, ...frames.slice(index + 1)];
    setFrames(newFrames);
    setActiveFrameIndex(index + 1);
  };

  const handleDeleteFrame = (index) => {
    const newFrames = frames.filter((_, i) => i !== index);
    setFrames(newFrames);
    setActiveFrameIndex(prevIndex => Math.max(0, Math.min(prevIndex, newFrames.length - 1)));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFrames((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        setActiveFrameIndex(newIndex);
        return newArray;
      });
    }
  };

  const handleGenerateGif = async () => {
    if (frames.length === 0) return;
    setIsGenerating(true);

    const gif = new GIF({ workers: 2, quality: 10, workerScript: '/gif.worker.js' });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const CANVAS_SIZE = 512;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    for (const frame of frames) {
      const imagesToDraw = LAYER_ORDER.map(layer => {
        const url = TRAIT_MANIFEST[layer]?.options[frame.config[layer]];
        if (url) {
          return new Promise(resolve => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
          });
        }
        return Promise.resolve(null);
      });
      const loadedImages = await Promise.all(imagesToDraw);
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      loadedImages.forEach(img => {
        if (img) ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      });
      gif.addFrame(canvas, { copy: true, delay: 1000 / fps });
    }

    gif.on('finished', (blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'ghost-animation.gif';
      link.click();
      setIsGenerating(false);
    });

    gif.render();
  };
  
  const activeFrameConfig = frames[activeFrameIndex]?.config || {};

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen p-4 gap-8 text-foreground font-pixel overflow-x-hidden">
      <Tabs defaultValue="composer" className="w-full max-w-7xl mx-auto flex flex-col gap-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2">
          <TabsTrigger value="composer">Static Composer</TabsTrigger>
          <TabsTrigger value="animator">Animation Studio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="composer">
          <StaticComposerPanel
            staticConfig={staticConfig}
            lockedTraits={lockedTraits}
            randomizeMode={randomizeMode}
            onTraitSelect={handleSelectStaticTrait}
            onToggleLock={handleToggleLock}
            onRandomize={handleRandomizeClick}
            onDownload={handleDownload}
            onModeChange={setRandomizeMode}
          />
        </TabsContent>

        <TabsContent value="animator">
          <AnimationStudioPanel
            dndSensors={sensors}
            onDragEnd={handleDragEnd}
            activeFrameConfig={activeFrameConfig}
            onUpdateFrame={handleUpdateFrame}
            onAddFrame={handleAddFrame}
            onGenerateGif={handleGenerateGif}
            isGenerating={isGenerating}
            animationProps={{
              frames: frames.map(f => f.config),
              fps: fps,
              isPlaying: isPlaying,
              activeFrameIndex: activeFrameIndex
            }}
            onPlayPause={() => setIsPlaying(!isPlaying)}
            onFpsChange={setFps}
            timelineProps={{
              frames: frames,
              activeFrameIndex: activeFrameIndex,
              onSelect: setActiveFrameIndex,
              onDuplicate: handleDuplicateFrame,
              onDelete: handleDeleteFrame
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;