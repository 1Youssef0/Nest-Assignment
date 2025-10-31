
export class GetAllResponse<T=any> {
  result: {
    docsCount?: number;
    pages?: number;
    limit?: number;
    currentPage?: number ;
    result: T[];
  };
} 