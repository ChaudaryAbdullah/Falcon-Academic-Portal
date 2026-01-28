// scripts/optimizeDatabase.js
// Run this script to create all necessary indexes for optimal performance

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DB_URL = process.env.DB_URL;

async function optimizeDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(DB_URL);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    console.log("\n📊 Creating indexes for Fee collection...");

    const feeCollection = db.collection("fees");

    // Drop existing indexes (except _id)
    console.log("🗑️  Dropping old indexes...");
    const existingIndexes = await feeCollection.indexes();
    for (const index of existingIndexes) {
      if (index.name !== "_id_") {
        try {
          await feeCollection.dropIndex(index.name);
          console.log(`   Dropped: ${index.name}`);
        } catch (error) {
          console.log(`   Could not drop: ${index.name}`);
        }
      }
    }

    // Create optimized indexes
    console.log("\n✨ Creating new optimized indexes...");

    // 1. Unique constraint: one fee per student per month/year
    await feeCollection.createIndex(
      { studentId: 1, month: 1, year: 1 },
      { unique: true, background: true, name: "unique_student_month_year" },
    );
    console.log("   ✓ unique_student_month_year");

    // 2. Individual field indexes
    await feeCollection.createIndex(
      { studentId: 1 },
      { background: true, name: "idx_studentId" },
    );
    console.log("   ✓ idx_studentId");

    await feeCollection.createIndex(
      { status: 1 },
      { background: true, name: "idx_status" },
    );
    console.log("   ✓ idx_status");

    await feeCollection.createIndex(
      { year: 1 },
      { background: true, name: "idx_year" },
    );
    console.log("   ✓ idx_year");

    await feeCollection.createIndex(
      { month: 1 },
      { background: true, name: "idx_month" },
    );
    console.log("   ✓ idx_month");

    await feeCollection.createIndex(
      { generatedDate: 1 },
      { background: true, name: "idx_generatedDate" },
    );
    console.log("   ✓ idx_generatedDate");

    await feeCollection.createIndex(
      { dueDate: 1 },
      { background: true, name: "idx_dueDate" },
    );
    console.log("   ✓ idx_dueDate");

    await feeCollection.createIndex(
      { paidDate: 1 },
      { background: true, name: "idx_paidDate" },
    );
    console.log("   ✓ idx_paidDate");

    await feeCollection.createIndex(
      { sentToWhatsApp: 1 },
      { background: true, name: "idx_sentToWhatsApp" },
    );
    console.log("   ✓ idx_sentToWhatsApp");

    await feeCollection.createIndex(
      { remainingBalance: 1 },
      { background: true, name: "idx_remainingBalance" },
    );
    console.log("   ✓ idx_remainingBalance");

    // 3. Compound indexes for common query patterns
    await feeCollection.createIndex(
      { status: 1, year: 1, month: 1 },
      { background: true, name: "idx_status_year_month" },
    );
    console.log("   ✓ idx_status_year_month");

    await feeCollection.createIndex(
      { generatedDate: 1, status: 1 },
      { background: true, name: "idx_generatedDate_status" },
    );
    console.log("   ✓ idx_generatedDate_status");

    await feeCollection.createIndex(
      { paidDate: 1, status: 1 },
      { background: true, name: "idx_paidDate_status" },
    );
    console.log("   ✓ idx_paidDate_status");

    await feeCollection.createIndex(
      { studentId: 1, status: 1, year: 1, month: 1 },
      { background: true, name: "idx_student_status_year_month" },
    );
    console.log("   ✓ idx_student_status_year_month");

    await feeCollection.createIndex(
      { status: 1, dueDate: 1 },
      { background: true, name: "idx_status_dueDate" },
    );
    console.log("   ✓ idx_status_dueDate (for overdue detection)");

    await feeCollection.createIndex(
      { sentToWhatsApp: 1, status: 1, generatedDate: 1 },
      { background: true, name: "idx_whatsapp_status_date" },
    );
    console.log("   ✓ idx_whatsapp_status_date");

    // 4. Text index for search (optional, can be heavy)
    // Uncomment if you want full-text search capability
    /*
    await feeCollection.createIndex(
      { "studentId.studentName": "text", "studentId.fatherName": "text" },
      { background: true, name: "idx_text_search" }
    );
    console.log("   ✓ idx_text_search");
    */

    console.log("\n📈 Analyzing indexes...");
    const finalIndexes = await feeCollection.indexes();
    console.log(`   Total indexes: ${finalIndexes.length}`);

    // Get collection stats
    const stats = await db
      .collection("fees")
      .aggregate([{ $collStats: { latencyStats: {} } }])
      .toArray();
    const collStats = stats[0] || {};
    console.log(`\n📊 Collection Stats:`);
    console.log(`   Documents: ${collStats.count || 0}`);
    console.log(
      `   Total Size: ${((collStats.size || 0) / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `   Index Size: ${((collStats.totalIndexSize || 0) / 1024 / 1024).toFixed(2)} MB`,
    );
    console.log(
      `   Average Document Size: ${((collStats.avgObjSize || 0) / 1024).toFixed(2)} KB`,
    );

    console.log("\n✅ Database optimization complete!");
    console.log("\n💡 Recommended next steps:");
    console.log("   1. Monitor query performance using MongoDB profiler");
    console.log("   2. Review slow queries in MongoDB logs");
    console.log("   3. Consider adding text index if search is slow");
    console.log("   4. Run this script after major data imports");

    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  } catch (error) {
    console.error("\n❌ Error optimizing database:", error);
    process.exit(1);
  }
}

// Run optimization
optimizeDatabase();
