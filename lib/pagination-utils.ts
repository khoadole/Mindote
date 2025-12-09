export type PaginationItemType = number | 'ellipsis';

export function getPaginationItems(currentPage: number, totalPages: number): PaginationItemType[] {
  // If total pages is 7 or less, show all pages
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If total pages > 7, we need to truncate
  // We want to show: 1, 2, 3, ..., N-2, N-1, N
  // But we also want to keep the current page visible if it's in the middle

  // Case 1: Current page is near the start (1, 2, 3, 4)
  // Show: 1, 2, 3, 4, 5, ..., N
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
  }

  // Case 2: Current page is near the end (N-3, N-2, N-1, N)
  // Show: 1, ..., N-4, N-3, N-2, N-1, N
  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  // Case 3: Current page is in the middle
  // Show: 1, ..., current-1, current, current+1, ..., N
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages];
}
