import { Repository, DataSource, FindOptionsRelations } from 'typeorm';
import { PaginationDto, PaginatedResponse, PaginationMeta } from '@/dto/common/pagination.dto';
import {
  buildFindOptions,
  applySearchAndFilters,
  validateIncludes,
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
   * Main method for retrieving a paginated list of entities.
   * Supports both offset and keyset pagination, filtering, sorting, and relation inclusion.
   *
   * @param query The raw query parameters from the request.
   * @param baseUrl The base URL for generating pagination links.
   * @returns A paginated response object.
   */
  async getAll(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: PaginationDto & Record<string, any>, // Using any for flexibility
    baseUrl: string
  ): Promise<PaginatedResponse<T>> {
    const { 
      limit, page, startId, 
      sort, order, 
      include, search, ...filters 
    } = query;

    if (startId) {
      return this.getWithKeysetPagination(query, baseUrl);
    }

    const allowedFields = this.getAllowedFields();
    const searchableFields = this.getSearchableFields();
    const allowedRelations = this.getAllowedRelations();

    let options = buildFindOptions<T>({ limit, page, sort, order }, allowedFields);

    options = applySearchAndFilters<T>(
      options,
      filters as Record<string, string>,
      search as string | undefined,
      allowedFields,
      searchableFields
    );

    try {
      const includeOptions = validateIncludes(include as string | undefined, allowedRelations);
      if (includeOptions) {
        options.relations = includeOptions.relations as FindOptionsRelations<T>;
      }
    } catch (error) {
      if (error instanceof Error) {
          throw new Error(`Invalid include parameter: ${error.message}`);
      }
      throw new Error('Invalid include parameter');
    }

    const [data, totalItems] = await this.repository.findAndCount(options);

    const currentPage = page as number || 1;
    const itemsPerPage = limit as number || 20;
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 0;

    const meta: PaginationMeta = {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };

    const links = generatePaginationLinks(baseUrl, query, totalItems);

    return { data, meta, links };
  }

  /**
   * Retrieves entities using keyset pagination.
   *
   * @param query The raw query parameters from the request.
   * @param baseUrl The base URL for generating the next link.
   * @returns A paginated response object suitable for keyset pagination.
   */
  protected async getWithKeysetPagination(
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

    const sortField = sort as keyof T;
    if (!allowedFields.includes(sortField)) {
        throw new Error(`Sorting by field '${String(sortField)}' is not allowed.`);
    }
    qb.orderBy(`entity.${String(sortField)}`, order as 'ASC' | 'DESC');

    if (sortField !== 'id') {
      qb.addOrderBy('entity.id', order as 'ASC' | 'DESC');
    }

    if (startId) {
      const mainOperator = order === 'DESC' ? '<' : '>';
      const equalOperator = '=';

      if (startValue && sortField !== 'id') {
        qb.andWhere(
          `(entity.${String(sortField)} ${equalOperator} :startValue AND entity.id ${mainOperator} :startId) OR entity.${String(sortField)} ${mainOperator} :startValue`,
          { startId: String(startId), startValue: String(startValue) }
        );
      } else {
        qb.andWhere(`entity.id ${mainOperator} :startId`, { startId: String(startId) });
      }
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && allowedFields.includes(key as keyof T)) {
        const parsedValue = parseFilter(String(value));
        qb.andWhere(`entity.${key} = :${key}FilterValue`, { [`${key}FilterValue`]: parsedValue });
      }
    });

    if (search && searchableFields.length > 0) {
      const searchConditions = searchableFields
        .filter(field => allowedFields.includes(field))
        .map(field => `entity.${String(field)} ILIKE :search`)
        .join(' OR ');
      
      if (searchConditions) {
        qb.andWhere(`(${searchConditions})`, { search: `%${String(search)}%` });
      }
    }

    if (include) {
      try {
        const includeOptions = validateIncludes(include as string | undefined, allowedRelations);
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

    const links: { first?: string; prev?: string; next?: string; last?: string } = {}; 
    if (data.length === (limit as number)) {
      const lastItem = data[data.length - 1];
      const nextParams = new URLSearchParams();

      Object.entries(query).forEach(([key, value]) => {
        if (key !== 'startId' && key !== 'startValue' && value !== undefined && value !== null) {
          nextParams.set(key, String(value));
        }
      });

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
} 