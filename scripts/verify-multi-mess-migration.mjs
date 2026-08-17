import mongoose from "mongoose";

const LEGACY_MESS_NAME = "Existing Mess";
const SNAPSHOT_MIGRATION = "multi-mess-legacy-v1";
const MEAL_NAMES = ["breakfast", "lunch", "dinner"];
const MAX_PROBLEMS_TO_PRINT = 20;
const OLD_PRICING_INDEX = "userId_1_effectiveFrom_1";
const NEW_PRICING_INDEX = "userId_1_messId_1_effectiveFrom_1";

function hasMessId(record) {
  return record?.messId !== undefined && record.messId !== null;
}

function sameValue(first, second) {
  return Object.is(first, second);
}

function hasIndexKeys(index, expectedKeys) {
  return Object.entries(expectedKeys).every(([key, direction]) => index.key[key] === direction)
    && Object.keys(index.key).length === Object.keys(expectedKeys).length;
}

function foodSnapshotMatches(entry, snapshot) {
  return MEAL_NAMES.every((mealName) => (
    sameValue(entry[mealName]?.source, snapshot[mealName]?.source)
    && sameValue(entry[mealName]?.cost, snapshot[mealName]?.cost)
  )) && sameValue(entry.totalCost, snapshot.totalCost);
}

function pricingSnapshotMatches(pricing, snapshot) {
  return ["breakfast", "lunch_regular", "lunch_chicken", "dinner_regular", "dinner_chicken", "effectiveFrom"]
    .every((field) => sameValue(pricing[field], snapshot[field]));
}

