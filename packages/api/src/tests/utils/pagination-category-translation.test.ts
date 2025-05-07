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
  describe(`Cursor-Based Pagination - ${endpoint}`, () => {
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
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
      expect(result.links.next).toBeDefined();
      expect(result.links.prev).toBeUndefined();
    });

    it('supports custom limit parameter', async () => {
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}?limit=5` });
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data).toHaveLength(5);
      expect(result.meta.itemsPerPage).toBe(5);
    });

    it('handles sorting correctly', async () => {
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}?sort=createdAt&order=DESC&limit=3` });
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

    it('provides working cursor for next page navigation', async () => {
      const firstResponse = await app.inject({ method: 'GET', url: `/api/${endpoint}?limit=10&sort=createdAt&order=DESC` });
      expect(firstResponse.statusCode).toBe(200);
      const firstResult = JSON.parse(firstResponse.payload);
      expect(firstResult.links.next).toBeDefined();

      const nextLink = new URL(firstResult.links.next);
      const nextResponse = await app.inject({ method: 'GET', url: nextLink.pathname + nextLink.search });
      expect(nextResponse.statusCode).toBe(200);
      const nextResult = JSON.parse(nextResponse.payload);
      expect(nextResult.data).toHaveLength(10);

      const firstPageIds = new Set(firstResult.data.map((item: { id: unknown }) => item.id));
      const secondPageIds = new Set(nextResult.data.map((item: { id: unknown }) => item.id));
      const overlap = [...secondPageIds].filter((id) => firstPageIds.has(id));
      expect(overlap).toHaveLength(0);

      const lastFirstPage = new Date(firstResult.data[firstResult.data.length - 1].createdAt).getTime();
      const firstSecondPage = new Date(nextResult.data[0].createdAt).getTime();
      expect(lastFirstPage).toBeGreaterThanOrEqual(firstSecondPage);
    });

    it('supports bidirectional navigation', async () => {
      const firstResponse = await app.inject({ method: 'GET', url: `/api/${endpoint}?limit=5&sort=id&order=ASC` });
      const firstResult = JSON.parse(firstResponse.payload);
      expect(firstResult.links.next).toBeDefined();

      const nextLink = new URL(firstResult.links.next);
      const secondResponse = await app.inject({ method: 'GET', url: nextLink.pathname + nextLink.search });
      const secondResult = JSON.parse(secondResponse.payload);
      expect(secondResult.links.prev).toBeDefined();

      const prevLink = new URL(secondResult.links.prev);
      const backToFirstResponse = await app.inject({ method: 'GET', url: prevLink.pathname + prevLink.search });
      const backToFirstResult = JSON.parse(backToFirstResponse.payload);
      expect(backToFirstResult.data[0].id).toBe(firstResult.data[0].id);
      expect(backToFirstResult.data.length).toBe(firstResult.data.length);
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

    it('handles invalid cursor gracefully', async () => {
      const response = await app.inject({ method: 'GET', url: `/api/${endpoint}?cursor=invalid-cursor` });
      expect(response.statusCode).toBe(400);
    });

    it('combines multiple query parameters correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/${endpoint}?limit=3&sort=createdAt&order=DESC&search=${encodeURIComponent(searchTermBuilder(0))}`,
      });
      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      expect(result.data).toHaveLength(3);
      expect(result.data.every((item: Record<string, unknown>) => JSON.stringify(item).includes(searchTermBuilder(0)))).toBe(true);
      for (let i = 0; i < result.data.length - 1; i++) {
        const current = new Date(result.data[i].createdAt).getTime();
        const next = new Date(result.data[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
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