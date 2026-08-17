import mongoose from "mongoose";

const OLD_INDEX_NAME = "userId_1_effectiveFrom_1";
const NEW_INDEX_NAME = "userId_1_messId_1_effectiveFrom_1";
const OLD_INDEX_KEYS = { userId: 1, effectiveFrom: 1 };
const NEW_INDEX_KEYS = { userId: 1, messId: 1, effectiveFrom: 1 };

function hasIndexKeys(index, expectedKeys) {
  return Object.entries(expectedKeys).every(([key, direction]) => index.key[key] === direction)
    && Object.keys(index.key).length === Object.keys(expectedKeys).length;
}

async function findPricingProblems(messPricings, messes) {
  const missingMessIds = await messPricings.find(
    { $or: [{ messId: { $exists: false } }, { messId: null }] },
    { projection: { _id: 1, userId: 1, effectiveFrom: 1 } },
  ).toArray();

  const invalidOwnership = await messPricings.aggregate([
    { $match: { messId: { $exists: true, $ne: null } } },
    {
      $lookup: {
        from: messes.collectionName,
        let: { pricingMessId: "$messId", pricingUserId: "$userId" },
        pipeline: [{ $match: { $expr: { $and: [
          { $eq: ["$_id", "$$pricingMessId"] },
          { $eq: ["$userId", "$$pricingUserId"] },
        ] } } }],
        as: "ownedMess",
      },
    },
    { $match: { ownedMess: { $eq: [] } } },
    { $project: { _id: 1, userId: 1, messId: 1, effectiveFrom: 1 } },
  ]).toArray();

  const duplicates = await messPricings.aggregate([
    { $match: { messId: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: { userId: "$userId", messId: "$messId", effectiveFrom: "$effectiveFrom" },
        count: { $sum: 1 },
        recordIds: { $push: "$_id" },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  return { missingMessIds, invalidOwnership, duplicates };
}

function printRecords(label, records) {
  if (records.length === 0) return;
  console.error(`\n${label}: ${records.length}`);
  for (const record of records.slice(0, 20)) console.error(JSON.stringify(record));
  if (records.length > 20) console.error(`... ${records.length - 20} additional record(s) omitted.`);
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined. Set it before running this index migration.");
  await mongoose.connect(process.env.MONGO_URI);
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB connection was not established.");

  const messPricings = database.collection("messpricings");
  const messes = database.collection("messes");
  const problems = await findPricingProblems(messPricings, messes);
  printRecords("Pricing records missing messId", problems.missingMessIds);
  printRecords("Pricing records with missing or foreign mess ownership", problems.invalidOwnership);
  printRecords("Duplicate userId + messId + effectiveFrom combinations", problems.duplicates);

  if (problems.missingMessIds.length || problems.invalidOwnership.length || problems.duplicates.length) {
    throw new Error("Pricing records must be migrated and conflicts resolved before changing indexes. No indexes were changed.");
  }

  let indexes = [];
  try {
    indexes = await messPricings.listIndexes().toArray();
  } catch (error) {
    if (error?.code !== 26) throw error;
  }
  const oldIndex = indexes.find((index) => index.name === OLD_INDEX_NAME);
  const newIndex = indexes.find((index) => index.name === NEW_INDEX_NAME);

  if (oldIndex && (!oldIndex.unique || !hasIndexKeys(oldIndex, OLD_INDEX_KEYS))) {
    throw new Error(`Refusing to drop ${OLD_INDEX_NAME}: it is not the expected unique { userId, effectiveFrom } index.`);
  }
  if (newIndex && (!newIndex.unique || !hasIndexKeys(newIndex, NEW_INDEX_KEYS))) {
    throw new Error(`The ${NEW_INDEX_NAME} index exists but is not the expected unique multi-mess index.`);
  }

  if (!newIndex) {
    await messPricings.createIndex(NEW_INDEX_KEYS, { unique: true, name: NEW_INDEX_NAME });
    console.log(`Created ${NEW_INDEX_NAME}.`);
  } else {
    console.log(`${NEW_INDEX_NAME} already exists and is unique.`);
  }

  if (oldIndex) {
    await messPricings.dropIndex(OLD_INDEX_NAME);
    console.log(`Removed obsolete ${OLD_INDEX_NAME}.`);
  } else {
    console.log(`${OLD_INDEX_NAME} is not present.`);
  }
}

main()
  .catch((error) => {
    console.error("Mess-pricing index migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
