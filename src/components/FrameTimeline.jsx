/* // src/components/FrameTimeline.jsx */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TRAIT_MANIFEST, LAYER_ORDER } from '@/data/traits';
import { Button } from '@/components/ui/button';
import { X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

// A small component to render a single frame's thumbnail
function FramePreview({ config }) {
  if (!config) return null;
  return (
    <div className="relative w-full h-full bg-slate-800 rounded-md overflow-hidden">
      {LAYER_ORDER.map(layerKey => {
        const optionKey = config[layerKey];
        if (!optionKey) return null;
        const url = TRAIT_MANIFEST[layerKey]?.options[optionKey];
        return url ? (
          <img
            key={layerKey}
            src={url}
            alt=""
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
        ) : null;
      })}
    </div>
  );
}

// A component that makes our frames draggable
function SortableFrame({ frame, index, activeFrameIndex, onSelect, onDuplicate, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: frame.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative flex-shrink-0">
      <Button
        variant="outline"
        className={cn(
          "w-24 h-24 p-1 border-2 border-border cursor-grab active:cursor-grabbing transition-opacity",
          // THE FIX: Use opacity for a clear, non-conflicting visual highlight.
          activeFrameIndex === index ? "opacity-100" : "opacity-60"
        )}
        onClick={() => onSelect(index)}
        {...listeners}
      >
        <FramePreview config={frame.config} />
      </Button>
      <div className="absolute top-0 right-0 m-1 flex space-x-1 z-10">
        <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => onDelete(index)}>
          <X className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-6 w-6" onClick={() => onDuplicate(index)}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}


export function FrameTimeline({ frames, activeFrameIndex, onSelect, onDuplicate, onDelete }) {
  return (
    <div className="w-full bg-black/20 border rounded-lg p-2">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {frames.map((frame, index) => (
          <SortableFrame
            key={frame.id}
            frame={frame}
            index={index}
            activeFrameIndex={activeFrameIndex}
            onSelect={onSelect}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}