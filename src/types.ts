export interface Product {
  id: string;
  name: string;
  price: number;
  discountedPrice: number;
  imageUrl: string;
  description: string;
}

export interface Order {
  id: string;
  timestamp: string;
  customerName: string;
  mobileNumber: string;
  address: string;
  totalAmount: number;
  paymentMethod: string;
  items: string;
  status: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
