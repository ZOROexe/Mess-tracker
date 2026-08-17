import mongoose from "mongoose";

const LEGACY_MESS_NAME = "Existing Mess";
const SNAPSHOT_MIGRATION = "multi-mess-legacy-v1";
const BATCH_SIZE = 500;
const dryRun = process.argv.includes("--dry-run");

function hasNoMessId(record) {
  return record?.messId === undefined || record.messId === null;
}

function hasIndexKeys(index, expectedKeys) {
  return Object.entries(expectedKeys).every(([key, direction]) => index.key[key] === direction)
    && Object.keys(index.key).length === Object.keys(expectedKeys).length;
}

async function ensureUniqueMessNameIndex(messes) {
  let indexes;
  try {
    indexes = await messes.listIndexes().toArray();
  } catch (error) {
    // A pre-migration database may not have a messes collection yet.
    if (error?.code !== 26) throw error;
    indexes = [];
  }
  const index = indexes.find((candidate) => hasIndexKeys(candidate, { userId: 1, name: 1 }));

  if (index?.unique) return;
  if (index) {
    throw new Error("The Mess { userId, name } index is not unique. Refusing to run an unsafe migration.");
  }
  if (dryRun) {
    console.log("DRY RUN: the required unique Mess { userId, name } index would be created.");
    return;
  }

  await messes.createIndex({ userId: 1, name: 1 }, { unique: true });
}

async function ensureSnapshotIndex(snapshots) {
  if (!dryRun) {
    await snapshots.createIndex(
      { migration: 1, recordType: 1, recordId: 1 },
      { unique: true },
    );
  }
}

