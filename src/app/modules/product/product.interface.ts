export type TSpecification = {
  key: string;
  value: string;
};

export type TProduct = {
  title: string;
  category: string;
  subCategory: string;
  price: number;
  strikePrice: number;
  stockQuantity: number;
  sku: string;
  shortDescription: string;
  longDescription: string;
  images: string[];
  specifications: TSpecification[];
  isDeleted?: boolean;
};
