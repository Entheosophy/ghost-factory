/* // src/App.jsx */
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useGhostConfig } from './hooks/useGhostConfig';
import { useAnimation } from './hooks/useAnimation';
import { StaticComposerPanel } from '@/components/StaticComposerPanel';
import { AnimationStudioPanel } from '@/components/AnimationStudioPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function App() {
  // Hook for all static ghost composition logic
  const { staticConfig, ...ghostConfigProps } = useGhostConfig();
  
  // Hook for all animation studio logic
  const animation = useAnimation(staticConfig);
  
  // dnd-kit sensor configuration
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4 text-foreground font-pixel overflow-x-hidden">
      <Tabs defaultValue="composer" className="w-full max-w-7xl mx-auto flex flex-col gap-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2">
          <TabsTrigger value="composer">Static Composer</TabsTrigger>
          <TabsTrigger value="animator">Animation Studio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="composer">
          <StaticComposerPanel
            staticConfig={staticConfig}
            {...ghostConfigProps}
          />
        </TabsContent>

        <TabsContent value="animator">
          <AnimationStudioPanel
            dndSensors={sensors}
            onDragEnd={animation.onDragEnd}
            activeFrameConfig={animation.activeFrameConfig}
            onUpdateFrame={animation.onUpdateFrame}
            onAddFrame={animation.onAddFrame}
            onGenerateGif={animation.onGenerateGif}
            isGenerating={animation.isGenerating}
            animationProps={{
              frames: animation.frames.map(f => f.config),
              fps: animation.fps,
              isPlaying: animation.isPlaying,
              activeFrameIndex: animation.activeFrameIndex
            }}
            onPlayPause={animation.onPlayPause}
            onFpsChange={animation.onFpsChange}
            timelineProps={{
              frames: animation.frames,
              activeFrameIndex: animation.activeFrameIndex,
              onSelect: animation.onSelectFrame,
              onDuplicate: animation.onDuplicateFrame,
              onDelete: animation.onDeleteFrame
            }}
            onNftLoad={ghostConfigProps.onNftLoad}
            isNftLoading={ghostConfigProps.isNftLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;