/* // src/components/TraitSelector.jsx */
import React, { useMemo, useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';

// UI components for the new Combobox structure
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

// Utilities and helpers
import { getTraitColor, TRAIT_COLOR_MAP } from '@/lib/traitUtils';
import { cn } from '@/lib/utils';


// This map is used by ColorizedTraitName
const WORD_COLOR_MAP = {
  brown: '#964B00', green: '#9effcb', grey: '#a1a1aa', yellow: '#ffec57',
  blue: '#aad5ff', red: '#ef4444', purple: '#d4b1ff', pink: '#fface5',
  orange: '#ffe1a9', black: '#1e2326', midnight: '#38295b', sky: '#24c6fe',
  zombie: '#ceddba', white: '#ffffff', duck: '#ffec57', froggie: '#88cc59',
  turtle: '#88cc59', dino: '#88cc59', wolf: '#a1a1aa', seal: '#a1a1aa',
  goat: '#a1a1aa', "goat grey": '#dfdfdf', koala: '#a1a1aa', bear: '#90664d',
  bull: '#956a3c', dog: '#b89570', cat: '#f0f0f0', chicken: '#ffffff',
  panda: '#ffffff', gorilla: '#5b5b5b', penguin: '#5b5b5b', monkey: '#c06d44',
  pig: '#ffbcb1', shark: '#9ac9f2',
  vaporwave: 'bg-gradient-to-r from-midnight-500 via-pink-500 to-blue-500 bg-clip-text text-transparent',
  vice: 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent',
  rainbow: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent',
};

// Helper to format the raw trait key into a displayable name
function formatTraitName(name, layer) {
  if (!name) return '';
  const words = name.split('_');
  const lowerCaseName = name.toLowerCase();
  const filteredWords = words.filter(word => {
    const lowerWord = word.toLowerCase();
    if (['eyewear', 'left', 'right'].includes(lowerWord)) return false;
    if (lowerWord === 'white') {
      const whitelistedKeys = ['onesie_jetpack_left_white', 'onesie_muscles_left_white', 'onesie_muscles_right_white', 'muscles_right_white', 'muscles_left_white', 'onesie_blade_knife_white'];
      return layer === 'background' || layer === 'skin' || whitelistedKeys.includes(lowerCaseName);
    }
    if (lowerWord === 'solid' && layer === 'background') return false;
    return true;
  });
  return filteredWords.join(' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper to render the name with specific colors
function ColorizedTraitName({ name, defaultColor }) {
  const words = name.split(' ');
  const elements = [];
  const themeWords = Object.keys(TRAIT_COLOR_MAP);
  for (let i = 0; i < words.length; i++) {
    const oneWordKey = words[i].toLowerCase();
    let styleToApply = '#FFFFFF'; // Default color
    if (WORD_COLOR_MAP[oneWordKey]) {
      styleToApply = WORD_COLOR_MAP[oneWordKey];
    } else if (themeWords.includes(oneWordKey)) {
      styleToApply = defaultColor;
    }
    if (typeof styleToApply === 'string' && styleToApply.startsWith('bg-')) {
      elements.push(<span key={i} className={styleToApply}>&nbsp;{words[i]}</span>);
    } else {
      elements.push(<span key={i} style={{ color: styleToApply }}>&nbsp;{words[i]}</span>);
    }
  }
  return <div className="flex flex-wrap items-center -ml-1">{elements}</div>;
}


// --- The New TraitSelector Component ---
export function TraitSelector({ layer, trait, currentSelection, onSelect }) {
  const [open, setOpen] = useState(false);

  // Memoize the full list of options with all necessary data
  const options = useMemo(() => {
    const keys = Object.keys(trait.options);
    const noneKey = keys.find(k => k.toLowerCase() === 'none');
    
    // This is the updated sorting logic
    const otherKeys = keys
      .filter(k => k.toLowerCase() !== 'none')
      .sort((a, b) => {
        const sortA = a.startsWith('white_') ? a.substring(6) : a;
        const sortB = b.startsWith('white_') ? b.substring(6) : b;
        return sortA.localeCompare(sortB);
      });
      
    const sortedKeys = noneKey ? [noneKey, ...otherKeys] : otherKeys;

    return sortedKeys.map(optionKey => ({
      value: optionKey,
      label: formatTraitName(optionKey, layer),
      imageUrl: trait.options[optionKey],
    }));
  }, [trait.options, layer]);

  const currentOption = options.find(opt => opt.value === currentSelection);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{trait.label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal font-pixel text-left h-auto py-1.5"
          >
            {currentOption ? (
              <div className="flex items-center gap-2 truncate">
                {currentOption.imageUrl && <img src={currentOption.imageUrl} alt={currentOption.label} className="size-6 object-contain bg-slate-700/50 rounded-sm" />}
                <ColorizedTraitName name={currentOption.label} defaultColor={getTraitColor(currentOption.value)} />
              </div>
            ) : (
              <span className="text-muted-foreground">{`Select ${trait.label}...`}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 font-pixel" align="start">
          <Command>
            <CommandInput placeholder={`Search ${trait.label}...`} />
            <CommandList>
              <CommandEmpty>No trait found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`} // Value used for filtering
                    onSelect={() => {
                      onSelect(layer, option.value);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt={option.label}
                        loading="lazy"
                        className="size-6 object-contain bg-slate-700/50 rounded-sm"
                      />
                    )}
                    <ColorizedTraitName name={option.label} defaultColor={getTraitColor(option.value)} />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}