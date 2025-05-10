// src/utils/pagination.ts
import { Repository, ObjectLiteral } from 'typeorm';
import { PaginationDto, PaginatedResponse } from '@/dto/common/pagination.dto';

export interface OffsetPaginateOpts<T> extends PaginationDto {
  searchableFields?: (keyof T)[];
  alias?: string;
  baseUrl?: string;
}

export async function offsetPaginate<T extends ObjectLiteral>(
  repo: Repository<T>,
  options: OffsetPaginateOpts<T>
): Promise<PaginatedResponse<T>> {
  const {
    page = 1,
    limit = 20,
    sort = 'id',
    order = 'ASC',
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

  // Add sorting
  qb.orderBy(`${alias}.${String(sort)}`, order as 'ASC' | 'DESC');
  if (sort !== 'id') {
    qb.addOrderBy(`${alias}.id`, order as 'ASC' | 'DESC');
  }

  // Pagination
  qb.skip((page - 1) * limit).take(limit);

  // Get [data, total]
  const [data, totalItems] = await qb.getManyAndCount();

  const totalPages = Math.ceil(totalItems / limit) || 1;
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  // Build navigation links
  const links: { next?: string; prev?: string } = {};
  if (baseUrl) {
    const buildParams = (pageValue: number) => {
      const params: Record<string, string> = {
        sort: String(sort),
        order: String(order),
        limit: String(limit),
        page: String(pageValue),
      };
      if (options.include !== undefined) params.include = options.include;
      if (options.search !== undefined) params.search = options.search;
      return params;
    };
    if (hasNextPage) {
      const params = new URLSearchParams(buildParams(page + 1));
      links.next = `${baseUrl}?${params.toString()}`;
    }
    if (hasPreviousPage) {
      const params = new URLSearchParams(buildParams(page - 1));
      links.prev = `${baseUrl}?${params.toString()}`;
    }
  }

  return {
    data,
    meta: {
      totalItems,
      itemsPerPage: limit,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    links,
  };
}