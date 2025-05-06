// src/utils/pagination.ts
import { Repository, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationDto, PaginatedResponse } from '@/dto/common/pagination.dto';
import { encodeCursor, decodeCursor } from './cursor';

export interface KeysetPaginateOpts<T> extends PaginationDto {
  searchableFields?: (keyof T)[];
  alias?: string;
  baseUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface CursorData<T = any> {
  id: number | string;
  value: T;
}

export async function keysetPaginate<T extends ObjectLiteral>(
  repo: Repository<T>,
  options: KeysetPaginateOpts<T>
): Promise<PaginatedResponse<T>> {
  const {
    limit = 20,
    sort = 'id',
    order = 'ASC',
    direction = 'next',
    cursor,
    search,
    searchableFields = [],
    alias = 'entity',
    baseUrl,
  } = options;

  // Build query
  const qb = repo.createQueryBuilder(alias);
  
  // Apply search if present
  if (search && searchableFields.length > 0) {
    const conditions = searchableFields
      .map((f) => `${alias}.${String(f)} LIKE :search`)
      .join(' OR ');
    qb.andWhere(`(${conditions})`, { search: `%${search}%` });
  }

  // Apply cursor pagination
  applyCursorCondition(qb, {
    cursor,
    sortKey: sort as string,
    order,
    direction,
    alias
  });
  
  // Add sorting
  qb.orderBy(`${alias}.${String(sort)}`, order as 'ASC' | 'DESC');
  
  // Add stable sorting with ID as secondary sort when primary sort isn't ID
  if (sort !== 'id') {
    qb.addOrderBy(`${alias}.id`, order as 'ASC' | 'DESC');
  }
  
  // Fetch one extra item to determine if there are more pages
  qb.take(limit + 1);
  
  // Execute query
  const results = await qb.getMany();
  
  // Check if there are more items
  const hasMore = results.length > limit;
  
  // Remove the extra item
  const data = hasMore ? results.slice(0, limit) : results;
  // Возьмём «лишний» элемент ДО усечения
  const overflowItem = hasMore ? results[limit] : null;
  
  // Generate cursors for pagination
  const firstItem  = data[0] ?? null;
  
  // Generate next/prev cursor values
  const nextCursor = overflowItem
  ? createCursor(overflowItem, sort as keyof T)  // элемент после лимита
  : undefined;
  const prevCursor = firstItem ? createCursor(firstItem, sort as keyof T) : undefined;
  
  // Build navigation links
  const links: { next?: string; prev?: string } = {};
  
  if (nextCursor && hasMore) {
    links.next = buildLink(baseUrl, {
      cursor: nextCursor,
      limit: limit.toString(),
      sort: String(sort),
      order,
      direction: 'next',
      search
    });
  }
  
  if (prevCursor && cursor && direction !== 'prev') {
    links.prev = buildLink(baseUrl, {
      cursor: prevCursor,
      limit: limit.toString(),
      sort: String(sort),
      order,
      direction: 'prev',
      search
    });
  }
  
  return {
    data,
    meta: {
      itemsPerPage: limit,
      hasNextPage: hasMore,
      hasPreviousPage: !!cursor
    },
    links
  };
}

/**
 * Apply cursor-based conditions to a query builder
 */
function applyCursorCondition<T>(
  qb: SelectQueryBuilder<T>,
  options: {
    cursor?: string;
    sortKey: string;
    order: string;
    direction: string;
    alias: string;
  }
): void {
  const { cursor, sortKey, order, direction, alias } = options;
  
  if (!cursor) return;
  console.log('CURSOR-DBG', { raw: cursor, decoded: decodeCursor(cursor), sortKey, order, direction });
  try {
    // Decode cursor
    const cursorData = decodeCursor(cursor) as CursorData;
    
    // Determine actual order direction based on pagination direction
    const isPrev = direction === 'prev';
    const actualOrder = isPrev ? (order === 'ASC' ? 'DESC' : 'ASC') : order;
    
    // Operators for comparison
    const op = actualOrder === 'ASC' ? '>' : '<'; 
    const eqOp = '='; 
    
    if (sortKey === 'id') {
      // For ID, we can use a simple comparison
      qb.andWhere(`${alias}.id ${op} :cursorId`, { 
        cursorId: cursorData.id 
      });
    } else {
      // For other fields, use a compound condition
      qb.andWhere(
        `(${alias}.${sortKey} ${op} :sortValue) OR 
         (${alias}.${sortKey} ${eqOp} :sortValue AND ${alias}.id ${op} :cursorId)`,
        { 
          sortValue: typeof cursorData.value === 'string' && !isNaN(Date.parse(cursorData.value as string))
            ? new Date(cursorData.value as string)
            : cursorData.value,
          cursorId: cursorData.id
        }
      );
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

/**
 * Create a cursor value for an item
 */
function createCursor<T extends { id: number | string }>(item: T, sortKey: keyof T): string {
  const cursorData: CursorData = {
    id: (item as any).id,
    value: item[sortKey]
  };
  
  return encodeCursor(cursorData);
}

/**
 * Build a pagination link
 */
function buildLink(
  baseUrl?: string,
  params?: Record<string, string | undefined>
): string | undefined {
  if (!baseUrl || !params) return undefined;
  
  const urlParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      urlParams.set(key, value);
    }
  });
  
  return `${baseUrl}?${urlParams.toString()}`;
}