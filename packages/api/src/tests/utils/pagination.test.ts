import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '../setup';
import { TestData } from '@/tests/utils/test-data';
import { decodeCursor, encodeCursor } from '@/utils/cursor';

describe('Cursor-Based Pagination', () => {
  let app: FastifyInstance;
  const errorCodes: string[] = [];

  // Setup test environment with predictable data
  beforeEach(async () => {
    app = await buildTestApp();
    
    // Create 25 error codes with predictable timestamps
    for (let i = 1; i <= 25; i++) {
      const code = `TEST.PAGINATION.${i}`;
      errorCodes.push(code);
      
      // Create with controlled timestamps (older as index increases)
      // This ensures consistent sorting for tests
      const date = new Date();
      date.setMinutes(date.getMinutes() - i);
      
      await TestData.seedErrorCode({
        code,
        defaultMessage: `Pagination test error ${i}`,
        createdAt: date,
        updatedAt: date
      });
    }
  });

  it('returns first page of results with default pagination', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors'
    });
    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    
    expect(result.data).toHaveLength(20); // Default limit
    expect(result.meta.itemsPerPage).toBe(20);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(false);
    expect(result.links.next).toBeDefined();
    expect(result.links.prev).toBeUndefined();
  });

  it('supports custom limit parameter', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?limit=5'
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    
    expect(result.data).toHaveLength(5);
    expect(result.meta.itemsPerPage).toBe(5);
  });

  it('handles sorting correctly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?sort=createdAt&order=DESC&limit=3'
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    
    // Verify descending order by createdAt
    for (let i = 0; i < result.data.length - 1; i++) {
      const current = new Date(result.data[i].createdAt).getTime();
      const next = new Date(result.data[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('respects search parameters', async () => {
    // Search for a specific error
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?search=TEST.PAGINATION.5'
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    
    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data.some(item => item.code === 'TEST.PAGINATION.5')).toBe(true);
  });

  it('provides working cursor for next page navigation', async () => {
    // Get first page
    const firstResponse = await app.inject({
      method: 'GET',
      url: '/api/errors?limit=10&sort=createdAt&order=DESC'
    });
    
    expect(firstResponse.statusCode).toBe(200);
    const firstResult = JSON.parse(firstResponse.payload);
    expect(firstResult.links.next).toBeDefined();
    
    // Extract and follow the next link
    const nextLink = new URL(firstResult.links.next);
    const nextResponse = await app.inject({
      method: 'GET',
      url: nextLink.pathname + nextLink.search
    });
    
    expect(nextResponse.statusCode).toBe(200);
    const nextResult = JSON.parse(nextResponse.payload);
    
    // Verify second page
    expect(nextResult.data).toHaveLength(10);
    
    // Verify no overlap between pages
    const firstPageIds = new Set(firstResult.data.map(item => item.id));
    const secondPageIds = new Set(nextResult.data.map(item => item.id));
    const overlap = [...secondPageIds].filter(id => firstPageIds.has(id));
    expect(overlap).toHaveLength(0);
    
    // Verify correct sort order continuation
    const lastFirstPage = new Date(firstResult.data[firstResult.data.length - 1].createdAt).getTime();
    const firstSecondPage = new Date(nextResult.data[0].createdAt).getTime();
    expect(lastFirstPage).toBeGreaterThanOrEqual(firstSecondPage);
  });

  it('supports bidirectional navigation', async () => {
    // Get first page
    const firstResponse = await app.inject({
      method: 'GET',
      url: '/api/errors?limit=5&sort=id&order=ASC'
    });
    
    const firstResult = JSON.parse(firstResponse.payload);
    expect(firstResult.links.next).toBeDefined();
    
    // Go to second page
    const nextLink = new URL(firstResult.links.next);
    const secondResponse = await app.inject({
      method: 'GET',
      url: nextLink.pathname + nextLink.search
    });
    
    const secondResult = JSON.parse(secondResponse.payload);
    expect(secondResult.links.prev).toBeDefined();
    
    // Go back to first page
    const prevLink = new URL(secondResult.links.prev);
    const backToFirstResponse = await app.inject({
      method: 'GET',
      url: prevLink.pathname + prevLink.search
    });
    
    const backToFirstResult = JSON.parse(backToFirstResponse.payload);
    
    // Verify we're back to the first page
    expect(backToFirstResult.data[0].id).toBe(firstResult.data[0].id);
    expect(backToFirstResult.data.length).toBe(firstResult.data.length);
  });

  it('handles empty results correctly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?search=NONEXISTENT.CODE.XYZ'
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    
    expect(result.data).toHaveLength(0);
    expect(result.links.next).toBeUndefined();
    expect(result.links.prev).toBeUndefined();
    expect(result.meta.hasNextPage).toBe(false);
  });

  it('encodes and decodes cursors correctly', () => {
    const testData = { id: 123, value: 'test-value' };
    const encoded = encodeCursor(testData);
    
    // Verify encoding produces a base64 string
    expect(typeof encoded).toBe('string');
    expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/);
    
    // Verify decoding restores the original data
    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual(testData);
  });

  it('handles invalid cursor gracefully', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?cursor=invalid-cursor'
    });

    // Should return 400 Bad Request for invalid cursor
    expect(response.statusCode).toBe(400);
  });

  it('combines multiple query parameters correctly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?limit=3&sort=createdAt&order=DESC&search=TEST.PAGINATION'
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    
    // Verify limit is respected
    expect(result.data).toHaveLength(3);
    
    // Verify search is applied
    expect(result.data.every(item => item.code.includes('TEST.PAGINATION'))).toBe(true);
    
    // Verify sorting is applied
    for (let i = 0; i < result.data.length - 1; i++) {
      const current = new Date(result.data[i].createdAt).getTime();
      const next = new Date(result.data[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});