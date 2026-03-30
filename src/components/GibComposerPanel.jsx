// /Users/entheos/Documents/Ghost-Factory/src/components/GibComposerPanel.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TRAIT_MANIFEST } from '@/data/traits';
import { TraitSelector } from '@/components/TraitSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const GIB_FONT_STACK = '"Roboto", "Noto Sans Tibetan", "Noto Sans Symbols 2", "Segoe UI Symbol", "Apple Symbols", "Arial Unicode MS", sans-serif';
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
const GIB_VARIANTS = [
  { key: 'base', text: '༼ つ ◕_◕ ༽つ' },
  { key: 'shades', text: '༼ つ⌐■_■༽つ' },
  { key: 'flip_table', text: '༼ノ*◕_◕ ༽ノ彡┻━┻', preset: { gibScale: -0.12 } },
  { key: 'rage_flip', text: '༼┛✧Д✧ ༽┛彡┻━┻', preset: { gibScale: -0.14 } },
  { key: 'stare', text: '༼ つ ಠ_ಠ ༽つ' },
  { key: 'gun', text: '༼ つ -_◕༽︻デ═一', preset: { gibScale: -0.16, gibOffsetX: -14 } },
  { key: 'cry', text: 'ヽ༼ ಥ_ಥ ༽ﾉ' },
  { key: 'sad', text: '༼ つ ˃̣̣̥o ˂̣̣̥ ༽つ', preset: { gibScale: -0.04 } },
  { key: 'toxic', text: '༼ つ☢益☢༽つ' },
  { key: 'shrug', text: "¯\\༼ ' ◕_◕ ༽/¯", preset: { gibScale: -0.08 } },
  { key: 'angry', text: '༼ つꐦ○_○༽つ' },
  { key: 'arms_up', text: "༼ ง '◕_◕ ༽ว" },
  { key: 'coffee', text: '༼ つ ◕_◕ ༽c旦', preset: { gibScale: -0.02 } },
  { key: 'salute', text: '༼ ◕_◕ ゞ༽' },
  { key: 'sleepy', text: '༼⸝⸝ᴗ﹏ᴗ⸝⸝༽ ᶻ 𝗓 𐰁', preset: { gibScale: -0.18 } },
  { key: 'cute', text: '༼ つ •⤙• ༽つ' },
  { key: 'buff', text: "ᕙ༼ '◕益◕‶ ༽ᕗ", preset: { gibScale: -0.1 } },
  { key: 'flex', text: "༼ * '◡̀_◡́ ༽ᕤ", preset: { gibScale: -0.08 } },
  { key: 'dotti', text: 'ദ്ദി༼ ˵ ◕_◕ ˵ ༽', preset: { gibScale: -0.08 } },
  { key: 'signal', text: '—_-༼ つ ◕_◕ ༽つ', preset: { gibScale: -0.08, gibOffsetX: 12 } },
  { key: 'wide_eyes', text: '༼ つ ⚆_⚆ ༽つ' },
  { key: 'skeptical', text: '༼ つ ¬_¬ ༽つ' },
  { key: 'worried', text: '∠༼ つ ◕﹏◕ ༽つ', preset: { gibScale: -0.06 } },
  { key: 'happy', text: '༼ つ ^o^ ༽つ' },
  { key: 'starry', text: '༼ つ★‿★ ༽つ' },
  { key: 'wink', text: '༼ つ −‿◕ ༽つ' },
  { key: 'spell', text: '༼ つ ◕_◕༽つ━☆ﾟ.*･｡ﾟ', preset: { gibScale: -0.16, gibOffsetX: -18 } },
  { key: 'alchemy', text: '.🜲 ༼ つ •⤙• ༽つ', preset: { gibScale: -0.08, gibOffsetX: 8 } },
];
const DEFAULT_VARIANT_KEY = 'base';

