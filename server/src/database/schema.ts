import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const tools = sqliteTable('tools', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  qrCode: text('qr_code').notNull().unique(),
  status: text('status', { enum: ['available', 'borrowed', 'maintenance'] }).notNull().default('available'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
});

export const borrowRecords = sqliteTable('borrow_records', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  toolId: text('tool_id').notNull().references(() => tools.id),
  borrowerName: text('borrower_name').notNull(),
  borrowerLocation: text('borrower_location').notNull(),
  purpose: text('purpose').notNull(),
  borrowedAt: integer('borrowed_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  returnedAt: integer('returned_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['active', 'returned'] }).notNull().default('active')
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type', { enum: ['borrow', 'return', 'overdue'] }).notNull(),
  message: text('message').notNull(),
  toolId: text('tool_id').notNull().references(() => tools.id),
  borrowRecordId: text('borrow_record_id').references(() => borrowRecords.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  read: integer('read', { mode: 'boolean' }).notNull().default(false)
});
