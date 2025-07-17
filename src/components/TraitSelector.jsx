/* // src/components/TraitSelector.jsx */
import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTraitColor } from '@/lib/traitUtils';

// This map now supports any number of solid colors OR gradient class strings.
const WORD_COLOR_MAP = {
  brown: '#964B00',
  green: '#9effcb',
  grey: '#a1a1aa',
  yellow: '#eab308',
  blue: '#aad5ff',
  red: '#ff939f',
  purple: '#d4b1ff',
  pink: '#fface5',
  orange: '#ffe1a9',
  black: '#1e2326',
  midnight: '#38295b',
  white: '#ffffff',
  sky: '#6ee2ff',
  zombie: '#ceddba', 
  vaporwave: 'bg-gradient-to-r from-midnight-500 via-pink-500 to-blue-500 bg-clip-text text-transparent',
  vice: 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent',
  rainbow: 'bg-gradient-to-r from-red-500 via-green-500 to-purple-500 bg-clip-text text-transparent',
};

function formatTraitName(name, layer) {
  if (!name) return '';

  const words = name.split('_');

  const filteredWords = words.filter(word => {
    const lowerWord = word.toLowerCase();

    if (lowerWord === 'eyewear') {
      return false;
    }
    if (lowerWord === 'white' && layer !== 'background' && layer !== 'skin') {
      return false;
    }
    if (lowerWord === 'solid' && layer === 'background') {
      return false;
    }
    
    return true;
  });

  const newName = filteredWords.join(' ');
  return newName.replace(/\b\w/g, l => l.toUpperCase());
}

function ColorizedTraitName({ name, defaultColor }) {
  const words = name.split(' ');

  return (
    <div className="flex">
      {words.map((word, index) => {
        const lowerWord = word.toLowerCase();
        const specialStyle = WORD_COLOR_MAP[lowerWord];
        const formattedWord = word.charAt(0).toUpperCase() + word.slice(1);

        // If the word has a special style defined in the map...
        if (specialStyle) {
          // Check if it's a gradient (a className string) or a solid color.
          if (specialStyle.startsWith('bg-')) {
            return <span key={index} className={specialStyle}>&nbsp;{formattedWord}</span>;
          } else {
            return <span key={index} style={{ color: specialStyle }}>&nbsp;{formattedWord}</span>;
          }
        }
        
        // Otherwise, use the default trait color.
        return <span key={index} style={{ color: defaultColor }}>&nbsp;{formattedWord}</span>;
      })}
    </div>
  );
}


export function TraitSelector({ layer, trait, currentSelection, onSelect }) {
  const sortedOptions = useMemo(() => {
    const keys = Object.keys(trait.options);
    const noneKey = keys.find(k => k.toLowerCase() === 'none');
    const otherKeys = keys.filter(k => k.toLowerCase() !== 'none');
    return noneKey ? [noneKey, ...otherKeys] : otherKeys;
  }, [trait.options]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{trait.label}</label>
      <Select onValueChange={(value) => onSelect(layer, value)} value={currentSelection}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${trait.label}...`} />
        </SelectTrigger>
        <SelectContent className="border bg-popover font-pixel">
          {sortedOptions.map(optionKey => {
            const defaultColor = getTraitColor(optionKey);
            const cleanName = formatTraitName(optionKey, layer);
            
            return (
              <SelectItem 
                key={optionKey} 
                value={optionKey}
              >
                <ColorizedTraitName name={cleanName} defaultColor={defaultColor} />
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};