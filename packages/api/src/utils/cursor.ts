// src/utils/cursor.ts
/**
 * Encodes a value as a cursor string
 */
export function encodeCursor(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }
  
  try {
    const json = JSON.stringify(value);
    return Buffer.from(json).toString('base64');
  } catch (error) {
    return '';
  }
}

/**
 * Decodes a cursor string
 * @throws Error with statusCode 400 if cursor is invalid
 */
export function decodeCursor(cursor: string): any {
  if (!cursor) {
    const err = new Error('Invalid cursor format: empty cursor');
    // Set custom status code for error handling middleware
    Object.defineProperty(err, 'statusCode', { value: 400 });
    throw err;
  }
  
  // Check if valid base64
  if (!/^[A-Za-z0-9+/=]+$/.test(cursor)) {
    const err = new Error('Invalid cursor format: not valid base64');
    Object.defineProperty(err, 'statusCode', { value: 400 });
    throw err;
  }
  
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    
    try {
      return JSON.parse(decoded);
    } catch {
      const err = new Error('Invalid cursor format: not valid JSON');
      Object.defineProperty(err, 'statusCode', { value: 400 });
      throw err;
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    
    const err = new Error('Invalid cursor format');
    Object.defineProperty(err, 'statusCode', { value: 400 });
    throw err;
  }
}