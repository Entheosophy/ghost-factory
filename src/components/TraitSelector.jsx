/* // src/components/TraitSelector.jsx */
import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTraitColor } from '@/lib/traitUtils';

// Helper function to format the display name
function formatTraitName(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function TraitSelector({ layer, trait, currentSelection, onSelect }) {
  const sortedOptions = useMemo(() => {
    const keys = Object.keys(trait.options);
    const noneKey = keys.find(k => k.toLowerCase() === 'none');
    const otherKeys = keys.filter(k => k.toLowerCase() !== 'none').sort();
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
          {sortedOptions.map(optionKey => (
            <SelectItem 
              key={optionKey} 
              value={optionKey}
              // THE FIX: Apply the color using an inline style.
              style={{ color: getTraitColor(optionKey) }}
            >
              {formatTraitName(optionKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};