/* // src/components/AnimationPreview.jsx */
import React, { useState, useEffect } from 'react';
import { TRAIT_MANIFEST } from '@/data/traits';

export function AnimationPreview({ frames, fps, isPlaying, activeFrameIndex }) {
  const [playbackFrameIndex, setPlaybackFrameIndex] = useState(0);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      // If paused, ensure the playback index resets or stays in sync if needed
      setPlaybackFrameIndex(activeFrameIndex);
      return;
    }

    const interval = setInterval(() => {
      setPlaybackFrameIndex((prevIndex) => (prevIndex + 1) % frames.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isPlaying, fps, frames, activeFrameIndex]);

  // THE FIX: Decide which frame to display based on play state.
  const displayIndex = isPlaying ? playbackFrameIndex : activeFrameIndex;
  const currentFrame = frames[displayIndex] || {};

  return (
    <div className="w-full aspect-square p-2 rounded-lg border bg-black/20">
      <div className="relative w-full h-full">
        {frames.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Add a frame to begin</p>
          </div>
        ) : (
          LAYER_ORDER.map(layerKey => {
            const optionKey = currentFrame[layerKey];
            if (!optionKey) return null;
            const url = TRAIT_MANIFEST[layerKey]?.options[optionKey];
            return url ? (
              <img
                key={`${layerKey}-${displayIndex}`}
                src={url}
                alt={`${layerKey} - ${optionKey}`}
                className="absolute top-0 left-0 w-full h-full"
              />
            ) : null;
          })
        )}
      </div>
    </div>
  );
}