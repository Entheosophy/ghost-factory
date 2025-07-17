// src/App.jsx
import { useState, useEffect, useMemo } from 'react';
import { TRAIT_MANIFEST, LAYER_ORDER } from './data/traits';

// Import shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper function to create a clean display name from a trait key
function formatTraitName(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const TraitSelector = ({ layer, trait, currentSelection, onSelect }) => {
  const sortedOptions = useMemo(() => {
    const keys = Object.keys(trait.options);
    const noneKey = keys.find(k => k.toLowerCase() === 'none');
    const otherKeys = keys.filter(k => k.toLowerCase() !== 'none').sort();
    return noneKey ? [noneKey, ...otherKeys] : otherKeys;
  }, [trait.options]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{trait.label}</label>
      <Select onValueChange={(value) => onSelect(layer, value)} value={currentSelection}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${trait.label}...`} />
        </SelectTrigger>
        <SelectContent className="border bg-popover font-pixel">
          {sortedOptions.map(optionKey => (
            <SelectItem key={optionKey} value={optionKey}>
              {formatTraitName(optionKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


function App() {
  const [currentConfig, setCurrentConfig] = useState({});

  // The slow preloader and related 'isLoaded' and 'status' states have been removed.
  useEffect(() => {
    // Randomize the character on the initial load.
    handleRandomize();
  }, []);

  const handleSelectTrait = (layer, optionKey) => {
    setCurrentConfig(prevConfig => ({ ...prevConfig, [layer]: optionKey }));
  };

  const handleRandomize = () => {
    const newConfig = {};
    LAYER_ORDER.forEach(layer => {
      const trait = TRAIT_MANIFEST[layer];
      if (trait) {
        const options = Object.keys(trait.options);
        newConfig[layer] = options[Math.floor(Math.random() * options.length)];
      }
    });
    setCurrentConfig(newConfig);
  };

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const CANVAS_SIZE = 1410;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const imagesToDraw = LAYER_ORDER.map(layer => {
      const url = TRAIT_MANIFEST[layer]?.options[currentConfig[layer]];
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

  return (
    // The inline style has been removed and overflow-x-hidden was added.
    <div
      className="flex flex-col lg:flex-row items-center justify-center min-h-screen p-4 gap-8 text-foreground font-pixel overflow-x-hidden"
    >
      <Tabs defaultValue="composer" className="w-full max-w-7xl mx-auto">
        {/* The grid layout is now responsive for mobile. */}
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
          <TabsTrigger value="composer">Static Composer</TabsTrigger>
          <TabsTrigger value="animator" disabled>Animation Studio</TabsTrigger>
        </TabsList>
        <TabsContent value="composer">
          {/* Layout defaults to 1 column, switches to 3 on large screens. */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
            <Card className="lg:col-span-1 bg-card/80">
              <CardHeader>
                <CardTitle className="text-2xl tracking-widest text-center">GHOST FACTORY</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {LAYER_ORDER.map(layerKey => {
                  const trait = TRAIT_MANIFEST[layerKey];
                  return trait ? (
                    <TraitSelector
                      key={layerKey}
                      layer={layerKey}
                      trait={trait}
                      currentSelection={currentConfig[layerKey] || ''}
                      onSelect={handleSelectTrait}
                    />
                  ) : null;
                })}
                <div className="pt-4 space-y-3">
                  {/* The 'disabled' prop has been removed from the buttons. */}
                  <Button
                    onClick={handleRandomize}
                    variant="holographic"
                    className="w-full text-lg"
                  >
                    Randomize
                  </Button>
                  <Button onClick={handleDownload} variant="outline" className="w-full text-lg">
                    Download PNG
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 w-full aspect-square p-2 rounded-lg border bg-black/20">
              <div className="relative w-full h-full">
                {LAYER_ORDER.map(layerKey => {
                  const optionKey = currentConfig[layerKey];
                  if (!optionKey) return null;
                  const url = TRAIT_MANIFEST[layerKey]?.options[optionKey];
                  return url ? (
                    <img
                      key={layerKey}
                      src={url}
                      alt={`${layerKey} - ${optionKey}`}
                      className="absolute top-0 left-0 w-full h-full"
                    />
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="animator">
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Animation Studio coming soon...</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;