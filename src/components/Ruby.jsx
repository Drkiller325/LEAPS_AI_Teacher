import React from 'react';

export const Ruby = ({ word, reading }) => {
  if (!word) return null;
  
  return (
    <ruby className="mx-0.5">
      {word}
      {reading && <rt className="text-white/65 text-sm">{reading}</rt>}
    </ruby>
  );
}; 