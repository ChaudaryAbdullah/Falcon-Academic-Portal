import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function createIndexes() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;
    const studentsCollection = db.collection("students");

    // Get existing indexes
    const existingIndexes = await studentsCollection.indexes();
    console.log("📋 Existing indexes:");
    existingIndexes.forEach((idx) => {
      console.log(
        `  - ${JSON.stringify(idx.key)} ${idx.unique ? "(unique)" : ""}`,
      );
    });

    console.log("\n📊 Creating new indexes...\n");

    // Helper function to check if index exists
    const indexExists = (key) => {
      return existingIndexes.some(
        (idx) => JSON.stringify(idx.key) === JSON.stringify(key),
      );
    };

    // Helper function to create index if it doesn't exist
    const createIndexIfNotExists = async (key, options = {}) => {
      const keyStr = JSON.stringify(key);
      if (indexExists(key)) {
        console.log(`  ⏭️  ${keyStr} - Already exists, skipping`);
        return;
      }
      try {
        await studentsCollection.createIndex(key, options);
        console.log(`  ✓ ${keyStr} - Created successfully`);
      } catch (error) {
        console.log(`  ⚠️  ${keyStr} - Error: ${error.message}`);
      }
    };

    // Single field indexes
    await createIndexIfNotExists({ status: 1 });
    await createIndexIfNotExists({ class: 1 });
    await createIndexIfNotExists({ section: 1 });
    await createIndexIfNotExists({ studentName: 1 });
    await createIndexIfNotExists({ fatherName: 1 });
    await createIndexIfNotExists({ gender: 1 });
    await createIndexIfNotExists({ fatherOccupation: 1 });

    // Compound indexes for common queries
    await createIndexIfNotExists({ class: 1, section: 1 });
    await createIndexIfNotExists({ status: 1, class: 1 });
    await createIndexIfNotExists({ status: 1, class: 1, section: 1 });
    await createIndexIfNotExists({ class: 1, status: 1 });

    // Text index for search (if not exists)
    const hasTextIndex = existingIndexes.some((idx) => idx.key._fts === "text");
    if (!hasTextIndex) {
      try {
        await studentsCollection.createIndex(
          {
            studentName: "text",
            fatherName: "text",
            rollNumber: "text",
          },
          {
            weights: {
              rollNumber: 10,
              studentName: 5,
              fatherName: 3,
            },
            name: "student_text_search",
          },
        );
        console.log("  ✓ Text search index - Created successfully");
      } catch (error) {
        console.log(`  ⚠️  Text search index - ${error.message}`);
      }
    } else {
      console.log("  ⏭️  Text search index - Already exists, skipping");
    }

    console.log("\n✅ Index creation completed!\n");

    // Show final index list
    const finalIndexes = await studentsCollection.indexes();
    console.log("📋 Final index list:");
    finalIndexes.forEach((idx) => {
      const unique = idx.unique ? " [UNIQUE]" : "";
      const text = idx.key._fts === "text" ? " [TEXT]" : "";
      console.log(`  - ${JSON.stringify(idx.key)}${unique}${text}`);
    });

    console.log(`\n📊 Total indexes: ${finalIndexes.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createIndexes();
