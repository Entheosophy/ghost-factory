/* // src/hooks/useAnimation.js */
import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import GIF from 'gif.js';
import { TRAIT_MANIFEST } from '@/data/traits';
import { getDisplayOrder } from '@/lib/traitUtils';

export function useAnimation(staticConfig) {
  const [frames, setFrames] = useState([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [fps, setFps] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddFrame = useCallback((config) => {
    const newConfig = config || (frames.length > 0 ? { ...frames[activeFrameIndex].config } : staticConfig);
    const newFrame = { id: self.crypto.randomUUID(), config: newConfig };
    setFrames(currentFrames => [...currentFrames, newFrame]);
    setActiveFrameIndex(frames.length);
  }, [frames, activeFrameIndex, staticConfig]);

  const replaceCurrentFrame = useCallback((newConfig) => {
    if (frames.length === 0 || activeFrameIndex < 0) {
      handleAddFrame(newConfig);
    } else {
      setFrames(currentFrames => {
        const newFrames = [...currentFrames];
        newFrames[activeFrameIndex].config = newConfig;
        return newFrames;
      });
    }
  }, [frames, activeFrameIndex, handleAddFrame]);

  const handleUpdateFrame = useCallback((layer, optionKey) => {
    if (frames.length === 0) return;
    setFrames(currentFrames => {
      const newFrames = [...currentFrames];
      newFrames[activeFrameIndex].config = { ...newFrames[activeFrameIndex].config, [layer]: optionKey };
      return newFrames;
    });
  }, [frames.length, activeFrameIndex]);

  const handleDuplicateFrame = useCallback((index) => {
    const frameToDuplicate = { ...frames[index], id: self.crypto.randomUUID() };
    setFrames(currentFrames => {
      const newFrames = [...currentFrames.slice(0, index + 1), frameToDuplicate, ...currentFrames.slice(index + 1)];
      setActiveFrameIndex(index + 1);
      return newFrames;
    });
  }, [frames]);

  const handleDeleteFrame = useCallback((index) => {
    setFrames(currentFrames => {
      const newFrames = currentFrames.filter((_, i) => i !== index);
      setActiveFrameIndex(prevIndex => Math.max(0, Math.min(prevIndex, newFrames.length - 1)));
      return newFrames;
    });
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setFrames((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        setActiveFrameIndex(newIndex);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, []);

  const handleGenerateGif = useCallback(async (size = 470) => {
    if (frames.length === 0) return;
    setIsGenerating(true);
    const gif = new GIF({ workers: 2, quality: 10, workerScript: '/gif.worker.js' });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;
    for (const frame of frames) {
      const displayOrder = getDisplayOrder(frame.config);
      const imagesToDraw = displayOrder.map(layer => {
        const url = TRAIT_MANIFEST[layer]?.options[frame.config[layer]];
        return url ? new Promise(resolve => {
          const img = new Image();
          img.src = url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        }) : Promise.resolve(null);
      });
      const loadedImages = await Promise.all(imagesToDraw);
      ctx.clearRect(0, 0, size, size);
      loadedImages.forEach(img => {
        if (img) ctx.drawImage(img, 0, 0, size, size);
      });
      gif.addFrame(canvas, { copy: true, delay: 1000 / fps });
    }
    gif.on('finished', (blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ghost-animation-${size}px.gif`;
      link.click();
      setIsGenerating(false);
    });
    gif.render();
  }, [frames, fps]);

  const activeFrameConfig = frames[activeFrameIndex]?.config || {};
  
  return {
    frames,
    activeFrameIndex,
    activeFrameConfig,
    fps,
    isPlaying,
    isGenerating,
    replaceCurrentFrame,
    onUpdateFrame: handleUpdateFrame,
    onAddFrame: () => handleAddFrame(null),
    onDuplicateFrame: handleDuplicateFrame,
    onDeleteFrame: handleDeleteFrame,
    onDragEnd: handleDragEnd,
    onGenerateGif: handleGenerateGif,
    onSelectFrame: setActiveFrameIndex,
    onFpsChange: setFps,
    onPlayPause: () => setIsPlaying(!isPlaying),
  };
}