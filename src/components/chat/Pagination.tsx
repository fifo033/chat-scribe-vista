import React from 'react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Calculate the range of pages to show
  const getPageRange = () => {
    const range: number[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages are less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Always include first page
      range.push(1);
      
      if (currentPage <= 3) {
        // If current page is near the beginning
        for (let i = 2; i <= maxPagesToShow - 1; i++) {
          range.push(i);
        }
        range.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // If current page is near the end
        range.push(totalPages - 3);
        range.push(totalPages - 2);
        range.push(totalPages - 1);
        range.push(totalPages);
      } else {
        // If current page is in the middle
        range.push(currentPage - 1);
        range.push(currentPage);
        range.push(currentPage + 1);
        range.push(totalPages);
      }
    }
    
    return range;
  };

  return (
    <div className="pagination">
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Назад
      </Button>
      
      {getPageRange().map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          onClick={() => onPageChange(page)}
          disabled={currentPage === page}
        >
          {page}
        </Button>
      ))}
      
      <Button
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Далее
      </Button>
    </div>
  );
};

export default Pagination;
