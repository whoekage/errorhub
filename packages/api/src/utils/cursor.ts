export function encodeCursor(value: any): string {
    return Buffer.from(String(value)).toString('base64');
  }
  
  export function decodeCursor(cursor: string): any {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  }