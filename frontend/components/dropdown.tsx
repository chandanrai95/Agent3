"use client";

import { useState, useRef, useEffect, useMemo } from "react";

interface Option {
  label: string;
  value: string;
}

interface Props {
  value: any;
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  loadingText?: string;
}

export default function Dropdown({
  value,
  options,
  onSelect,
  placeholder = "Select...",
  isLoading,
  loadingText
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Dynamic height + position
  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const openUpward = spaceBelow < 250 && spaceAbove > spaceBelow;

      const maxHeight = openUpward
        ? Math.min(spaceAbove - 10, 400)
        : Math.min(spaceBelow - 10, 400);

      setDropdownStyle({
        maxHeight,
        overflowY: "auto",
        top: openUpward ? undefined : "100%",
        bottom: openUpward ? "100%" : undefined,
        marginTop: openUpward ? undefined : 8,
        marginBottom: openUpward ? 8 : undefined,
      });
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    onSelect(option.value);
    setIsOpen(false);
  };

  const selected = useMemo(() => {
    return options.find((el) => el.value === value);
  }, [value, options]);

  return (
    <div className="relative min-w-64" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-left flex justify-between items-center hover:border-gray-400 transition"
        style={{ fontWeight: 600, fontSize: 16 }}
        disabled={isLoading}
      >
        {isLoading ? (
          <span>{loadingText ? loadingText : 'Loading...'}</span>
        ) : (
          <>
            <span>{selected?.label || placeholder}</span>
            <svg
              className={`w-4 h-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <ul
          className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg"
          style={dropdownStyle}
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
