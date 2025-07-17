/* // src/App.jsx */
import { useState, useEffect, useMemo } from 'react';
import { TRAIT_MANIFEST, LAYER_ORDER } from './data/traits';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import GIF from 'gif.js';

// Import Components
import { AnimationPreview } from '@/components/AnimationPreview';
import { FrameTimeline } from '@/components/FrameTimeline';
import { TraitSelector } from '@/components/TraitSelector'; // Import the new component
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from "@/components/ui/slider"
import { Play, Pause } from 'lucide-react';

function App() {
  // State for Static Composer
  const [staticConfig, setStaticConfig] = useState({});
  
  // State for Animation Studio
  const [frames, setFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [fps, setFps] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Configure a sensor that requires movement before starting a drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

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
      <Tabs defaultValue="composer" className="w-full max-w-7xl mx-auto">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="composer">Static Composer</TabsTrigger>
          <TabsTrigger value="animator">Animation Studio</TabsTrigger>
        </TabsList>
        
        {/* --- Static Composer Tab --- */}
        <TabsContent value="composer">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            <Card className="lg:col-span-1 bg-card/80">
              <CardHeader>
                <CardTitle className="text-2xl tracking-widest text-center">GHOST FACTORY</CardTitle>
                <CardDescription className="text-center">Static Composer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {LAYER_ORDER.map(layerKey => (
                  <TraitSelector
                    key={layerKey}
                    layer={layerKey}
                    trait={TRAIT_MANIFEST[layerKey]}
                    currentSelection={staticConfig[layerKey] || ''}
                    onSelect={handleSelectStaticTrait}
                  />
                ))}
                <div className="pt-4 space-y-3">
                  <Button onClick={handleRandomizeStatic} variant="holographic" className="w-full text-lg">Randomize</Button>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
              <Card className="lg:col-span-1 bg-card/80">
                <CardHeader>
                  <CardTitle className="text-2xl tracking-widest text-center">GHOST FACTORY</CardTitle>
                  <CardDescription className="text-center">Animation Studio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {LAYER_ORDER.map(layerKey => (
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