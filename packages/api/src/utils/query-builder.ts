import {
  FindManyOptions,
  FindOptionsWhere,
  FindOptionsOrder,
  ILike,
  LessThan,
  MoreThan,
  Between,
  In,
  IsNull,
  FindOperator
} from 'typeorm';
import { PaginationDto } from '@/dto/common/pagination.dto';

/**
 * Build basic TypeORM FindManyOptions from query parameters
 */
export function buildFindOptions<T extends object>(
  query: PaginationDto,
  allowedFields: (keyof T)[]
): FindManyOptions<T> {
  const options: FindManyOptions<T> = {};

  // Apply offset pagination
  if (query.page !== undefined && query.limit !== undefined) {
    options.skip = (query.page - 1) * query.limit;
    options.take = query.limit;
  } else if (query.limit !== undefined) {
    options.take = query.limit;
  }

  // Apply sorting
  if (query.sort) {
    const sortField = query.sort as keyof T;
    if (allowedFields.includes(sortField)) {
      options.order = {
        [sortField]: query.order || 'ASC'
      } as FindOptionsOrder<T>;
    }
  }

  return options;
}

/**
 * Parse filter values with operators (e.g., "gt:10", "like:value")
 */
export function parseFilter(value: string): string | FindOperator<string | number> {
  if (!value.includes(':')) {
    return value; // Default to equality if no operator
  }

  const [operator, ...rest] = value.split(':');
  const filterValue = rest.join(':');

  switch(operator) {
    case 'eq': return filterValue;
    case 'lt': return LessThan(filterValue);
    case 'gt': return MoreThan(filterValue);
    case 'like': return ILike(`%${filterValue}%`);
    case 'between': {
      const [min, max] = filterValue.split(',');
      return Between(min, max);
    }
    case 'in': return In(filterValue.split(','));
    case 'null': return IsNull();
    default: return value; // Return original value if operator is unknown
  }
}

/**
 * Apply search and filters to TypeORM FindManyOptions
 */
export function applySearchAndFilters<T extends object>(
  options: FindManyOptions<T>,
  filters: Record<string, string>,
  search: string | undefined,
  allowedFields: (keyof T)[],
  searchableFields: (keyof T)[]
): FindManyOptions<T> {
  // Process filters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereConditions: FindOptionsWhere<T> | any = {};
  const validFilters: Record<string, string> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (allowedFields.includes(key as keyof T)) {
      validFilters[key] = value;
    }
  });

  Object.entries(validFilters).forEach(([key, value]) => {
    whereConditions[key as keyof T] = parseFilter(value);
  });

  // Apply search functionality
  if (search && searchableFields.length > 0) {
    const searchConditions = searchableFields.map(field => ({
      [field]: ILike(`%${search}%`)
    } as FindOptionsWhere<T>));

    if (Object.keys(whereConditions).length > 0) {
      // Combine filters (AND) with search conditions (OR)
      options.where = searchConditions.map(searchCond => ({
        ...whereConditions,
        ...searchCond
      }));
    } else {
      // Only search conditions (OR)
      options.where = searchConditions;
    }
  } else if (Object.keys(whereConditions).length > 0) {
    // Only filter conditions (AND)
    options.where = whereConditions;
  }

  return options;
}

/**
 * Validate and process the include parameter for relations
 */
export function validateIncludes(
  includeStr: string | undefined,
  allowedRelations: string[]
): { relations: Record<string, boolean> } | null {
  if (!includeStr) {
    return null;
  }

  const requestedRelations = includeStr.split(',')
    .map(r => r.trim())
    .filter(Boolean);

  const invalidRelations = requestedRelations
    .filter(r => !allowedRelations.includes(r));

  if (invalidRelations.length > 0) {
    throw new Error(
      `Invalid relations included: ${invalidRelations.join(', ')}. ` +
      `Allowed relations are: ${allowedRelations.join(', ')}`
    );
  }

  const relations: Record<string, boolean> = {};
  requestedRelations.forEach(r => {
    relations[r] = true;
  });

  return { relations };
}

/**
 * Generate HATEOAS links for offset pagination
 */
export function generatePaginationLinks(
  baseUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: PaginationDto & Record<string, any>, // Reverted to any for flexibility
  totalItems: number
): { first: string; prev?: string; next?: string; last?: string } {
  const limit = query.limit || 20;
  const currentPage = query.page || 1;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / limit) : 0;

  // Copy query parameters, excluding 'page' for link generation
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    // Ensure value is stringifiable before setting
    if (key !== 'page' && value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  const baseQueryUrl = `${baseUrl}?${queryString ? queryString + '&' : ''}`;

  const links: { first: string; prev?: string; next?: string; last?: string } = {
    first: `${baseQueryUrl}page=1`
  };

  if (currentPage > 1 && totalPages > 0) {
    links.prev = `${baseQueryUrl}page=${currentPage - 1}`;
  }

  if (currentPage < totalPages) {
    links.next = `${baseQueryUrl}page=${currentPage + 1}`;
  }

  if (totalPages > 0) {
    links.last = `${baseQueryUrl}page=${totalPages}`;
  }

  return links;
} 