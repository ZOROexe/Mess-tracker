import mongoose from "mongoose";

const LEGACY_MESS_NAME = "Existing Mess";
const SNAPSHOT_MIGRATION = "multi-mess-legacy-v1";
const MESS_NAME_INDEX = "userId_1_name_1";
const BATCH_SIZE = 500;
const dryRun = process.argv.includes("--dry-run");

function hasIndexKeys(index, expectedKeys) {
  return Object.entries(expectedKeys).every(([key, direction]) => index.key[key] === direction)
    && Object.keys(index.key).length === Object.keys(expectedKeys).length;
}

async function requireUniqueMessNameIndex(messes) {
  let indexes = [];
  try {
    indexes = await messes.listIndexes().toArray();
  } catch (error) {
    if (error?.code !== 26) throw error;
  }

  const index = indexes.find((candidate) => candidate.name === MESS_NAME_INDEX);
  if (!index || !index.unique || !hasIndexKeys(index, { userId: 1, name: 1 })) {
    throw new Error(
      "The required unique Mess { userId, name } index is missing or invalid. "
      + "Refusing to create legacy messes without database-level duplicate protection.",
    );
  }
}

async function getOrCreateLegacyMess(messes, userId) {
  const existing = await messes.findOne({ userId, name: LEGACY_MESS_NAME });
  if (existing) return existing;

  if (dryRun) {
    return { _id: new mongoose.Types.ObjectId(), userId, name: LEGACY_MESS_NAME };
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
    // The unique index permits one concurrent caller to create the mess.
    if (error?.code === 11000) {
      const racedMess = await messes.findOne({ userId, name: LEGACY_MESS_NAME });
      if (racedMess) return racedMess;
    }
    throw error;
  }
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
    userId: pricing.userId,
  };
}

async function snapshotPricingRecords(snapshots, messPricings, userId) {
  if (dryRun) return;

  let operations = [];
  const flush = async () => {
    if (operations.length > 0) await snapshots.bulkWrite(operations, { ordered: false });
    operations = [];
  };

  for await (const pricing of messPricings.find({ userId })) {
    operations.push({
      updateOne: {
        filter: { migration: SNAPSHOT_MIGRATION, recordType: "messPricing", recordId: pricing._id },
        update: {
          $setOnInsert: {
            migration: SNAPSHOT_MIGRATION,
            recordType: "messPricing",
            recordId: pricing._id,
            userId,
            value: pricingSnapshot(pricing),
            capturedAt: new Date(),
          },
        },
        upsert: true,
      },
    });
    if (operations.length >= BATCH_SIZE) await flush();
  }
  await flush();
}

async function migrateUser({ messes, messPricings, snapshots }, userId) {
  await snapshotPricingRecords(snapshots, messPricings, userId);
  const legacyMess = await getOrCreateLegacyMess(messes, userId);
  const filter = { userId, $or: [{ messId: { $exists: false } }, { messId: null }] };
  const pricingRecordsUpdated = dryRun
    ? await messPricings.countDocuments(filter)
    : (await messPricings.updateMany(filter, { $set: { messId: legacyMess._id } })).modifiedCount;

  console.log(`User: ${userId}`);
  console.log(`Legacy mess: ${legacyMess.name}`);
  console.log(`Pricing records updated: ${pricingRecordsUpdated}`);
  console.log("");
  return pricingRecordsUpdated;
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined. Set it before running this migration.");
  await mongoose.connect(process.env.MONGO_URI);
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB connection was not established.");

  const collections = {
    messes: database.collection("messes"),
    messPricings: database.collection("messpricings"),
    snapshots: database.collection("multi_mess_migration_snapshots"),
  };
  await requireUniqueMessNameIndex(collections.messes);

  const missingMessIdFilter = {
    userId: { $type: "string" },
    $or: [{ messId: { $exists: false } }, { messId: null }],
  };
  const [userIds, pricingRecordsNeedingMessId] = await Promise.all([
    collections.messPricings.distinct("userId", missingMessIdFilter),
    collections.messPricings.countDocuments(missingMessIdFilter),
  ]);

  console.log(`Pricing records needing messId: ${pricingRecordsNeedingMessId}`);
  console.log(`Pricing records that would be assigned to Existing Mess: ${pricingRecordsNeedingMessId}`);
  console.log("");

  let totalUpdated = 0;
  for (const userId of userIds) totalUpdated += await migrateUser(collections, userId);

  if (dryRun) {
    console.log("DRY RUN — no database changes were made.");
  } else {
    console.log(`Legacy pricing migration completed. Pricing records updated: ${totalUpdated}`);
  }
}

main()
  .catch((error) => {
    console.error("Legacy pricing migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
