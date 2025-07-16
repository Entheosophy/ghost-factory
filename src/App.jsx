// src/App.jsx
import { useState, useEffect, useMemo } from 'react';
import { TRAIT_MANIFEST, LAYER_ORDER } from './data/traits';

// Helper function to create a clean display name from a trait key
function formatTraitName(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// A memoized component for the trait selectors to prevent re-renders
const TraitSelector = ({ layer, trait, currentSelection, onSelect }) => {
  const sortedOptions = useMemo(() => Object.keys(trait.options).sort(), [trait.options]);

  return (
    <div>
      <label htmlFor={`select-${layer}`} className="block text-lg text-gray-400">
        {trait.label}
      </label>
      <select
        id={`select-${layer}`}
        value={currentSelection}
        onChange={(e) => onSelect(layer, e.target.value)}
        className="w-full p-2 rounded-md text-xl bg-[#1a1a2d] border-2 border-[#4a4a6a] hover:border-[#8a8ac0] focus:border-cyan-300 focus:outline-none"
      >
        {sortedOptions.map(optionKey => (
          <option key={optionKey} value={optionKey}>
            {formatTraitName(optionKey)}
          </option>
        ))}
      </select>
    </div>
  );
};

// The main application component
function App() {
  const [currentConfig, setCurrentConfig] = useState({});
  const [status, setStatus] = useState('Loading assets...');
  const [isLoaded, setIsLoaded] = useState(false);

  // Effect for preloading all images on initial render
  useEffect(() => {
    let active = true;
    const preloadImages = async () => {
      const imagePromises = [];
      let totalImages = 0;
      
      LAYER_ORDER.forEach(layer => {
        const trait = TRAIT_MANIFEST[layer];
        if (trait) {
          Object.values(trait.options).forEach(url => {
            if (url) {
              totalImages++;
              imagePromises.push(new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = resolve;
                img.onerror = () => reject(new Error(`Failed to load ${url}`));
              }));
            }
          });
        }
      });

      try {
        await Promise.all(imagePromises);
        if (active) {
          setStatus('Assets Loaded!');
          setIsLoaded(true);
          setTimeout(() => setStatus(''), 2000);
        }
      } catch (error) {
        console.error(error);
        if(active) setStatus('Error loading some assets.');
      }
    };

    preloadImages();
    return () => { active = false; };
  }, []);

  // Effect to set the initial random ghost once images are loaded
  useEffect(() => {
    if (isLoaded) {
      handleRandomize();
    }
  }, [isLoaded]);

  // Handler to update a single trait selection
  const handleSelectTrait = (layer, optionKey) => {
    setCurrentConfig(prevConfig => ({
      ...prevConfig,
      [layer]: optionKey
    }));
  };

  // Handler for the randomize button
  const handleRandomize = () => {
    const newConfig = {};
    LAYER_ORDER.forEach(layer => {
      const trait = TRAIT_MANIFEST[layer];
      if (trait) {
        const options = Object.keys(trait.options);
        const randomOption = options[Math.floor(Math.random() * options.length)];
        newConfig[layer] = randomOption;
      }
    });
    setCurrentConfig(newConfig);
  };

  // Handler for the download button
  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const CANVAS_SIZE = 1410;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    const drawingPromises = [];

    // Create a list of images to draw
    const imagesToDraw = LAYER_ORDER.map(layer => {
      const selectedOption = currentConfig[layer];
      if (selectedOption) {
        const url = TRAIT_MANIFEST[layer].options[selectedOption];
        if (url) {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image for download: ${url}`));
          });
        }
      }
      return Promise.resolve(null);
    });

    // Wait for all images to load, then draw them and trigger download
    Promise.all(imagesToDraw).then(images => {
      images.forEach(img => {
        if (img) {
          ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }
      });
      const link = document.createElement('a');
      link.download = 'dpgc-creation.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(error => console.error("Could not create image for download:", error));
  };


  return (
    <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen p-4 gap-8 bg-[#0d0d1a] text-[#e0e0e0]">
      {/* Left Panel: Controls */}
      <div className="w-full max-w-md bg-[#161628]/80 border-2 border-[#4a4a6a] rounded-lg p-6 shadow-2xl space-y-4">
        <h1 className="text-4xl text-cyan-300 tracking-widest text-center border-b-2 border-cyan-300/20 pb-2">
          GHOST FACTORY
        </h1>
        
        <div className="space-y-3">
          {LAYER_ORDER.map(layerKey => {
            const trait = TRAIT_MANIFEST[layerKey];
            return trait ? (
              <TraitSelector
                key={layerKey}
                layer={layerKey}
                trait={trait}
                currentSelection={currentConfig[layerKey] || ''}
                onSelect={handleSelectTrait}
              />
            ) : null;
          })}
        </div>

        <div className="pt-4 space-y-3">
          <button onClick={handleRandomize} disabled={!isLoaded} className="w-full text-2xl py-2 rounded-md bg-[#1a1a2d] border-2 border-[#4a4a6a] hover:border-[#8a8ac0] disabled:opacity-50 disabled:cursor-not-allowed">
            RANDOMIZE
          </button>
          <button onClick={handleDownload} disabled={!isLoaded} className="w-full text-2xl py-2 rounded-md bg-[#1a1a2d] border-2 border-[#4a4a6a] hover:border-[#8a8ac0] disabled:opacity-50 disabled:cursor-not-allowed">
            DOWNLOAD PNG
          </button>
        </div>
        
        {status && (
          <div className="text-center text-yellow-400 pt-2">{status}</div>
        )}
      </div>

      {/* Right Panel: Canvas Preview */}
      <div className="w-full max-w-xl aspect-square p-2 rounded-lg border-4 border-[#4a4a6a] bg-[repeating-conic-gradient(#1a1a2d_0%_25%,#161628_0%_50%)] bg-[length:16px_16px]">
        <div className="relative w-full h-full">
          {LAYER_ORDER.map(layerKey => {
            const optionKey = currentConfig[layerKey];
            if (!optionKey) return null;
            const url = TRAIT_MANIFEST[layerKey]?.options[optionKey];
            return url ? (
              <img
                key={layerKey}
                src={url}
                alt={`${layerKey} - ${optionKey}`}
                className="absolute top-0 left-0 w-full h-full"
              />
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