function sameMessId(first, second) {
  return String(first) === String(second);
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined. Set it before running verification.");
  await mongoose.connect(process.env.MONGO_URI);
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB connection was not established.");

  const foodEntries = database.collection("foodentries");
  const messes = database.collection("messes");
  const messPricings = database.collection("messpricings");
  const snapshots = database.collection("multi_mess_migration_snapshots");
  const [foodUserIds, pricingUserIds] = await Promise.all([
    foodEntries.distinct("userId", { userId: { $type: "string" } }),
    messPricings.distinct("userId", { userId: { $type: "string" } }),
  ]);
  const users = new Set([...foodUserIds, ...pricingUserIds]);
  const messCache = new Map();
  const snapshotCache = new Map();
  const problems = [];
  const summary = {
    foodEntriesChecked: 0,
    messMealsChecked: 0,
    mealsMissingMessId: 0,
    invalidMessOwnership: 0,
    outsideMealsWithMessId: 0,
    noneMealsWithMessId: 0,
    pricingRecordsChecked: 0,
    pricingRecordsMissingMessId: 0,
    invalidPricingOwnership: 0,
    duplicateLegacyMesses: 0,
    foodSnapshotsMissing: 0,
    changedFoodCosts: 0,
    pricingSnapshotsMissing: 0,
    changedPricingValues: 0,
    overwrittenPricingMessIds: 0,
    oldPricingIndexPresent: 0,
    newPricingIndexMissing: 0,
    newPricingIndexNotUnique: 0,
    duplicatePricingCombinations: 0,
  };

  const addProblem = (message) => {
    if (problems.length < MAX_PROBLEMS_TO_PRINT) problems.push(message);
  };
  const getMess = async (messId) => {
    const key = String(messId);
    if (!messCache.has(key)) messCache.set(key, await messes.findOne({ _id: messId }));
    return messCache.get(key);
  };
  const getSnapshot = async (recordType, recordId) => {
    const key = `${recordType}:${recordId}`;
    if (!snapshotCache.has(key)) {
      snapshotCache.set(key, await snapshots.findOne({ migration: SNAPSHOT_MIGRATION, recordType, recordId }));
    }
    return snapshotCache.get(key);
  };

  for await (const entry of foodEntries.find({})) {
    summary.foodEntriesChecked += 1;
    const snapshot = await getSnapshot("foodEntry", entry._id);
    if (!snapshot) {
      summary.foodSnapshotsMissing += 1;
      addProblem(`Food entry ${entry._id} has no pre-migration snapshot.`);
    } else if (!foodSnapshotMatches(entry, snapshot.value)) {
      summary.changedFoodCosts += 1;
      addProblem(`Food entry ${entry._id} differs from its pre-migration cost/source snapshot.`);
    }

    for (const mealName of MEAL_NAMES) {
      const meal = entry[mealName];
      if (meal?.source === "mess") {
        summary.messMealsChecked += 1;
        if (!hasMessId(meal)) {
          summary.mealsMissingMessId += 1;
          addProblem(`Food entry ${entry._id} ${mealName} meal is missing messId.`);
          continue;
        }
        const mess = await getMess(meal.messId);
        if (!mess || mess.userId !== entry.userId) {
          summary.invalidMessOwnership += 1;
          addProblem(`Food entry ${entry._id} ${mealName} meal references a missing or foreign mess.`);
        }
      }
      if (meal?.source === "outside" && hasMessId(meal)) {
        summary.outsideMealsWithMessId += 1;
        addProblem(`Food entry ${entry._id} ${mealName} outside meal has messId.`);
      }
      if (meal?.source === "none" && hasMessId(meal)) {
        summary.noneMealsWithMessId += 1;
        addProblem(`Food entry ${entry._id} ${mealName} none meal has messId.`);
      }
    }
  }

  for await (const pricing of messPricings.find({})) {
    summary.pricingRecordsChecked += 1;
    const snapshot = await getSnapshot("messPricing", pricing._id);
    if (!snapshot) {
      summary.pricingSnapshotsMissing += 1;
      addProblem(`Pricing record ${pricing._id} has no pre-migration snapshot.`);
    } else if (!pricingSnapshotMatches(pricing, snapshot.value)) {
      summary.changedPricingValues += 1;
      addProblem(`Pricing record ${pricing._id} differs from its pre-migration price/effectiveFrom snapshot.`);
    }
    if (snapshot && hasMessId(snapshot.value.messId) && !sameMessId(pricing.messId, snapshot.value.messId)) {
      summary.overwrittenPricingMessIds += 1;
      addProblem(`Pricing record ${pricing._id} had its existing messId overwritten.`);
    }
    if (!hasMessId(pricing)) {
      summary.pricingRecordsMissingMessId += 1;
      addProblem(`Pricing record ${pricing._id} is missing messId.`);
      continue;
    }
    const mess = await getMess(pricing.messId);
    if (!mess || mess.userId !== pricing.userId) {
      summary.invalidPricingOwnership += 1;
      addProblem(`Pricing record ${pricing._id} references a missing or foreign mess.`);
    }
  }

  const duplicates = await messes.aggregate([
    { $match: { name: LEGACY_MESS_NAME } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();
  summary.duplicateLegacyMesses = duplicates.reduce((total, duplicate) => total + duplicate.count - 1, 0);
  for (const duplicate of duplicates) {
    addProblem(`User ${duplicate._id} has ${duplicate.count} legacy "${LEGACY_MESS_NAME}" messes.`);
  }

  let pricingIndexes = [];
  try {
    pricingIndexes = await messPricings.listIndexes().toArray();
  } catch (error) {
    if (error?.code !== 26) throw error;
  }
  const oldPricingIndex = pricingIndexes.find((index) => index.name === OLD_PRICING_INDEX);
  const newPricingIndex = pricingIndexes.find((index) => index.name === NEW_PRICING_INDEX);
  if (oldPricingIndex?.unique && hasIndexKeys(oldPricingIndex, { userId: 1, effectiveFrom: 1 })) {
    summary.oldPricingIndexPresent = 1;
    addProblem(`Obsolete pricing index ${OLD_PRICING_INDEX} still exists.`);
  }
  if (!newPricingIndex || !hasIndexKeys(newPricingIndex, { userId: 1, messId: 1, effectiveFrom: 1 })) {
    summary.newPricingIndexMissing = 1;
    addProblem(`Required pricing index ${NEW_PRICING_INDEX} is missing.`);
  } else if (!newPricingIndex.unique) {
    summary.newPricingIndexNotUnique = 1;
    addProblem(`Required pricing index ${NEW_PRICING_INDEX} is not unique.`);
  }

  const pricingDuplicates = await messPricings.aggregate([
    { $match: { messId: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: { userId: "$userId", messId: "$messId", effectiveFrom: "$effectiveFrom" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();
  summary.duplicatePricingCombinations = pricingDuplicates.length;
  for (const duplicate of pricingDuplicates) {
    addProblem(`Duplicate pricing combination: ${JSON.stringify(duplicate._id)} (${duplicate.count} records).`);
  }

  console.log("Migration verification");
  console.log("----------------------");
  console.log(`Users checked: ${users.size}`);
  console.log(`Food entries checked: ${summary.foodEntriesChecked}`);
  console.log(`Mess meals checked: ${summary.messMealsChecked}`);
  console.log(`Meals missing messId: ${summary.mealsMissingMessId}`);
  console.log(`Invalid mess ownership: ${summary.invalidMessOwnership}`);
  console.log(`Outside meals with messId: ${summary.outsideMealsWithMessId}`);
  console.log(`None meals with messId: ${summary.noneMealsWithMessId}`);
  console.log(`Pricing records checked: ${summary.pricingRecordsChecked}`);
  console.log(`Pricing records missing messId: ${summary.pricingRecordsMissingMessId}`);
  console.log(`Invalid pricing ownership: ${summary.invalidPricingOwnership}`);
  console.log(`Duplicate legacy messes: ${summary.duplicateLegacyMesses}`);
  console.log(`Food snapshots missing: ${summary.foodSnapshotsMissing}`);
  console.log(`Food costs/source values changed: ${summary.changedFoodCosts}`);
  console.log(`Pricing snapshots missing: ${summary.pricingSnapshotsMissing}`);
  console.log(`Pricing values/effectiveFrom changed: ${summary.changedPricingValues}`);
  console.log(`Existing pricing messIds overwritten: ${summary.overwrittenPricingMessIds}`);
  console.log(`Obsolete pricing index present: ${summary.oldPricingIndexPresent}`);
  console.log(`Required pricing index missing: ${summary.newPricingIndexMissing}`);
  console.log(`Required pricing index not unique: ${summary.newPricingIndexNotUnique}`);
  console.log(`Duplicate pricing combinations: ${summary.duplicatePricingCombinations}`);

  const failures = Object.values(summary).reduce((total, value) => total + value, 0) - summary.foodEntriesChecked - summary.messMealsChecked - summary.pricingRecordsChecked;
  if (failures === 0) {
    console.log("\nMigration verification PASSED");
  } else {
    console.log("\nMigration verification FAILED");
    for (const problem of problems) console.log(`- ${problem}`);
    if (failures > problems.length) console.log(`- ${failures - problems.length} additional problem(s) not shown.`);
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Migration verification failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
