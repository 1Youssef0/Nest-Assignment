import { ICategory } from "src/common";

export class CategoryResponse {
    category:ICategory
}


export class GetAllResponse {
  result: {
    docsCount?: number;
    pages?: number;
    limit?: number;
    currentPage?: number | undefined;
    result: ICategory[];
  };
}