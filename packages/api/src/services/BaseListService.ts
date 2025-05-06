import { Repository, DataSource, FindOptionsRelations } from 'typeorm';
import { PaginationDto, PaginatedResponse, PaginationMeta } from '@/dto/common/pagination.dto';
import {
  buildFindOptions,
  applySearchAndFilters,
  generatePaginationLinks,
  parseFilter
} from '@/utils/query-builder';

/**
 * Abstract base class for services providing standardized list retrieval functionality.
 */
export abstract class BaseListService<T extends { id: number | string }> {
  protected repository: Repository<T>;

  constructor(
    protected dataSource: DataSource,
    protected entityClass: new () => T
  ) {
    this.repository = this.dataSource.getRepository(this.entityClass);
  }

  protected encodeCursor(item: T, sortField: keyof T): string {
    const cursorData = {
      id: item.id,
      sortValue: sortField !== 'id' ? item[sortField] : undefined
    };
    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }
  
  protected decodeCursor(cursor: string): { id: number | string, sortValue?: any } {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }

  /**
   * Fields allowed for filtering and sorting.
   * Must be implemented by subclasses.
   */
  protected abstract getAllowedFields(): (keyof T)[];

  /**
   * Fields allowed for full-text search.
   * Must be implemented by subclasses.
   */
  protected abstract getSearchableFields(): (keyof T)[];

  /**
   * Relations allowed for inclusion via the 'include' parameter.
   * Must be implemented by subclasses.
   */
  protected abstract getAllowedRelations(): string[];



  /**
   * Retrieves entities using keyset pagination.
   * This method supports cursor-based pagination using startId and optionally startValue
   * for sorting by fields other than id.
   *
   * @param query The raw query parameters from the request.
   * @param baseUrl The base URL for generating the next link.
   * @returns A paginated response object suitable for keyset pagination.
   */
  protected async getAll(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: Record<string, any>,
    baseUrl: string
  ): Promise<PaginatedResponse<T>> {
    const allowedFields = this.getAllowedFields();
    const searchableFields = this.getSearchableFields();
    const allowedRelations = this.getAllowedRelations();

    const { 
      limit = 20, 
      startId, 
      startValue, 
      sort = 'id', 
      order = 'ASC', 
      include, 
      search,
      ...filters 
    } = query;

    const qb = this.repository.createQueryBuilder('entity');

    // Validate and apply sort field
    const sortField = sort as keyof T;
    if (!allowedFields.includes(sortField)) {
        throw new Error(`Sorting by field '${String(sortField)}' is not allowed.`);
    }
    qb.orderBy(`entity.${String(sortField)}`, order as 'ASC' | 'DESC');

    // Always add id as secondary sort field for stable pagination
    if (sortField !== 'id') {
      qb.addOrderBy('entity.id', order as 'ASC' | 'DESC');
    }

    // Apply keyset pagination constraints
    if (startId) {
      const mainOperator = order === 'DESC' ? '<' : '>';
      const equalOperator = '=';

      // More robust handling of startValue
      if (startValue !== undefined && sortField !== 'id') {
        try {
          // For combined sorting (e.g., sort by createdAt, then by id)
          qb.andWhere(
            `(entity.${String(sortField)} ${equalOperator} :startValue AND entity.id ${mainOperator} :startId) OR entity.${String(sortField)} ${mainOperator} :startValue`,
            { startId: String(startId), startValue: String(startValue) }
          );
        } catch (error) {
          throw new Error(`Invalid startValue parameter for field ${String(sortField)}: ${startValue}`);
        }
      } else {
        // Simple sorting by id
        qb.andWhere(`entity.id ${mainOperator} :startId`, { startId: String(startId) });
      }
    }

    // Applying filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key as keyof T)) {
        const parsedValue = parseFilter(String(value));
        qb.andWhere(`entity.${key} = :${key}FilterValue`, { [`${key}FilterValue`]: parsedValue });
      }
    });

    // Applying search across multiple fields
    if (search && searchableFields.length > 0) {
      const searchConditions = searchableFields
        .filter(field => allowedFields.includes(field))
        .map(field => `entity.${String(field)} ILIKE :search`)
        .join(' OR ');
      
      if (searchConditions) {
        qb.andWhere(`(${searchConditions})`, { search: `%${String(search)}%` });
      }
    }

    // Applying relation includes
    if (include) {
      try {
        const includeOptions = this.validateIncludes(include as string | undefined, allowedRelations);
        if (includeOptions) {
          Object.keys(includeOptions.relations).forEach(relation => {
             qb.leftJoinAndSelect(`entity.${relation}`, relation);
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Invalid include parameter: ${error.message}`);
        }
        throw new Error('Invalid include parameter');
      }
    }

    qb.take(limit as number);

    const data = await qb.getMany();

    // Generate next page link for keyset pagination
    const links: { first?: string; prev?: string; next?: string; last?: string } = {}; 
    if (data.length === (limit as number)) {
      const lastItem = data[data.length - 1];
      const nextParams = new URLSearchParams();

      // Copy all query parameters except pagination ones
      Object.entries(query).forEach(([key, value]) => {
        if (key !== 'startId' && key !== 'startValue' && value !== undefined && value !== null) {
          nextParams.set(key, String(value));
        }
      });

      // Set keyset pagination parameters for the next page
      nextParams.set('startId', String(lastItem.id));
      if (sortField !== 'id' && lastItem[sortField as keyof T] !== undefined) {
        nextParams.set('startValue', String(lastItem[sortField as keyof T]));
      }

      links.next = `${baseUrl}?${nextParams.toString()}`;
    }

    const meta: PaginationMeta = {
      currentPage: 0,
      totalPages: 0,
      totalItems: 0,
      itemsPerPage: limit as number,
      hasNextPage: data.length === (limit as number),
      hasPreviousPage: !!startId
    };

    return {
      data,
      meta,
      links
    };
  }

  /**
   * Validates that the requested relations are allowed and returns them in a structured format.
   * This is an internal helper method for the getAll and getWithKeysetPagination methods.
   * 
   * @param include Comma-separated string of relations to include
   * @param allowedRelations List of relation names that are allowed
   * @returns An object with relations mapped to boolean values, or null if no relations requested
   * @throws Error if any requested relation is not allowed
   */
  protected validateIncludes(
    include: string | undefined,
    allowedRelations: string[]
  ): { relations: Record<string, boolean> } | null {
    if (!include) {
      return null;
    }

    // Split and normalize the requested relations
    const requestedRelations = include.split(',')
      .map(r => r.trim())
      .filter(Boolean);

    if (requestedRelations.length === 0) {
      return null;
    }

    // Check for invalid relations
    const invalidRelations = requestedRelations
      .filter(r => !allowedRelations.includes(r));

    if (invalidRelations.length > 0) {
      throw new Error(
        `Invalid relations included: ${invalidRelations.join(', ')}. ` +
        `Allowed relations are: ${allowedRelations.join(', ')}`
      );
    }

    // Convert to the format expected by TypeORM
    const relations: Record<string, boolean> = {};
    requestedRelations.forEach(r => {
      relations[r] = true;
    });

    return { relations };
  }
} 