// CODEMAP: FRONTEND_COMPONENTS_UI_ONSCREENNUMPAD_JSX
// WHAT_THIS_IS: This file supports frontend behavior for OnScreenNumpad.jsx.
// WHERE_CONNECTED:
// - Used by frontend pages and routes through imports.
// - Main entry flow starts at client/src/main.jsx and client/src/App.jsx.
// HOW_TO_FIND_IN_FRONTEND:
// - File path: components/ui/OnScreenNumpad.jsx
// - Search text: OnScreenNumpad.jsx
import React from 'react';
import Modal from './Modal';
import Button from './Button';

const KEYPAD_ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '00', '.']
];

const OnScreenNumpad = ({
  isOpen,
  title,
  value,
  allowDecimal = true,
  onChange,
  onClose
}) => {
  const currentValue = String(value || '');

  // Simple: This handles what happens when key press is triggered.
  const handleKeyPress = (key) => {
    if (key === '.' && !allowDecimal) {
      return;
    }

    if (key === '.') {
      if (currentValue.includes('.')) {
        return;
      }

      onChange(currentValue ? `${currentValue}.` : '0.');
      return;
    }

    if (key === '00' && !currentValue) {
      onChange('0');
      return;
    }

    onChange(`${currentValue}${key}`);
  };

  const keypadRows = allowDecimal
    ? KEYPAD_ROWS
    : KEYPAD_ROWS.map((row) => row.filter((key) => key !== '.'));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-right text-3xl font-semibold text-gray-900">
          {currentValue || '0'}
        </div>

        <div className="space-y-3">
          {keypadRows.map((row) => (
            <div key={row.join('-')} className="grid grid-cols-3 gap-3">
              {row.map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-[56px] text-lg"
                  onClick={() => handleKeyPress(key)}
                >
                  {key}
                </Button>
              ))}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Button type="button" variant="secondary" onClick={() => onChange('')}>
            Clear
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange(currentValue.slice(0, -1))}
            disabled={!currentValue}
          >
            Backspace
          </Button>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OnScreenNumpad;

