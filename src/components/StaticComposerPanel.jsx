/* // src/components/StaticComposerPanel.jsx */
import React from 'react';
import { TRAIT_MANIFEST, LAYER_ORDER, UI_ORDER } from '@/data/traits';
import { TraitSelector } from '@/components/TraitSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Unlock } from 'lucide-react';
import NftLoader from '@/components/NftLoader';
import ActionPanel from './ActionPanel'; // Import the new component

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
      {/* Left Panel: Controls */}
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
                {lockedTraits[layerKey] 
                  ? <Lock className="h-4 w-4 text-primary" /> 
                  : <Unlock className="h-4 w-4 text-muted-foreground" />
                }
              </Button>
            </div>
          ))}
          {/* Action buttons are now removed from this card */}
        </CardContent>
      </Card>
      
      {/* Right side: Preview and Actions */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="w-full aspect-square p-2 rounded-lg border bg-black/20">
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

        <ActionPanel 
          randomizeMode={randomizeMode}
          onModeChange={onModeChange}
          onRandomize={onRandomize}
          onDownload={onDownload}
        />
      </div>
    </div>
  );
}