const DEFAULT_GIB_CONFIG = {
  variant: DEFAULT_VARIANT_KEY,
  background: 'none',
  head: 'none',
  gibScale: 0,
  gibOffsetX: 0,
  gibOffsetY: 0,
  headScale: 0,
  headOffsetX: 0,
  headOffsetY: 0,
  frameOffsetX: 0,
  frameOffsetY: 0,
  padding: 24,
  color: '#ffffff',
};

function buildGibSvgMarkup({ variant, gibScale, color }) {
  const activeVariant = GIB_VARIANTS.find((entry) => entry.key === variant) || GIB_VARIANTS[0];
  const textX = 512 + BASE_GIB_PLACEMENT.offsetX;
  const textY = 600 + BASE_GIB_PLACEMENT.offsetY;
  const fontSize = 196 * (BASE_GIB_PLACEMENT.scale + gibScale);
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
      >${activeVariant.text}</text>
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

function getTrimCrop(bounds, size, padding) {
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
  const sourceWidth = Math.min(size, width + padding * 2);
  const sourceHeight = Math.min(size, height + padding * 2);

  let sourceX = Math.round(bounds.minX - padding);
  let sourceY = Math.round(bounds.minY - padding);

  sourceX = Math.max(0, Math.min(sourceX, size - sourceWidth));
  sourceY = Math.max(0, Math.min(sourceY, size - sourceHeight));

  return { sourceX, sourceY, sourceWidth, sourceHeight };
}

function drawLayer(context, image, offsetX, offsetY, scaleDelta) {
  if (!image) return;

  const scale = 1 + scaleDelta;
  const drawSize = PREVIEW_SIZE * scale;
  const centeredX = (PREVIEW_SIZE - drawSize) / 2 + offsetX;
  const centeredY = (PREVIEW_SIZE - drawSize) / 2 + offsetY;

  context.drawImage(image, centeredX, centeredY, drawSize, drawSize);
}

async function renderCompositeSquare({
  backgroundImageUrl,
  gibSvgUrl,
  headImageUrl,
  padding,
  gibOffsetX,
  gibOffsetY,
  headOffsetX,
  headOffsetY,
  headScale,
  frameOffsetX,
  frameOffsetY,
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

  drawLayer(subjectContext, gibImage, gibOffsetX, gibOffsetY, 0);
  drawLayer(subjectContext, headImage, headOffsetX, headOffsetY, headScale);

  const bounds = findOpaqueBounds(subjectContext, PREVIEW_SIZE);
  if (!bounds) return null;

  const { sourceX, sourceY, sourceSize } = getSquareCrop(bounds, PREVIEW_SIZE, padding);
  const outputCanvas = document.createElement('canvas');
  const outputContext = outputCanvas.getContext('2d');

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
    frameOffsetX,
    frameOffsetY,
    outputSize,
    outputSize,
  );

  return outputCanvas.toDataURL('image/png');
}

async function renderCompositeTrim({
  backgroundImageUrl,
  gibSvgUrl,
  headImageUrl,
  padding,
  gibOffsetX,
  gibOffsetY,
  headOffsetX,
  headOffsetY,
  headScale,
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

  drawLayer(subjectContext, gibImage, gibOffsetX, gibOffsetY, 0);
  drawLayer(subjectContext, headImage, headOffsetX, headOffsetY, headScale);

  const bounds = findOpaqueBounds(subjectContext, PREVIEW_SIZE);
  if (!bounds) return null;

  const { sourceX, sourceY, sourceWidth, sourceHeight } = getTrimCrop(bounds, PREVIEW_SIZE, padding);
  const outputCanvas = document.createElement('canvas');
  const outputContext = outputCanvas.getContext('2d');

  outputCanvas.width = sourceWidth;
  outputCanvas.height = sourceHeight;
  outputContext.clearRect(0, 0, sourceWidth, sourceHeight);

  if (backgroundImage) {
    outputContext.drawImage(
      backgroundImage,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight,
    );
  }

  outputContext.drawImage(
    subjectCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
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
      gibOffsetX: config.gibOffsetX,
      gibOffsetY: config.gibOffsetY,
      headOffsetX: config.headOffsetX,
      headOffsetY: config.headOffsetY,
      headScale: config.headScale,
      frameOffsetX: config.frameOffsetX,
      frameOffsetY: config.frameOffsetY,
      outputSize: PREVIEW_SIZE,
    }).then((dataUrl) => {
      if (isActive) {
        setPreviewUrl(dataUrl);
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    backgroundImageUrl,
    config.frameOffsetX,
    config.frameOffsetY,
    config.gibOffsetX,
    config.gibOffsetY,
    config.headOffsetX,
    config.headOffsetY,
    config.headScale,
    config.padding,
    gibSvgUrl,
    headImageUrl,
  ]);

  const updateConfig = useCallback((key, value) => {
    setConfig((currentConfig) => ({ ...currentConfig, [key]: value }));
  }, []);

  const handleTraitSelect = useCallback((layer, optionKey) => {
    updateConfig(layer, optionKey);
  }, [updateConfig]);

  const handleColorInput = useCallback((event) => {
    updateConfig('color', event.target.value);
  }, [updateConfig]);

  const handleVariantChange = useCallback((variantKey) => {
    const selectedVariant = GIB_VARIANTS.find((entry) => entry.key === variantKey);
    const preset = selectedVariant?.preset || {};

    setConfig((currentConfig) => ({
      ...currentConfig,
      variant: variantKey,
      gibScale: preset.gibScale ?? 0,
      gibOffsetX: preset.gibOffsetX ?? 0,
      gibOffsetY: preset.gibOffsetY ?? 0,
      headScale: preset.headScale ?? 0,
      headOffsetX: preset.headOffsetX ?? 0,
      headOffsetY: preset.headOffsetY ?? 0,
      frameOffsetX: 0,
      frameOffsetY: 0,
    }));
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_GIB_CONFIG);
  }, []);

  const handleDownloadSquare = useCallback(async () => {
    const exportUrl = await renderCompositeSquare({
      backgroundImageUrl,
      gibSvgUrl,
      headImageUrl,
      padding: config.padding,
      gibOffsetX: config.gibOffsetX,
      gibOffsetY: config.gibOffsetY,
      headOffsetX: config.headOffsetX,
      headOffsetY: config.headOffsetY,
      headScale: config.headScale,
      frameOffsetX: config.frameOffsetX,
      frameOffsetY: config.frameOffsetY,
      outputSize: PREVIEW_SIZE,
    });

    if (!exportUrl) return;

    const link = document.createElement('a');
    link.download = `gib-${config.head || 'none'}-square.png`;
    link.href = exportUrl;
    link.click();
  }, [
    backgroundImageUrl,
    config.frameOffsetX,
    config.frameOffsetY,
    config.gibOffsetX,
    config.gibOffsetY,
    config.head,
    config.headOffsetX,
    config.headOffsetY,
    config.headScale,
    config.padding,
    gibSvgUrl,
    headImageUrl,
  ]);

  const handleDownloadTrim = useCallback(async () => {
    const exportUrl = await renderCompositeTrim({
      backgroundImageUrl,
      gibSvgUrl,
      headImageUrl,
      padding: config.padding,
      gibOffsetX: config.gibOffsetX,
      gibOffsetY: config.gibOffsetY,
      headOffsetX: config.headOffsetX,
      headOffsetY: config.headOffsetY,
      headScale: config.headScale,
    });

    if (!exportUrl) return;

    const link = document.createElement('a');
    link.download = `gib-${config.head || 'none'}-trim.png`;
    link.href = exportUrl;
    link.click();
  }, [
    backgroundImageUrl,
    config.gibOffsetX,
    config.gibOffsetY,
    config.head,
    config.headOffsetX,
    config.headOffsetY,
    config.headScale,
    config.padding,
    gibSvgUrl,
    headImageUrl,
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 bg-card/80">
        <CardHeader>
          <CardTitle className="text-2xl tracking-widest text-center">GIB LAB</CardTitle>
          <CardDescription className="text-center font-gib">
            {(GIB_VARIANTS.find((entry) => entry.key === config.variant) || GIB_VARIANTS[0]).text}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Gib Variant</Label>
            <Select value={config.variant} onValueChange={handleVariantChange}>
              <SelectTrigger className="font-gib text-center">
                <SelectValue placeholder="Select gib variant" />
              </SelectTrigger>
              <SelectContent className="font-gib">
                {GIB_VARIANTS.map((variant) => (
                  <SelectItem key={variant.key} value={variant.key} className="justify-center pr-2 pl-2 text-center">
                    {variant.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              <Label>Gib Scale</Label>
              <span className="text-muted-foreground">{config.gibScale >= 0 ? '+' : ''}{config.gibScale.toFixed(2)}x</span>
            </div>
            <Slider
              value={[config.gibScale]}
              min={-0.18}
              max={0.7}
              step={0.01}
              onValueChange={([value]) => updateConfig('gibScale', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Gib X</Label>
              <span className="text-muted-foreground">{config.gibOffsetX >= 0 ? '+' : ''}{config.gibOffsetX}px</span>
            </div>
            <Slider
              value={[config.gibOffsetX]}
              min={-160}
              max={160}
              step={1}
              onValueChange={([value]) => updateConfig('gibOffsetX', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Gib Y</Label>
              <span className="text-muted-foreground">{config.gibOffsetY >= 0 ? '+' : ''}{config.gibOffsetY}px</span>
            </div>
            <Slider
              value={[config.gibOffsetY]}
              min={-160}
              max={160}
              step={1}
              onValueChange={([value]) => updateConfig('gibOffsetY', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Head Scale</Label>
              <span className="text-muted-foreground">{config.headScale >= 0 ? '+' : ''}{config.headScale.toFixed(2)}x</span>
            </div>
            <Slider
              value={[config.headScale]}
              min={-0.35}
              max={0.35}
              step={0.01}
              onValueChange={([value]) => updateConfig('headScale', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Head X</Label>
              <span className="text-muted-foreground">{config.headOffsetX >= 0 ? '+' : ''}{config.headOffsetX}px</span>
            </div>
            <Slider
              value={[config.headOffsetX]}
              min={-160}
              max={160}
              step={1}
              onValueChange={([value]) => updateConfig('headOffsetX', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Head Y</Label>
              <span className="text-muted-foreground">{config.headOffsetY >= 0 ? '+' : ''}{config.headOffsetY}px</span>
            </div>
            <Slider
              value={[config.headOffsetY]}
              min={-160}
              max={160}
              step={1}
              onValueChange={([value]) => updateConfig('headOffsetY', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Frame X</Label>
              <span className="text-muted-foreground">{config.frameOffsetX >= 0 ? '+' : ''}{config.frameOffsetX}px</span>
            </div>
            <Slider
              value={[config.frameOffsetX]}
              min={-160}
              max={160}
              step={1}
              onValueChange={([value]) => updateConfig('frameOffsetX', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Frame Y</Label>
              <span className="text-muted-foreground">{config.frameOffsetY >= 0 ? '+' : ''}{config.frameOffsetY}px</span>
            </div>
            <Slider
              value={[config.frameOffsetY]}
              min={-160}
              max={160}
              step={1}
              onValueChange={([value]) => updateConfig('frameOffsetY', value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label>Edge Margin</Label>
              <span className="text-muted-foreground">{config.padding}px</span>
            </div>
            <Slider
              value={[config.padding]}
              min={0}
              max={96}
              step={1}
              onValueChange={([value]) => updateConfig('padding', value)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleReset} variant="outline" className="w-full whitespace-nowrap">
              Reset
            </Button>
            <Button onClick={handleDownloadSquare} variant="holographic" className="w-full whitespace-nowrap">
              Square PNG
            </Button>
            <Button onClick={handleDownloadTrim} variant="outline" className="w-full whitespace-nowrap">
              Trim PNG
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
