/* // src/App.jsx */
import { useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { useGhostConfig } from './hooks/useGhostConfig';
import { useAnimation } from './hooks/useAnimation';
import { StaticComposerPanel } from '@/components/StaticComposerPanel';
import { AnimationStudioPanel } from '@/components/AnimationStudioPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TRAIT_MANIFEST, COHESIVE_THEMES } from './data/traits';

function App() {
  const [activeTab, setActiveTab] = useState('composer');
  const [isNftLoading, setIsNftLoading] = useState(false);
  
  const ghostConfig = useGhostConfig();
  const animation = useAnimation(ghostConfig.staticConfig);
  
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleLoadNft = async (serial) => {
    if (!serial) return;
    setIsNftLoading(true);
    try {
      const tokenId = '0.0.878200';
      const mirrorNodeUrl = `https://mainnet-public.mirrornode.hedera.com/api/v1/tokens/${tokenId}/nfts/${serial}`;
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
        const cleanValue = rawAttributes[layerKey]?.replace(/ /g, '_');
        if (!cleanValue || cleanValue === 'none') {
          newConfig[layerKey] = TRAIT_MANIFEST[layerKey].options.none ? 'none' : null;
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
        newConfig[layerKey] = foundKey || (TRAIT_MANIFEST[layerKey].options.none ? 'none' : null);
      });
      if (activeTab === 'composer') {
        ghostConfig.setStaticConfig(newConfig);
      } else if (activeTab === 'animator') {
        animation.replaceCurrentFrame(newConfig);
      }
    } catch (error) {
      console.error("Failed to load NFT:", error);
      alert(error.message);
    } finally {
      setIsNftLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-4 text-foreground font-pixel overflow-x-hidden">
      <Tabs defaultValue="composer" onValueChange={setActiveTab} className="w-full max-w-7xl mx-auto flex flex-col gap-4">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2">
          <TabsTrigger value="composer">Static Composer</TabsTrigger>
          <TabsTrigger value="animator">Animation Studio</TabsTrigger>
        </TabsList>
        <TabsContent value="composer">
          <StaticComposerPanel {...ghostConfig} onNftLoad={handleLoadNft} isNftLoading={isNftLoading} />
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
            onNftLoad={handleLoadNft}
            isNftLoading={isNftLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;