
import { Repository } from 'typeorm';
import { PaginationDto, PaginatedResponse } from '@/dto/common/pagination.dto';
import { encodeCursor, decodeCursor } from './cursor';

export interface KeysetPaginateOpts<T> extends PaginationDto {
  searchableFields?: (keyof T)[];
  alias?: string;
  baseUrl?: string;
}

export async function keysetPaginate<T>(
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

  const isPrev = direction === 'prev';
  const realOrder = isPrev ? (order === 'ASC' ? 'DESC' : 'ASC') : order;

  const qb = repo.createQueryBuilder(alias)
    .orderBy(`${alias}.${String(sort)}`, realOrder)
    .limit(limit + 1);

  const lastValue = cursor ? decodeCursor(cursor) : null;

  if (lastValue !== null && lastValue !== undefined) {
    qb.andWhere(`${alias}.${String(sort)} ${realOrder === 'ASC' ? '>' : '<'} :lastValue`, {
      lastValue,
    });
  }

  if (search && searchableFields.length > 0) {
    const conditions = searchableFields
      .map((f) => `${alias}.${String(f)} LIKE :search`)
      .join(' OR ');
    qb.andWhere(`(${conditions})`, { search: `%${search}%` });
  }

  const results = await qb.getMany();
  const hasMore = results.length > limit;

  let data = hasMore ? results.slice(0, limit) : results;
  if (isPrev) data = data.reverse();

  const lastItem = data[data.length - 1] as Record<string, any>;
  const firstItem = data[0] as Record<string, any>;

  const nextCursorValue = encodeCursor(lastItem?.[sort]);
  const prevCursorValue = encodeCursor(firstItem?.[sort]);

  const buildLink = (cursorValue?: string, dir?: 'next' | 'prev'): string | undefined => {
    if (!cursorValue || !baseUrl) return undefined;
    const params = new URLSearchParams({
      cursor: cursorValue,
      limit: limit.toString(),
      sort: String(sort),
      order,
      direction: dir ?? direction,
      ...(search ? { search } : {}),
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return {
    data,
    meta: {
      itemsPerPage: limit,
      hasNextPage: direction === 'next' ? hasMore : !!cursor,
      hasPreviousPage: direction === 'prev' ? hasMore : !!cursor,
    },
    links: {
      next:
        direction === 'next'
          ? hasMore
            ? buildLink(nextCursorValue, 'next')
            : undefined
          : cursor
          ? buildLink(nextCursorValue, 'next')
          : undefined,
      prev:
        direction === 'next'
          ? cursor
            ? buildLink(prevCursorValue, 'prev')
            : undefined
          : hasMore
          ? buildLink(prevCursorValue, 'prev')
          : undefined,
    },
  };
}
