export type ApiResponse = {
  message: string;
  success: boolean;
}

// Tool Management Types
export type Tool = {
  id: string;
  name: string;
  description?: string | null;
  qrCode: string;
  status: 'available' | 'borrowed' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
}

export type BorrowRecord = {
  id: string;
  toolId: string;
  borrowerName: string;
  borrowerLocation: string;
  purpose: string;
  borrowedAt: Date;
  returnedAt?: Date | null;
  status: 'active' | 'returned';
}

export type Notification = {
  id: string;
  type: 'borrow' | 'return' | 'overdue';
  message: string;
  toolId: string;
  borrowRecordId?: string | null;
  createdAt: Date;
  read: boolean;
}

// API Request/Response Types
export type CreateToolRequest = {
  name: string;
  description?: string;
}

export type CreateToolResponse = {
  success: boolean;
  tool?: Tool;
  message: string;
}

export type BorrowToolRequest = {
  toolId: string;
  borrowerName: string;
  borrowerLocation: string;
  purpose: string;
}

export type BorrowToolResponse = {
  success: boolean;
  borrowRecord?: BorrowRecord;
  message: string;
}

export type ReturnToolRequest = {
  borrowRecordId: string;
}

export type ReturnToolResponse = {
  success: boolean;
  borrowRecord?: BorrowRecord;
  message: string;
}

export type GetToolsResponse = {
  success: boolean;
  tools: Tool[];
  message: string;
}

export type GetBorrowRecordsResponse = {
  success: boolean;
  records: (BorrowRecord & { tool: Tool | null })[];
  message: string;
}

export type GetNotificationsResponse = {
  success: boolean;
  notifications: (Notification & { tool: Tool | null })[];
  message: string;
}
