/* // src/App.jsx */
import { useState, useEffect, useMemo } from 'react';
import { TRAIT_MANIFEST, LAYER_ORDER, UI_ORDER } from './data/traits';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import GIF from 'gif.js';

// Import Components
import { AnimationPreview } from '@/components/AnimationPreview';
import { FrameTimeline } from '@/components/FrameTimeline';
import { TraitSelector } from '@/components/TraitSelector'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch"; // Import the new Switch component
import { Label } from "@/components/ui/label";   // Import Label for the Switch
import { Play, Pause } from 'lucide-react';

// A defined list of major themes for the cohesive randomizer
const COHESIVE_THEMES = ['zombie', 'onesie', 'goblin', 'glitch', 'gold', 'robot', 'ice', 'white'];

function App() {
  // State for Static Composer
  const [staticConfig, setStaticConfig] = useState({});
  const [randomizeMode, setRandomizeMode] = useState('full'); // 'full' or 'cohesive'
  
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
    handleRandomizeStatic();
  }, []);

  // --- Static Composer Logic ---
  const handleSelectStaticTrait = (layer, optionKey) => {
    setStaticConfig(prevConfig => ({ ...prevConfig, [layer]: optionKey }));
  };

  const handleRandomizeStatic = () => {
    const newConfig = {};
    LAYER_ORDER.forEach(layer => {
      const trait = TRAIT_MANIFEST[layer];
      if (trait) {
        const options = Object.keys(trait.options);
        newConfig[layer] = options[Math.floor(Math.random() * options.length)];
      }
    });
    setStaticConfig(newConfig);
  };

  // Function for cohesive randomization
  const handleCohesiveRandomize = () => {
    const newConfig = {};

    // 1. Pick a random skin to define the theme for the set.
    const skinOptions = Object.keys(TRAIT_MANIFEST.skin.options);
    const selectedSkinKey = skinOptions[Math.floor(Math.random() * skinOptions.length)];
    newConfig.skin = selectedSkinKey;

    // 2. Extract the core theme from the skin name.
    const skinParts = selectedSkinKey.split('_');
    let skinTheme = COHESIVE_THEMES.find(theme => skinParts.includes(theme));
    if (!skinTheme) {
      skinTheme = skinParts[0]; 
    }
    
    // 3. Select traits for other layers based on the skin's theme, with intelligent fallbacks.
    LAYER_ORDER.forEach(layerKey => {
      if (layerKey === 'skin') return; 

      const trait = TRAIT_MANIFEST[layerKey];
      if (trait) {
        const allOptions = Object.keys(trait.options);
        if (allOptions.length === 0) return;

        let chosenOption = null;
        const themeOptions = allOptions.filter(key => key.includes(skinTheme));
        if (themeOptions.length > 0) {
          chosenOption = themeOptions[Math.floor(Math.random() * themeOptions.length)];
        }

        if (!chosenOption && layerKey !== 'background') {
          const whiteOptions = allOptions.filter(key => key.includes('white'));
          if (whiteOptions.length > 0) {
            chosenOption = whiteOptions[Math.floor(Math.random() * whiteOptions.length)];
          }
        }
        
        if (!chosenOption) {
          const nonNoneOptions = allOptions.filter(key => key !== 'none');
          if (nonNoneOptions.length > 0) {
            chosenOption = nonNoneOptions[Math.floor(Math.random() * nonNoneOptions.length)];
          } else {
            chosenOption = allOptions[0];
          }
        }
        newConfig[layerKey] = chosenOption;
      }
    });

    // 4. Final pass to enforce special rules.
    
    // THE FIX: New rule for matching Onesie hands to the skin animal/color
    if (skinTheme === 'onesie') {
      const ONESIE_HAND_COLOR_MAP = {
        duck: 'yellow', fox: 'orange', frog: 'green', turtle: 'green', dino: 'green',
        wolf: 'grey', seal: 'grey', goat: 'grey', bear: 'brown', bull: 'brown',
        cat: 'white', chicken: 'white'
      };
      const animal = Object.keys(ONESIE_HAND_COLOR_MAP).find(animal => selectedSkinKey.includes(animal));
      
      if (animal) {
        const targetColor = ONESIE_HAND_COLOR_MAP[animal];
        
        const leftHandOptions = Object.keys(TRAIT_MANIFEST.hand_left.options);
        const matchingLeft = leftHandOptions.filter(k => k.startsWith('onesie') && k.endsWith(targetColor));
        if (matchingLeft.length > 0) {
          newConfig.hand_left = matchingLeft[Math.floor(Math.random() * matchingLeft.length)];
        }
        
        const rightHandOptions = Object.keys(TRAIT_MANIFEST.hand_right.options);
        const matchingRight = rightHandOptions.filter(k => k.startsWith('onesie') && k.endsWith(targetColor));
        if (matchingRight.length > 0) {
          newConfig.hand_right = matchingRight[Math.floor(Math.random() * matchingRight.length)];
        }
      }
    }

    const leftHandTrait = newConfig.hand_left || '';
    const rightHandTrait = newConfig.hand_right || '';

    if (leftHandTrait.includes('muscles') && !rightHandTrait.includes('muscles')) {
      const targetRightKey = leftHandTrait.replace('left', 'right');
      if (TRAIT_MANIFEST.hand_right.options[targetRightKey]) {
        newConfig.hand_right = targetRightKey;
      }
    } else if (rightHandTrait.includes('muscles') && !leftHandTrait.includes('muscles')) {
      const targetLeftKey = rightHandTrait.replace('right', 'left');
      if (TRAIT_MANIFEST.hand_left.options[targetLeftKey]) {
        newConfig.hand_left = targetLeftKey;
      }
    }
    
    setStaticConfig(newConfig);
  };

  const handleRandomizeClick = () => {
    if (randomizeMode === 'cohesive') {
      handleCohesiveRandomize();
    } else {
      handleRandomizeStatic();
    }
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

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: '/gif.worker.js'
    });

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
        
        {/* --- Static Composer Tab --- */}
        <TabsContent value="composer">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 bg-card/80">
              <CardHeader>
                <CardTitle className="text-2xl tracking-widest text-center">GHOST FACTORY</CardTitle>
                <CardDescription className="text-center">Static Composer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {UI_ORDER.map(layerKey => (
                  <TraitSelector
                    key={layerKey}
                    layer={layerKey}
                    trait={TRAIT_MANIFEST[layerKey]}
                    currentSelection={staticConfig[layerKey] || ''}
                    onSelect={handleSelectStaticTrait}
                  />
                ))}
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-center space-x-2 pb-2">
                    <Label htmlFor="randomize-mode">Fully Random</Label>
                    <Switch 
                      id="randomize-mode" 
                      onCheckedChange={(checked) => setRandomizeMode(checked ? 'cohesive' : 'full')} 
                    />
                    <Label htmlFor="randomize-mode">Semi-Cohesive</Label>
                  </div>
                  <Button onClick={handleRandomizeClick} variant="holographic" className="w-full text-lg">Randomize</Button>
                  <Button onClick={handleDownload} variant="outline" className="w-full text-lg">Download PNG</Button>
                </div>
              </CardContent>
            </Card>
            <div className="lg:col-span-2 w-full aspect-square p-2 rounded-lg border bg-black/20">
              <div className="relative w-full h-full">
                {LAYER_ORDER.map(layerKey => {
                  const optionKey = staticConfig[layerKey];
                  if (!optionKey) return null;
                  const url = TRAIT_MANIFEST[layerKey]?.options[optionKey];
                  return url ? (
                    <img key={layerKey} src={url} alt={`${layerKey} - ${optionKey}`} className="absolute top-0 left-0 w-full h-full" />
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* --- Animation Studio Tab --- */}
        <TabsContent value="animator">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-1 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-widest text-center">GHOST FACTORY</CardTitle>
                  <CardDescription className="text-center">Animation Studio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {UI_ORDER.map(layerKey => (
                    <TraitSelector
                      key={layerKey}
                      layer={layerKey}
                      trait={TRAIT_MANIFEST[layerKey]}
                      currentSelection={activeFrameConfig[layerKey] || ''}
                      onSelect={handleUpdateFrame}
                    />
                  ))}
                  <div className="pt-4 space-y-3">
                    <Button onClick={handleAddFrame} variant="outline" className="w-full">Add New Frame</Button>
                    <Button onClick={handleGenerateGif} variant="outline" className="w-full" disabled={isGenerating}>
                      {isGenerating ? 'Generating...' : 'Generate GIF'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 flex flex-col gap-4">
                <AnimationPreview 
                  frames={frames.map(f => f.config)} 
                  fps={fps} 
                  isPlaying={isPlaying}
                  activeFrameIndex={activeFrameIndex}
                />
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4 border rounded-lg bg-black/20">
                  <Button variant="outline" size="icon" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Slider defaultValue={[10]} min={1} max={30} step={1} onValueChange={(value) => setFps(value[0])} />
                  <span className="text-sm font-medium w-16 text-center">{fps} FPS</span>
                </div>
                <SortableContext items={frames} strategy={horizontalListSortingStrategy}>
                  <FrameTimeline 
                    frames={frames} 
                    activeFrameIndex={activeFrameIndex} 
                    onSelect={setActiveFrameIndex} 
                    onDuplicate={handleDuplicateFrame} 
                    onDelete={handleDeleteFrame} 
                  />
                </SortableContext>
              </div>
            </div>
          </DndContext>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;