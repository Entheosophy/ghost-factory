/* // src/components/StaticComposerPanel.jsx */
import React from 'react';
import { TRAIT_MANIFEST, LAYER_ORDER, UI_ORDER } from '@/data/traits';
import { TraitSelector } from '@/components/TraitSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Lock, Unlock } from 'lucide-react';
import NftLoader from '@/components/NftLoader';

export function StaticComposerPanel({
  staticConfig,
  lockedTraits,
  randomizeMode,
  onTraitSelect,
  onToggleLock,
  onRandomize,
  onDownload,
  onModeChange,
  onNftLoad,
  isNftLoading
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl tracking-widest text-center">GHOST FACTORY</CardTitle>
          <CardDescription className="text-center">Static Composer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b border-dashed border-border pb-4">
            <NftLoader onNftLoad={onNftLoad} isLoading={isNftLoading} />
          </div>
          
          {UI_ORDER.map(layerKey => (
            <div key={layerKey} className="flex items-center gap-2">
              <div className="flex-1">
                <TraitSelector
                  layer={layerKey}
                  trait={TRAIT_MANIFEST[layerKey]}
                  currentSelection={staticConfig[layerKey] || ''}
                  onSelect={onTraitSelect}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleLock(layerKey)}
                className="shrink-0 mt-6"
                aria-label={lockedTraits[layerKey] ? `Unlock ${layerKey}` : `Lock ${layerKey}`}
              >
                {lockedTraits[layerKey] ? <Lock className="h-4 w-4 text-primary" /> : <Unlock className="h-4 w-4" />}
              </Button>
            </div>
          ))}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-center space-x-2 pb-2">
              <Label htmlFor="randomize-mode">Fully Random</Label>
              <Switch 
                id="randomize-mode" 
                checked={randomizeMode === 'cohesive'}
                onCheckedChange={(checked) => onModeChange(checked ? 'cohesive' : 'full')} 
              />
              <Label htmlFor="randomize-mode">Semi-Cohesive</Label>
            </div>
            <Button onClick={onRandomize} variant="holographic" className="w-full text-lg">Randomize</Button>
            <Button onClick={onDownload} variant="outline" className="w-full text-lg">Download PNG</Button>
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
  );
}