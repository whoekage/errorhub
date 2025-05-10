import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '../setup';
import { TestData } from '@/tests/utils/test-data';

describe('Page-Based Pagination', () => {
  let app: FastifyInstance;
  const errorCodes: string[] = [];

  beforeEach(async () => {
    app = await buildTestApp();
    errorCodes.length = 0;
    for (let i = 1; i <= 25; i++) {
      const code = `TEST.PAGINATION.${i}`;
      errorCodes.push(code);
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
    expect(result.meta.currentPage).toBe(1);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(false);
    expect(result.links.next).toBeDefined();
    expect(result.links.prev).toBeUndefined();
  });

  it('supports custom limit and page parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?limit=5&page=2'
    });
    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    expect(result.data).toHaveLength(5);
    expect(result.meta.itemsPerPage).toBe(5);
    expect(result.meta.currentPage).toBe(2);
    expect(result.meta.hasNextPage).toBe(true);
    expect(result.meta.hasPreviousPage).toBe(true);
    expect(result.links.next).toBeDefined();
    expect(result.links.prev).toBeDefined();
  });

  it('navigates to the last page and finds no next link', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?limit=10&page=3'
    });
    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    expect(result.data.length).toBeLessThanOrEqual(10);
    expect(result.meta.currentPage).toBe(3);
    expect(result.meta.hasNextPage).toBe(false);
    expect(result.links.next).toBeUndefined();
    expect(result.links.prev).toBeDefined();
  });

  it('handles sorting correctly', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?sort=createdAt&order=DESC&limit=3&page=1'
    });
    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    for (let i = 0; i < result.data.length - 1; i++) {
      const current = new Date(result.data[i].createdAt).getTime();
      const next = new Date(result.data[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('respects search parameters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/errors?search=TEST.PAGINATION.5'
    });
    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(result.data.some(item => item.code === 'TEST.PAGINATION.5')).toBe(true);
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
});