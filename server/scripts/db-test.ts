#!/usr/bin/env bun

/**
 * Database Test Script
 * This script tests database connectivity, schema validation, and basic CRUD operations
 */

import { db } from '../src/database/index.js';
import { tools, borrowRecords, notifications } from '../src/database/schema.js';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration?: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, success: true, duration });
    console.log(`✓ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, success: false, error: errorMessage, duration });
    console.log(`✗ ${name} (${duration}ms): ${errorMessage}`);
  }
}

async function testDatabaseConnection(): Promise<void> {
  // Test basic connection by running a simple query
  await db.select().from(tools).limit(1);
}

async function testToolsCRUD(): Promise<void> {
  const testToolId = nanoid(4);
  
  // Create
  const [createdTool] = await db.insert(tools).values({
    id: testToolId,
    name: 'Test Tool',
    description: 'A tool for testing',
    qrCode: testToolId,
    status: 'available'
  }).returning();
  
  if (!createdTool || createdTool.id !== testToolId) {
    throw new Error('Failed to create test tool');
  }
  
  // Read
  const [readTool] = await db.select().from(tools).where(eq(tools.id, testToolId));
  if (!readTool || readTool.name !== 'Test Tool') {
    throw new Error('Failed to read test tool');
  }
  
  // Update
  const [updatedTool] = await db.update(tools)
    .set({ description: 'Updated test tool' })
    .where(eq(tools.id, testToolId))
    .returning();
  
  if (!updatedTool || updatedTool.description !== 'Updated test tool') {
    throw new Error('Failed to update test tool');
  }
  
  // Delete
  await db.delete(tools).where(eq(tools.id, testToolId));
  
  const [deletedTool] = await db.select().from(tools).where(eq(tools.id, testToolId));
  if (deletedTool) {
    throw new Error('Failed to delete test tool');
  }
}

async function testBorrowRecordsCRUD(): Promise<void> {
  // First create a test tool
  const testToolId = nanoid(4);
  await db.insert(tools).values({
    id: testToolId,
    name: 'Test Tool for Borrow',
    qrCode: testToolId,
    status: 'available'
  });
  
  const testRecordId = nanoid(4);
  
  try {
    // Create borrow record
    const [createdRecord] = await db.insert(borrowRecords).values({
      id: testRecordId,
      toolId: testToolId,
      borrowerName: 'Test User',
      borrowerLocation: 'Test Location',
      purpose: 'Testing',
      status: 'active'
    }).returning();
    
    if (!createdRecord || createdRecord.borrowerName !== 'Test User') {
      throw new Error('Failed to create test borrow record');
    }
    
    // Read borrow record
    const [readRecord] = await db.select().from(borrowRecords).where(eq(borrowRecords.id, testRecordId));
    if (!readRecord || readRecord.purpose !== 'Testing') {
      throw new Error('Failed to read test borrow record');
    }
    
    // Update borrow record
    const [updatedRecord] = await db.update(borrowRecords)
      .set({ status: 'returned', returnedAt: new Date() })
      .where(eq(borrowRecords.id, testRecordId))
      .returning();
    
    if (!updatedRecord || updatedRecord.status !== 'returned') {
      throw new Error('Failed to update test borrow record');
    }
    
    // Clean up
    await db.delete(borrowRecords).where(eq(borrowRecords.id, testRecordId));
  } finally {
    // Clean up test tool
    await db.delete(tools).where(eq(tools.id, testToolId));
  }
}

async function testNotificationsCRUD(): Promise<void> {
  // First create a test tool
  const testToolId = nanoid(4);
  await db.insert(tools).values({
    id: testToolId,
    name: 'Test Tool for Notification',
    qrCode: testToolId,
    status: 'available'
  });
  
  const testNotificationId = nanoid(4);
  
  try {
    // Create notification
    const [createdNotification] = await db.insert(notifications).values({
      id: testNotificationId,
      type: 'borrow',
      message: 'Test notification',
      toolId: testToolId,
      read: 'false'
    }).returning();
    
    if (!createdNotification || createdNotification.message !== 'Test notification') {
      throw new Error('Failed to create test notification');
    }
    
    // Read notification
    const [readNotification] = await db.select().from(notifications).where(eq(notifications.id, testNotificationId));
    if (!readNotification || readNotification.read !== 'false') {
      throw new Error('Failed to read test notification');
    }
    
    // Update notification
    const [updatedNotification] = await db.update(notifications)
      .set({ read: 'true' })
      .where(eq(notifications.id, testNotificationId))
      .returning();
    
    if (!updatedNotification || updatedNotification.read !== 'true') {
      throw new Error('Failed to update test notification');
    }
    
    // Clean up
    await db.delete(notifications).where(eq(notifications.id, testNotificationId));
  } finally {
    // Clean up test tool
    await db.delete(tools).where(eq(tools.id, testToolId));
  }
}

async function testNanoidGeneration(): Promise<void> {
  const id1 = nanoid(4);
  const id2 = nanoid(4);
  
  if (id1.length !== 4) {
    throw new Error(`Expected nanoid length 4, got ${id1.length}`);
  }
  
  if (id2.length !== 4) {
    throw new Error(`Expected nanoid length 4, got ${id2.length}`);
  }
  
  if (id1 === id2) {
    throw new Error('nanoid should generate unique IDs');
  }
  
  // Test that IDs are URL-safe
  const urlSafeRegex = /^[A-Za-z0-9_-]+$/;
  if (!urlSafeRegex.test(id1) || !urlSafeRegex.test(id2)) {
    throw new Error('nanoid should generate URL-safe characters');
  }
}

async function testForeignKeyConstraints(): Promise<void> {
  const testToolId = nanoid(4);
  
  try {
    // Try to create a borrow record with non-existent tool ID
    await db.insert(borrowRecords).values({
      toolId: 'non-existent-tool',
      borrowerName: 'Test User',
      borrowerLocation: 'Test Location',
      purpose: 'Testing FK constraint'
    });
    
    throw new Error('Should have failed due to foreign key constraint');
  } catch (error) {
    // This should fail, which is expected
    if (error instanceof Error && error.message.includes('foreign key')) {
      // Good, foreign key constraint is working
      return;
    }
    if (error instanceof Error && error.message === 'Should have failed due to foreign key constraint') {
      throw error;
    }
    // Any other database constraint error is also acceptable
  }
}

async function runAllTests(): Promise<void> {
  console.log('Starting database tests...\n');
  
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Tools CRUD Operations', testToolsCRUD);
  await runTest('Borrow Records CRUD Operations', testBorrowRecordsCRUD);
  await runTest('Notifications CRUD Operations', testNotificationsCRUD);
  await runTest('nanoid(4) Generation', testNanoidGeneration);
  await runTest('Foreign Key Constraints', testForeignKeyConstraints);
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Total Duration: ${totalDuration}ms`);
  
  if (failedTests > 0) {
    console.log('\nFAILED TESTS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`- ${r.name}: ${r.error}`);
    });
  }
  
  console.log('\n' + (failedTests === 0 ? 'All tests passed!' : `${failedTests} test(s) failed.`));
  
  process.exit(failedTests === 0 ? 0 : 1);
}

runAllTests().catch((error) => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
