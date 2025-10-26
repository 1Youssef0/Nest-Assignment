import { IBrand } from 'src/common';

export class BrandResponse {
  brand: IBrand;
}

export class GetAllResponse {
  result: {
    docsCount?: number;
    pages?: number;
    limit?: number;
    currentPage?: number | undefined;
    result: IBrand[];
  };
}
