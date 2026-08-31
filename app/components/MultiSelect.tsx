"use client";

import { useState, useRef, useEffect } from "react";

export interface Option {
  id: string;
  label: string;
  group?: string; // Optional for grouping e.g. by Course
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelect({ options, selectedIds, onChange, placeholder = "Select options...", disabled = false }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSelect = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedIds.filter(selectedId => selectedId !== id));
  };

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`w-full min-h-[42px] px-3 py-1.5 rounded-lg border ${disabled ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer'} flex flex-wrap gap-2 items-center`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-slate-400 dark:text-slate-500 text-sm">{placeholder}</span>
        ) : (
          selectedOptions.map(opt => (
            <span key={opt.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
              {opt.label}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, opt.id)}
                  className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors focus:outline-none"
                >
                  &times;
                </button>
              )}
            </span>
          ))
        )}
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-800 p-2 border-b border-slate-100 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-1.5 text-sm rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-sm text-slate-500 text-center">No results found.</div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  className={`flex items-center px-3 py-2 text-sm rounded cursor-pointer transition-colors ${selectedIds.includes(opt.id) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
                  onClick={() => handleSelect(opt.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(opt.id)}
                    readOnly
                    className="mr-3"
                  />
                  <span>
                    {opt.label}
                    {opt.group && <span className="ml-2 text-xs text-slate-400">({opt.group})</span>}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
