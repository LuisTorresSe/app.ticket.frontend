import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../../constants';

interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selectedOptions, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleOption = (option: string) => {
    const newSelectedOptions = selectedOptions.includes(option)
      ? selectedOptions.filter(o => o !== option)
      : [...selectedOptions, option];
    onChange(newSelectedOptions);
  };

  const handleSelectAll = () => {
    onChange(options);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };
  
  const allSelected = selectedOptions.length === options.length;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
        <label className="block text-sm font-medium text-text-secondary mb-1">
            {label}
        </label>
        <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-left flex items-center justify-between"
        >
            <span className="text-text-primary">
                {selectedOptions.length === 0
                ? `Todos los Estados`
                : selectedOptions.length === options.length 
                ? 'Todos Seleccionados' 
                : `${selectedOptions.length} seleccionados`}
            </span>
            {isOpen ? ICONS.chevronUp : ICONS.chevronDown}
        </button>

        {isOpen && (
            <div className="absolute z-20 mt-1 w-full bg-secondary border border-border-color rounded-lg shadow-xl animate-fade-in max-h-80 flex flex-col">
            <div className="p-2 border-b border-border-color">
                <input
                type="text"
                placeholder="Buscar estado..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-primary border border-border-color rounded-md px-2 py-1 text-sm"
                />
            </div>
            <div className="flex-grow overflow-y-auto">
                {filteredOptions.map(option => (
                <label
                    key={option}
                    className="flex items-center w-full px-3 py-2 text-sm text-text-primary hover:bg-primary cursor-pointer"
                >
                    <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleToggleOption(option)}
                    className="form-checkbox h-4 w-4 text-accent bg-primary border-border-color rounded focus:ring-accent mr-3"
                    />
                    {option}
                </label>
                ))}
            </div>
            <div className="flex justify-between p-2 border-t border-border-color">
                 <button 
                    onClick={allSelected ? handleDeselectAll : handleSelectAll} 
                    className="text-xs text-accent hover:underline"
                >
                    {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
                 <button onClick={() => setIsOpen(false)} className="text-xs text-text-secondary hover:text-text-primary">Cerrar</button>
            </div>
            </div>
        )}
    </div>
  );
};

export default MultiSelectDropdown;
