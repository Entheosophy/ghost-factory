/* // src/components/ActionPanel.jsx */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ActionPanel({ randomizeMode, onModeChange, onRandomize, onDownload }) {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-black/20">
      <div className="flex items-center justify-center space-x-2">
        <Label htmlFor="randomize-mode">Fully Random</Label>
        <Switch 
          id="randomize-mode" 
          checked={randomizeMode === 'cohesive'}
          onCheckedChange={(checked) => onModeChange(checked ? 'cohesive' : 'full')} 
        />
        <Label htmlFor="randomize-mode">Semi-Cohesive</Label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button onClick={onRandomize} variant="holographic" className="w-full text-lg">Randomize</Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full text-lg">Download PNG</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] font-pixel" align="end">
            <DropdownMenuItem onClick={() => onDownload(1410)}>
              Large (1410px) - Original
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(470)}>
              Medium (470px) - Sticker
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload(141)}>
              Small (141px) - Emoji
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}