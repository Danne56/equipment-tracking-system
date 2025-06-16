import { pgTable, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Define enums for PostgreSQL
export const toolStatusEnum = pgEnum('tool_status', ['available', 'borrowed', 'maintenance']);
export const borrowStatusEnum = pgEnum('borrow_status', ['active', 'returned']);
export const notificationTypeEnum = pgEnum('notification_type', ['borrow', 'return', 'overdue']);

export const tools = pgTable('tools', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  qrCode: text('qr_code').notNull().unique(),
  status: toolStatusEnum('status').notNull().default('available'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().$defaultFn(() => new Date())
});

export const borrowRecords = pgTable('borrow_records', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  toolId: text('tool_id').notNull().references(() => tools.id),
  borrowerName: text('borrower_name').notNull(),
  borrowerLocation: text('borrower_location').notNull(),
  purpose: text('purpose').notNull(),
  borrowedAt: timestamp('borrowed_at', { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  returnedAt: timestamp('returned_at', { withTimezone: true }),
  status: borrowStatusEnum('status').notNull().default('active')
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: notificationTypeEnum('type').notNull(),
  message: text('message').notNull(),
  toolId: text('tool_id').notNull().references(() => tools.id),
  borrowRecordId: text('borrow_record_id').references(() => borrowRecords.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().$defaultFn(() => new Date()),
  read: text('read').$type<'true' | 'false'>().notNull().default('false')
});
