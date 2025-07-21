// src/components/NftLoader.jsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';

const NftLoader = ({ onNftLoad, isLoading }) => {
  const [serial, setSerial] = useState('');

  const handleLoadClick = () => {
    if (serial) {
      onNftLoad(serial);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLoadClick();
    }
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2 p-4 border border-dashed border-border rounded-lg bg-background/50">
      <Input
        type="number"
        placeholder="Serial #"
        value={serial}
        onChange={(e) => setSerial(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
        className="font-pixel"
      />
      <Button 
        type="submit" 
        onClick={handleLoadClick} 
        disabled={isLoading || !serial}
        variant="secondary"
      >
        {isLoading ? <Loader className="animate-spin" /> : '!ghostme'}
      </Button>
    </div>
  );
};

export default NftLoader;