async function getOrCreateLegacyMess(messes, userId) {
  const existing = await messes.findOne({ userId, name: LEGACY_MESS_NAME });
  if (existing) return existing;

  if (dryRun) {
    return { _id: new mongoose.Types.ObjectId(), userId, name: LEGACY_MESS_NAME, isDryRun: true };
  }

  try {
    return await messes.findOneAndUpdate(
      { userId, name: LEGACY_MESS_NAME },
      {
        $setOnInsert: {
          userId,
          name: LEGACY_MESS_NAME,
          mealSchedule: { breakfast: true, lunch: true, dinner: true },
          billingCycle: "monthly",
          billingConfig: { startDay: 0, monthlyStartDay: 1 },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
  } catch (error) {
    // Another migration can win the race after the initial read. The unique
    // compound index makes this safe; reuse the mess it inserted instead.
    if (error?.code === 11000) {
      const racedMess = await messes.findOne({ userId, name: LEGACY_MESS_NAME });
      if (racedMess) return racedMess;
    }
    throw error;
  }
}

function foodSnapshot(entry) {
  return {
    breakfast: { source: entry.breakfast?.source, cost: entry.breakfast?.cost },
    lunch: { source: entry.lunch?.source, cost: entry.lunch?.cost },
    dinner: { source: entry.dinner?.source, cost: entry.dinner?.cost },
    totalCost: entry.totalCost,
  };
}

function pricingSnapshot(pricing) {
  return {
    messId: pricing.messId,
    breakfast: pricing.breakfast,
    lunch_regular: pricing.lunch_regular,
    lunch_chicken: pricing.lunch_chicken,
    dinner_regular: pricing.dinner_regular,
    dinner_chicken: pricing.dinner_chicken,
    effectiveFrom: pricing.effectiveFrom,
  };
}

async function snapshotUserRecords({ foodEntries, messPricings, snapshots }, userId) {
  if (dryRun) return;

  const snapshotRecords = [];
  for await (const entry of foodEntries.find({ userId })) {
    snapshotRecords.push({
      updateOne: {
        filter: { migration: SNAPSHOT_MIGRATION, recordType: "foodEntry", recordId: entry._id },
        update: { $setOnInsert: { migration: SNAPSHOT_MIGRATION, recordType: "foodEntry", recordId: entry._id, userId, value: foodSnapshot(entry), capturedAt: new Date() } },
        upsert: true,
      },
    });
    if (snapshotRecords.length >= BATCH_SIZE) {
      await snapshots.bulkWrite(snapshotRecords, { ordered: false });
      snapshotRecords.length = 0;
    }
  }
  for await (const pricing of messPricings.find({ userId })) {
    snapshotRecords.push({
      updateOne: {
        filter: { migration: SNAPSHOT_MIGRATION, recordType: "messPricing", recordId: pricing._id },
        update: { $setOnInsert: { migration: SNAPSHOT_MIGRATION, recordType: "messPricing", recordId: pricing._id, userId, value: pricingSnapshot(pricing), capturedAt: new Date() } },
        upsert: true,
      },
    });
    if (snapshotRecords.length >= BATCH_SIZE) {
      await snapshots.bulkWrite(snapshotRecords, { ordered: false });
      snapshotRecords.length = 0;
    }
  }
  if (snapshotRecords.length > 0) await snapshots.bulkWrite(snapshotRecords, { ordered: false });
}

async function updateFoodEntries(foodEntries, userId, messId) {
const cursor = foodEntries.find({
  userId,
  $or: [
    {
      "breakfast.source": {
        $in: ["mess", "mess_regular", "mess_chicken"],
      },
      "breakfast.messId": { $in: [null] },
    },
    {
      "lunch.source": {
        $in: ["mess", "mess_regular", "mess_chicken"],
      },
      "lunch.messId": { $in: [null] },
    },
    {
      "dinner.source": {
        $in: ["mess", "mess_regular", "mess_chicken"],
      },
      "dinner.messId": { $in: [null] },
    },
  ],
});
  const summary = { foodEntriesUpdated: 0, breakfastUpdated: 0, lunchUpdated: 0, dinnerUpdated: 0 };
  let operations = [];

  const flush = async () => {
    if (!dryRun && operations.length > 0) await foodEntries.bulkWrite(operations, { ordered: false });
    operations = [];
  };

  for await (const entry of cursor) {
    const set = {};
    let entryUpdated = false;
    for (const mealName of ["breakfast", "lunch", "dinner"]) {
      const meal = entry[mealName];
    if (
      ["mess", "mess_regular", "mess_chicken"].includes(meal?.source) &&
      hasNoMessId(meal)
    ) {
        set[`${mealName}.messId`] = messId;
        summary[`${mealName}Updated`] += 1;
        entryUpdated = true;
      }
    }
    if (entryUpdated) {
      summary.foodEntriesUpdated += 1;
      operations.push({ updateOne: { filter: { _id: entry._id }, update: { $set: set } } });
    }
    if (operations.length >= BATCH_SIZE) await flush();
  }
  await flush();
  return summary;
}

async function migrateUser(collections, userId) {
  await snapshotUserRecords(collections, userId);
  const legacyMess = await getOrCreateLegacyMess(collections.messes, userId);
  const foodSummary = await updateFoodEntries(collections.foodEntries, userId, legacyMess._id);
  const pricingFilter = { userId, $or: [{ messId: { $exists: false } }, { messId: null }] };
  const pricingUpdated = dryRun
    ? await collections.messPricings.countDocuments(pricingFilter)
    : (await collections.messPricings.updateMany(pricingFilter, { $set: { messId: legacyMess._id } })).modifiedCount;

  console.log(`User: ${userId}`);
  console.log(`Legacy mess: ${legacyMess.name}`);
  console.log(`Food entries updated: ${foodSummary.foodEntriesUpdated}`);
  console.log(`Breakfast meals updated: ${foodSummary.breakfastUpdated}`);
  console.log(`Lunch meals updated: ${foodSummary.lunchUpdated}`);
  console.log(`Dinner meals updated: ${foodSummary.dinnerUpdated}`);
  console.log(`Pricing records updated: ${pricingUpdated}`);
  console.log("");
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined. Set it before running this migration.");
  await mongoose.connect(process.env.MONGO_URI);
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB connection was not established.");

  const collections = {
    foodEntries: database.collection("foodentries"),
    messes: database.collection("messes"),
    messPricings: database.collection("messpricings"),
    snapshots: database.collection("multi_mess_migration_snapshots"),
  };
  await ensureUniqueMessNameIndex(collections.messes);
  await ensureSnapshotIndex(collections.snapshots);

  const [foodUserIds, pricingUserIds] = await Promise.all([
    collections.foodEntries.distinct("userId", { userId: { $type: "string" } }),
    collections.messPricings.distinct("userId", { userId: { $type: "string" } }),
  ]);
  const userIds = [...new Set([...foodUserIds, ...pricingUserIds])];
  console.log(`${dryRun ? "Dry-running" : "Migrating"} ${userIds.length} user(s) with existing food entries or pricing records.\n`);
  for (const userId of userIds) await migrateUser(collections, userId);

  if (dryRun) console.log("DRY RUN — no database changes were made.");
  else console.log("Existing data migration completed.");
}

main()
  .catch((error) => {
    console.error("Existing data migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
