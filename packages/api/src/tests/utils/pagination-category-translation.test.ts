/* eslint-disable */
import { describe, it, expect, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildTestApp } from '../setup';
import { TestData } from './test-data';

// Helper to run a set of pagination tests for a specific endpoint
function createPaginationTests(
  endpoint: string,
  seedFn: (index: number, date: Date) => Promise<void>,
  searchTermBuilder: (index: number) => string,
  verifySearch: (items: Array<Record<string, unknown>>, index: number) => void,
) {
  describe(`Page-Based Pagination - ${endpoint}`, () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      app = await buildTestApp();
      // Seed 25 records with predictable timestamps
      for (let i = 1; i <= 25; i++) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - i);
        await seedFn(i, date);
      }
    });

    it('returns first page of results with default pagination', async () => {
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}` });
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data).toHaveLength(20);
      expect(result.meta.itemsPerPage).toBe(20);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
      expect(result.links.next).toBeDefined();
      expect(result.links.prev).toBeUndefined();
    });

    it('supports custom limit and page parameters', async () => {
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}?limit=5&page=2` });
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
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}?limit=10&page=3` });
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data.length).toBeLessThanOrEqual(10);
      expect(result.meta.currentPage).toBe(3);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.links.next).toBeUndefined();
      expect(result.links.prev).toBeDefined();
    });

    it('handles sorting correctly', async () => {
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}?sort=createdAt&order=DESC&limit=3&page=1` });
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      for (let i = 0; i < result.data.length - 1; i++) {
        const current = new Date(result.data[i].createdAt).getTime();
        const next = new Date(result.data[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('respects search parameters', async () => {
      const searchValue = searchTermBuilder(5);
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}?search=${encodeURIComponent(searchValue)}` });
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      verifySearch(result.data, 5);
    });

    it('handles empty results correctly', async () => {
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}?search=NONEXISTENT.XYZ` });
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data).toHaveLength(0);
      expect(result.links.next).toBeUndefined();
      expect(result.links.prev).toBeUndefined();
      expect(result.meta.hasNextPage).toBe(false);
    });
  });
}

// === Categories Tests ===
createPaginationTests(
  'categories',
  async (index, date) => {
    await TestData.seedCategory({
      name: `TEST.CATEGORY.PAGINATION.${index}`,
      description: `Pagination test category ${index}`,
      createdAt: date,
      updatedAt: date,
    });
  },
  (index) => `TEST.CATEGORY.PAGINATION.${index}`,
  (items, index) => {
    expect(items.some((item: Record<string, unknown>) => (item as { name?: string }).name === `TEST.CATEGORY.PAGINATION.${index}`)).toBe(true);
  },
);

// === Translations Tests ===
createPaginationTests(
  'translations',
  async (index, date) => {
    await TestData.seedTranslation({
      message: `Pagination test translation ${index}`,
      language: 'en',
      createdAt: date,
      updatedAt: date,
    });
  },
  (index) => `Pagination test translation ${index}`,
  (items, index) => {
    expect(items.some((item: Record<string, unknown>) => (item as { message?: string }).message === `Pagination test translation ${index}`)).toBe(true);
  },
); 