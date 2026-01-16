import React, { useState } from 'react';
import { EyeDropperIcon } from '@heroicons/react/24/outline';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, label }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const presetColors = [
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316', // Orange
    '#6366f1', // Indigo
  ];

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-3">
        {/* Color preview */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
            style={{ backgroundColor: value }}
            onClick={() => setShowColorPicker(!showColorPicker)}
          />
          <EyeDropperIcon className="absolute -bottom-1 -right-1 w-5 h-5 text-gray-500" />
        </div>

        {/* Color input */}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="#000000"
            />
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-10 h-10 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Color presets */}
      {showColorPicker && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Colores predefinidos:</p>
          <div className="flex flex-wrap gap-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setShowColorPicker(false);
                }}
                className={`w-8 h-8 rounded-full border-2 ${
                  value === color ? 'border-gray-900' : 'border-gray-300'
                } hover:border-gray-900 transition-colors`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;