#!/usr/bin/env bun

/**
 * Database Seeding Script
 * This script adds sample tools to the database for testing purposes
 */

import { db } from '../src/database/index.js';
import { tools } from '../src/database/schema.js';
import { nanoid } from 'nanoid';

const sampleTools = [
  {
    name: "Electric Drill",
    description: "Cordless electric drill with multiple bits",
    qrCode: nanoid(4),
    status: 'available' as const
  },
  {
    name: "Circular Saw",
    description: "7.25 inch circular saw for wood cutting",
    qrCode: nanoid(4),
    status: 'available' as const
  },
  {
    name: "Socket Set",
    description: "Complete socket wrench set with ratchet",
    qrCode: nanoid(4),
    status: 'available' as const
  },
  {
    name: "Angle Grinder",
    description: "4.5 inch angle grinder with cutting discs",
    qrCode: nanoid(4),
    status: 'available' as const
  },
  {
    name: "Digital Multimeter",
    description: "Digital multimeter for electrical testing",
    qrCode: nanoid(4),
    status: 'available' as const
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with sample tools...');
    
    // Check if tools already exist
    const existingTools = await db.select().from(tools);
    if (existingTools.length > 0) {
      console.log(`⚠️  Database already has ${existingTools.length} tools. Skipping seeding.`);
      console.log('   Use --force to seed anyway (will add duplicate tools)');
      return;
    }

    // Insert sample tools
    const insertedTools = await db.insert(tools).values(sampleTools).returning();
    
    console.log(`✅ Successfully added ${insertedTools.length} sample tools:`);
    insertedTools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name} (QR: ${tool.qrCode})`);
    });
    
    console.log('');
    console.log('🎉 Database seeding complete!');
    console.log('   You can now test the application with these sample tools.');
    console.log('   Start the app with: bun run dev');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Check for --force flag
const forceFlag = process.argv.includes('--force');
if (forceFlag) {
  console.log('🔄 Force flag detected. Adding tools regardless of existing data...');
  // Remove the check for existing tools by directly inserting
  seedDatabase().then(async () => {
    const insertedTools = await db.insert(tools).values(sampleTools).returning();
    console.log(`✅ Force added ${insertedTools.length} tools to database.`);
    process.exit(0);
  });
} else {
  seedDatabase().then(() => process.exit(0));
}
