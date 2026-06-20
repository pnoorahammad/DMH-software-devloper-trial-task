export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  reserved: number;
  available: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  status: 'reserved' | 'completed' | 'cancelled' | 'failed';
  customer_name: string;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  completedOrders: number;
  totalRevenue: number;
  lowStockProducts: Product[];
}

export interface SimulationRequest {
  productId: string;
  concurrentRequests: number;
  quantityPerRequest: number;
}

export interface SimulationResult {
  productId: string;
  productName: string;
  initialStock: number;
  requestedTotal: number;
  successful: number;
  failed: number;
  remainingStock: number;
  orders: SimulationOrderResult[];
  duration: number;
}

export interface SimulationOrderResult {
  requestId: number;
  customerId: string;
  quantity: number;
  status: 'success' | 'failed';
  reason?: string;
  orderId?: string;
}

export interface AnalyticsData {
  ordersByDay: { date: string; completed: number; failed: number; reserved: number }[];
  topProducts: { name: string; sku: string; totalOrdered: number; revenue: number }[];
  stockUsage: { name: string; totalStock: number; reserved: number; available: number }[];
  orderStatusBreakdown: { status: string; count: number }[];
  revenueByDay: { date: string; revenue: number }[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
