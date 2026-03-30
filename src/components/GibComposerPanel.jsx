// /Users/entheos/Documents/Ghost-Factory/src/components/GibComposerPanel.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TRAIT_MANIFEST } from '@/data/traits';
import { TraitSelector } from '@/components/TraitSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const GIB_TEXT = '༼ つ ◕_◕ ༽つ';
const GIB_FONT_STACK = '"Noto Sans Tibetan", "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", "Arial Unicode MS", sans-serif';
const PREVIEW_SIZE = 1024;
const BASE_GIB_PLACEMENT = {
  offsetX: 79,
  offsetY: -175,
  scale: 0.48,
};
const GIB_COLOR_PRESETS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
];

const DEFAULT_GIB_CONFIG = {
  background: 'none',
  head: 'none',
  scale: 0,
  offsetX: 0,
  offsetY: 0,
  padding: 100,
  color: '#ffffff',
};

function buildGibSvgMarkup({ scale, color }) {
  const textX = 512 + BASE_GIB_PLACEMENT.offsetX;
  const textY = 600 + BASE_GIB_PLACEMENT.offsetY;
  const fontSize = 196 * (BASE_GIB_PLACEMENT.scale + scale);
  const escapedFontStack = GIB_FONT_STACK.replace(/"/g, '&quot;');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
      <text
        x='${textX}'
        y='${textY}'
        text-anchor='middle'
        dominant-baseline='middle'
        font-family="${escapedFontStack}"
        font-size='${fontSize}'
        font-weight='700'
        fill='${color}'
        letter-spacing='0'
      >${GIB_TEXT}</text>
    </svg>
  `.trim();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = src;
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
  });
}

function findOpaqueBounds(context, size) {
  const { data } = context.getImageData(0, 0, size, size);
  let minX = size;
  let minY = size;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const alpha = data[(y * size + x) * 4 + 3];
      if (alpha === 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX === -1 || maxY === -1) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function getSquareCrop(bounds, size, padding) {
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
  const paddedWidth = width + padding * 2;
  const paddedHeight = height + padding * 2;
  const sourceSize = Math.min(size, Math.max(paddedWidth, paddedHeight));
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  let sourceX = Math.round(centerX - sourceSize / 2);
  let sourceY = Math.round(centerY - sourceSize / 2);

  sourceX = Math.max(0, Math.min(sourceX, size - sourceSize));
  sourceY = Math.max(0, Math.min(sourceY, size - sourceSize));

  return { sourceX, sourceY, sourceSize };
}

async function renderCompositeSquare({
  backgroundImageUrl,
  gibSvgUrl,
  headImageUrl,
  padding,
  offsetX,
  offsetY,
  outputSize = PREVIEW_SIZE,
}) {
  const subjectCanvas = document.createElement('canvas');
  const subjectContext = subjectCanvas.getContext('2d', { willReadFrequently: true });

  subjectCanvas.width = PREVIEW_SIZE;
  subjectCanvas.height = PREVIEW_SIZE;
  subjectContext.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

  const [backgroundImage, gibImage, headImage] = await Promise.all([
    backgroundImageUrl ? loadImage(backgroundImageUrl) : Promise.resolve(null),
    loadImage(gibSvgUrl),
    headImageUrl ? loadImage(headImageUrl) : Promise.resolve(null),
  ]);

  if (gibImage) {
    subjectContext.drawImage(gibImage, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
  }

  if (headImage) {
    subjectContext.drawImage(headImage, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
  }

  const bounds = findOpaqueBounds(subjectContext, PREVIEW_SIZE);
  if (!bounds) return null;

  const { sourceX, sourceY, sourceSize } = getSquareCrop(bounds, PREVIEW_SIZE, padding);
  const outputCanvas = document.createElement('canvas');
  const outputContext = outputCanvas.getContext('2d');
  const destinationSize = Math.max(1, outputSize - padding * 2);
  const centeredX = (outputSize - destinationSize) / 2;
  const centeredY = (outputSize - destinationSize) / 2;

  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  outputContext.clearRect(0, 0, outputSize, outputSize);

  if (backgroundImage) {
    outputContext.drawImage(backgroundImage, 0, 0, outputSize, outputSize);
  }

  outputContext.drawImage(
    subjectCanvas,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    centeredX + offsetX,
    centeredY + offsetY,
    destinationSize,
    destinationSize,
  );

  return outputCanvas.toDataURL('image/png');
}

export function GibComposerPanel() {
  const [config, setConfig] = useState(DEFAULT_GIB_CONFIG);
  const [previewUrl, setPreviewUrl] = useState(null);

  const gibSvgMarkup = useMemo(() => buildGibSvgMarkup(config), [config]);
  const gibSvgUrl = useMemo(
    () => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(gibSvgMarkup)}`,
    [gibSvgMarkup],
  );

  const backgroundImageUrl = TRAIT_MANIFEST.background.options[config.background];
  const headImageUrl = TRAIT_MANIFEST.head.options[config.head];

  useEffect(() => {
    let isActive = true;

    renderCompositeSquare({
      backgroundImageUrl,
      gibSvgUrl,
      headImageUrl,
      padding: config.padding,
      offsetX: config.offsetX,
      offsetY: config.offsetY,
      outputSize: PREVIEW_SIZE,
    }).then((dataUrl) => {
      if (isActive) {
        setPreviewUrl(dataUrl);
      }
    });

    return () => {
      isActive = false;
    };
  }, [backgroundImageUrl, config.offsetX, config.offsetY, config.padding, gibSvgUrl, headImageUrl]);

  const updateConfig = useCallback((key, value) => {
    setConfig((currentConfig) => ({ ...currentConfig, [key]: value }));
  }, []);

  const handleTraitSelect = useCallback((layer, optionKey) => {
    updateConfig(layer, optionKey);
  }, [updateConfig]);

  const handleColorInput = useCallback((event) => {
    updateConfig('color', event.target.value);
  }, [updateConfig]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_GIB_CONFIG);
  }, []);

  const handleDownload = useCallback(async () => {
    const exportUrl = await renderCompositeSquare({
      backgroundImageUrl,
      gibSvgUrl,
      headImageUrl,
      padding: config.padding,
      offsetX: config.offsetX,
      offsetY: config.offsetY,
      outputSize: PREVIEW_SIZE,
    });

    if (!exportUrl) return;

    const link = document.createElement('a');
    link.download = `gib-${config.head || 'none'}.png`;
    link.href = exportUrl;
    link.click();
  }, [backgroundImageUrl, config.head, config.offsetX, config.offsetY, config.padding, gibSvgUrl, headImageUrl]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl tracking-widest text-center">GIB LAB</CardTitle>
          <CardDescription className="text-center">༼ つ ◕_◕ ༽つ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <TraitSelector
            layer="background"
            trait={TRAIT_MANIFEST.background}
            currentSelection={config.background}
            onSelect={handleTraitSelect}
          />
          <TraitSelector
            layer="head"
            trait={TRAIT_MANIFEST.head}
            currentSelection={config.head}
            onSelect={handleTraitSelect}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <Label>Gib Color</Label>
              <span className="text-muted-foreground uppercase">{config.color}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GIB_COLOR_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  type="button"
                  variant={config.color === preset.value ? 'secondary' : 'outline'}
                  onClick={() => updateConfig('color', preset.value)}
                  className="w-full"
                >
                  {preset.label}
                </Button>
              ))}
              <Input
                type="color"
                value={config.color}
                onChange={handleColorInput}
                className="h-10 w-full cursor-pointer p-1"
                aria-label="Pick gib color"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Scale</Label>
              <span className="text-muted-foreground">{config.scale >= 0 ? '+' : ''}{config.scale.toFixed(2)}x</span>
            </div>
            <Slider
              value={[config.scale]}
              min={-0.18}
              max={0.7}
              step={0.01}
              onValueChange={([value]) => updateConfig('scale', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Horizontal</Label>
              <span className="text-muted-foreground">{config.offsetX >= 0 ? '+' : ''}{config.offsetX}px</span>
            </div>
            <Slider
              value={[config.offsetX]}
              min={-160}
              max={160}
              step={1}
              onValueChange={([value]) => updateConfig('offsetX', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Vertical</Label>
              <span className="text-muted-foreground">{config.offsetY >= 0 ? '+' : ''}{config.offsetY}px</span>
            </div>
            <Slider
              value={[config.offsetY]}
              min={-160}
              max={160}
              step={1}
              onValueChange={([value]) => updateConfig('offsetY', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Crop Padding</Label>
              <span className="text-muted-foreground">{config.padding}px</span>
            </div>
            <Slider
              value={[config.padding]}
              min={0}
              max={240}
              step={1}
              onValueChange={([value]) => updateConfig('padding', value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
            <Button onClick={handleDownload} variant="holographic">
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="w-full aspect-square p-4 rounded-lg border bg-black/20">
          <div className="relative h-full w-full overflow-hidden rounded-md bg-[linear-gradient(135deg,#111827_0%,#0f172a_50%,#1e293b_100%)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff10_0%,transparent_62%)]" />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={`Composite preview ${config.head}`}
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Rendering preview...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
