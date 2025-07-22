/* // src/components/AnimationStudioPanel.jsx */
import React from 'react';
import { TRAIT_MANIFEST, UI_ORDER } from '@/data/traits';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimationPreview } from '@/components/AnimationPreview';
import { FrameTimeline } from '@/components/FrameTimeline';
import { TraitSelector } from '@/components/TraitSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from "@/components/ui/slider";
import { Play, Pause } from 'lucide-react';
import NftLoader from '@/components/NftLoader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AnimationStudioPanel({
  dndSensors,
  onDragEnd,
  activeFrameConfig,
  onUpdateFrame,
  onAddFrame,
  onGenerateGif,
  isGenerating,
  animationProps,
  onPlayPause,
  onFpsChange,
  timelineProps,
  onNftLoad,
  isNftLoading
}) {
  return (
    <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 bg-card/80">
          <CardHeader>
            <CardTitle className="text-2xl tracking-widest text-center">GHOST FACTORY</CardTitle>
            <CardDescription className="text-center">Animation Studio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-b border-dashed border-border pb-4">
              <NftLoader onNftLoad={onNftLoad} isLoading={isNftLoading} />
            </div>

            {Object.keys(activeFrameConfig).length > 0 ? (
              UI_ORDER.map(layerKey => (
                <TraitSelector
                  key={layerKey}
                  layer={layerKey}
                  trait={TRAIT_MANIFEST[layerKey]}
                  currentSelection={activeFrameConfig[layerKey] || ''}
                  onSelect={onUpdateFrame}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground pt-4">
                Select a frame to edit its traits, or add a new one.
              </div>
            )}
            
            <div className="pt-4 space-y-3">
              <Button onClick={onAddFrame} variant="outline" className="w-full">Add New Frame</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={isGenerating || timelineProps.frames.length === 0}>
                    {isGenerating ? 'Generating...' : 'Generate GIF'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] font-pixel" align="end">
                  <DropdownMenuItem onClick={() => onGenerateGif(1410)}>Large (1410px)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateGif(470)}>Medium (470px)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateGif(141)}>Small (141px)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-2 flex flex-col gap-4">
          <AnimationPreview {...animationProps} />
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4 border rounded-lg bg-black/20">
            <Button variant="outline" size="icon" onClick={onPlayPause} disabled={timelineProps.frames.length === 0}>
              {animationProps.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Slider defaultValue={[10]} min={1} max={30} step={1} onValueChange={(value) => onFpsChange(value[0])} />
            <span className="text-sm font-medium w-16 text-center">{animationProps.fps} FPS</span>
          </div>
          <SortableContext items={timelineProps.frames} strategy={horizontalListSortingStrategy}>
            <FrameTimeline {...timelineProps} />
          </SortableContext>
        </div>
      </div>
    </DndContext>
  );
}