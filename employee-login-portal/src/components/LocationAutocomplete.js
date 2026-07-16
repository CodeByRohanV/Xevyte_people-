import React, { useState, useEffect, useRef } from 'react';
import './LocationAutocomplete.css';

const LocationAutocomplete = ({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  name,
  className = ""
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [suggestions]);

  // Fetch location suggestions from OpenStreetMap Nominatim API
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Using Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'Employee Travel Portal' // Required by Nominatim policy
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();

      // Format suggestions
      const formattedSuggestions = data.map(item => ({
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        city: item.address?.city || item.address?.town || item.address?.village || '',
        state: item.address?.state || '',
        country: item.address?.country || ''
      }));

      setSuggestions(formattedSuggestions);
    } catch (err) {
      console.error('Error fetching location suggestions:', err);
      setError('Unable to fetch location suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const handleInputChange = (e) => {
    const value = e.target.value;
    onChange(e);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    const syntheticEvent = {
      target: {
        name: name,
        value: suggestion.display_name
      }
    };
    onChange(syntheticEvent);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev < suggestions.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : suggestions.length - 1;
          return newIndex;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show suggestions when input is focused and has value
  const handleInputFocus = () => {
    if (value && value.length >= 2) {
      setShowSuggestions(true);
      fetchSuggestions(value);
    }
  };

  return (
    <div className={`location-autocomplete ${className}`}>
      <label className="travel-field-label">
        <span>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </span>
        <div className="autocomplete-input-wrapper" ref={inputRef}>
          <input
            type="text"
            name={name}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            required={required}
            className="travel-input-field"
          />
          {isLoading && (
            <div className="autocomplete-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </label>

      {error && <div className="autocomplete-error">{error}</div>}

      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`suggestion-item ${highlightedIndex === index ? 'highlighted' : ''}`}
              style={{
                backgroundColor: highlightedIndex === index ? '#e0e0e0' : 'transparent'
              }}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseLeave={() => setHighlightedIndex(-1)}
            >
              <div className="suggestion-primary">
                {suggestion.city && suggestion.city !== suggestion.display_name.split(',')[0]
                  ? `${suggestion.city}, ${suggestion.state || suggestion.country}`
                  : suggestion.display_name.split(',')[0]
                }
              </div>
              <div className="suggestion-secondary">
                {suggestion.display_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
