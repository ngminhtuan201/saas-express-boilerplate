import { Request } from "express";

const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_PAGE_NUMBER = 1;

interface PaginationMetadata {
  totalItems: number;
  totalPages: number;
  pageSize: number;
  pageNumber: number;
}

interface PaginatedItems<T> {
  items: Array<T>;
  metadata: PaginationMetadata;
}

export function createPaginatedItems<T>(
  items: Array<T>,
  totalItems: number,
  pageSize: number,
  pageNumber: number,
): PaginatedItems<T> {
  return {
    items: items,
    metadata: {
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      pageSize: pageSize,
      pageNumber: pageNumber,
    },
  };
}

export const getPageSize = (req: Request): number => {
  const pageSizeStr = req.query?.pageSize as string | undefined;
  const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : NaN;

  return !isNaN(pageSize) && Number.isInteger(pageSize) && pageSize >= 1
    ? pageSize
    : DEFAULT_PAGE_SIZE;
};

export const getPageNumber = (req: Request): number => {
  const pageNumberStr = req.query?.pageNumber as string | undefined;
  const pageNumber = pageNumberStr ? parseInt(pageNumberStr, 10) : NaN;

  return !isNaN(pageNumber) && Number.isInteger(pageNumber) && pageNumber >= 1
    ? pageNumber
    : DEFAULT_PAGE_NUMBER;
};
