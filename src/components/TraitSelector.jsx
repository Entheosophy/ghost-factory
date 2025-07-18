/* // src/components/TraitSelector.jsx */
import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTraitColor } from '@/lib/traitUtils';

const WORD_COLOR_MAP = {
  brown: '#964B00',
  green: '#9effcb',
  grey: '#a1a1aa',
  yellow: '#ffec57',
  blue: '#aad5ff',
  red: '#ef4444',
  purple: '#d4b1ff',
  pink: '#fface5',
  orange: '#ffe1a9',
  black: '#1e2326',
  midnight: '#38295b',
  sky: '#24c6fe',
  zombie: '#ceddba',
  white: '#ffffff',
    // Onesie animal colors
  duck: '#ffec57', // yellow
  froggie: '#88cc59',  // GREEN
  turtle: '#88cc59',// GREEN
  dino: '#88cc59',  // GREEN
  wolf: '#a1a1aa',  // grey
  seal: '#a1a1aa',  // grey
  goat: '#a1a1aa',  // grey
  koala: '#a1a1aa', // grey
  bear: '#90664d',  // brown
  bull: '#956a3c',  // brown
  dog: '#b89570',  // light brown
  cat: '#f0f0f0',   // light grey
  chicken: '#ffffff',// white
  panda: '#ffffff', // white
  gorilla: '#5b5b5b', //dark grey
  penguin: '#5b5b5b', //dark grey
  monkey: '#c06d44', // light brown
  pig: '#ffbcb1', // pink
  shark: '#9ac9f2', // blue
  vaporwave: 'bg-gradient-to-r from-midnight-500 via-pink-500 to-blue-500 bg-clip-text text-transparent',
  vice: 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent',
  rainbow: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent',
};

function formatTraitName(name, layer) {
  if (!name) return '';

  const words = name.split('_');
  const lowerCaseName = name.toLowerCase();

  const filteredWords = words.filter(word => {
    const lowerWord = word.toLowerCase();

    if (lowerWord === 'eyewear') return false;
    if (lowerWord === 'left') return false;
    if (lowerWord === 'right') return false;
    
    if (lowerWord === 'white') {
      const whitelistedKeys = [
        'onesie_jetpack_left_white',
        'onesie_muscles_left_white',
        'onesie_muscles_right_white',
        'onesie_blade_knife_white'
      ];
      if (layer === 'background' || layer === 'skin' || whitelistedKeys.includes(lowerCaseName)) {
        return true;
      }
      return false;
    }

    if (lowerWord === 'solid' && layer === 'background') return false;
    
    return true;
  });

  const newName = filteredWords.join(' ');
  return newName.replace(/\b\w/g, l => l.toUpperCase());
}

function ColorizedTraitName({ name, defaultColor }) {
  const words = name.split(' ');

  return (
    <div className="flex flex-wrap items-center">
      {words.map((word, index) => {
        const lowerWord = word.toLowerCase();
        const specialStyle = WORD_COLOR_MAP[lowerWord];
        const formattedWord = word.charAt(0).toUpperCase() + word.slice(1);

        if (specialStyle) {
          if (specialStyle.startsWith('bg-')) {
            return <span key={index} className={specialStyle}>&nbsp;{formattedWord}</span>;
          } else {
            return <span key={index} style={{ color: specialStyle }}>&nbsp;{formattedWord}</span>;
          }
        }
        
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
            // THE FIX: The imageUrl constant and the <img> tag have been restored.
            const imageUrl = trait.options[optionKey];
            
            return (
              <SelectItem 
                key={optionKey} 
                value={optionKey}
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={cleanName}
                    loading="lazy"
                    className="size-6 mr-2 object-contain bg-slate-700/50 rounded-sm"
                  />
                )}
                <ColorizedTraitName name={cleanName} defaultColor={defaultColor} />
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};