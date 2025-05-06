import { describe, it, expect } from 'vitest';
// @ts-ignore
import { encodeCursor, decodeCursor } from '../../utils/cursor';

describe('Cursor Utilities', () => {
  it('encodes and decodes primitive values correctly', () => {
    // Number value - new implementation preserves number type via JSON
    const numberValue = 12345;
    const encodedNumber = encodeCursor(numberValue);
    expect(decodeCursor(encodedNumber)).toBe(numberValue);
    
    // String value
    const stringValue = "test-string-value";
    const encodedString = encodeCursor(stringValue);
    expect(decodeCursor(encodedString)).toBe(stringValue);
    
    // Date value (convert to ISO string for comparison)
    const dateValue = new Date();
    const dateString = dateValue.toISOString();
    const encodedDate = encodeCursor(dateString);
    expect(decodeCursor(encodedDate)).toBe(dateString);
  });

  it('handles empty strings', () => {
    const emptyString = "";
    const encoded = encodeCursor(emptyString);
    expect(decodeCursor(encoded)).toBe(emptyString);
  });

  it('handles special characters correctly', () => {
    const specialChars = "!@#$%^&*()_+{}[]|\\;:'\",.<>/?`~";
    const encoded = encodeCursor(specialChars);
    expect(decodeCursor(encoded)).toBe(specialChars);
  });

  it('handles complex objects correctly', () => {
    const complexObject = {
      id: 123,
      name: 'Test Object',
      nested: {
        value: true,
        items: [1, 2, 3]
      }
    };
    
    const encoded = encodeCursor(complexObject);
    expect(decodeCursor(encoded)).toEqual(complexObject);
  });

  it('handles null and undefined values', () => {
    // Our implementation returns empty string for null/undefined
    expect(encodeCursor(null)).toBe('');
    expect(encodeCursor(undefined)).toBe('');
    
    // Empty cursor throws error when decoding
    expect(() => decodeCursor('')).toThrow('Invalid cursor format');
  });

  it('throws appropriate error for invalid cursor', () => {
    expect(() => decodeCursor('')).toThrow('Invalid cursor format');
    // Add testing for invalid base64 input
    expect(() => decodeCursor('not-valid-base64!')).toThrow('Invalid cursor format');
  });
}); 