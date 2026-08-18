import mongoose from "mongoose";

const MIGRATION = "legacy-meal-options-v1";
const BATCH_SIZE = 500;
const MAX_ERRORS_TO_PRINT = 25;
const dryRun = process.argv.includes("--dry-run");
const mealNames = ["breakfast", "lunch", "dinner"];

const legacyMealSources = {
  breakfast: {
    mess_regular: { name: "Regular", pricingField: "breakfast" },
  },
  lunch: {
    mess_regular: { name: "Regular", pricingField: "lunch_regular" },
    mess_chicken: { name: "Chicken", pricingField: "lunch_chicken" },
  },
  dinner: {
    mess_regular: { name: "Regular", pricingField: "dinner_regular" },
    mess_chicken: { name: "Chicken", pricingField: "dinner_chicken" },
  },
};

const pricingMappings = [
  { meal: "breakfast", name: "Regular", pricingField: "breakfast" },
  { meal: "lunch", name: "Regular", pricingField: "lunch_regular" },
  { meal: "lunch", name: "Chicken", pricingField: "lunch_chicken" },
  { meal: "dinner", name: "Regular", pricingField: "dinner_regular" },
  { meal: "dinner", name: "Chicken", pricingField: "dinner_chicken" },
];

function hasIndexKeys(index, expectedKeys) {
  return Object.entries(expectedKeys).every(([key, direction]) => index.key[key] === direction)
    && Object.keys(index.key).length === Object.keys(expectedKeys).length;
}

async function ensureUniqueIndex(collection, keys, name) {
  const indexes = await collection.listIndexes().toArray().catch((error) => {
    if (error?.code === 26) return [];
    throw error;
  });
  const existing = indexes.find((index) => hasIndexKeys(index, keys));
  if (existing?.unique) return;
  if (existing) throw new Error(`${collection.collectionName} has a non-unique index for ${JSON.stringify(keys)}.`);
  if (dryRun) {
    console.log(`DRY RUN: would create ${name} on ${collection.collectionName}.`);
    return;
  }
  await collection.createIndex(keys, { name, unique: true });
}

function optionKey(userId, messId, meal, name) {
  return `${userId}:${messId}:${meal}:${name}`;
}

function snapshotValue(entry) {
  return {
    breakfast: entry.breakfast,
    lunch: entry.lunch,
    dinner: entry.dinner,
    totalCost: entry.totalCost,
  };
}

function validPrice(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined. Set it before running this migration.");
  await mongoose.connect(process.env.MONGO_URI);
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB connection was not established.");

  const collections = {
    foodEntries: database.collection("foodentries"),
    messes: database.collection("messes"),
    legacyPrices: database.collection("messpricings"),
    options: database.collection("messmealoptions"),
    optionPrices: database.collection("messmealoptionprices"),
    snapshots: database.collection("legacy_meal_option_migration_snapshots"),
  };

  await ensureUniqueIndex(collections.options, { userId: 1, messId: 1, meal: 1, name: 1 }, "userId_1_messId_1_meal_1_name_1");
  await ensureUniqueIndex(collections.optionPrices, { userId: 1, messId: 1, mealOptionId: 1, effectiveFrom: 1 }, "userId_1_messId_1_mealOptionId_1_effectiveFrom_1");
  await ensureUniqueIndex(collections.snapshots, { migration: 1, recordId: 1 }, "migration_1_recordId_1");

  const summary = {
    optionsCreated: 0,
    pricesCreated: 0,
    pricesAlreadyPresent: 0,
    entriesMigrated: 0,
    mealsMigrated: 0,
    entriesSkipped: 0,
    priceRecordsSkipped: 0,
    errors: 0,
  };
  const errors = [];
  const optionCache = new Map();
  const messCache = new Map();

  const addError = (message) => {
    summary.errors += 1;
    if (errors.length < MAX_ERRORS_TO_PRINT) errors.push(message);
  };

  const getOwnedMess = async (userId, messId) => {
    const key = `${userId}:${messId}`;
    if (!messCache.has(key)) {
      messCache.set(key, await collections.messes.findOne({ _id: messId, userId }));
    }
    return messCache.get(key);
  };

  const ensureOption = async (userId, messId, meal, name) => {
    const key = optionKey(userId, messId, meal, name);
    if (optionCache.has(key)) return optionCache.get(key);

    const filter = { userId, messId, meal, name };
    let option = await collections.options.findOne(filter);
    if (!option && dryRun) {
      option = { _id: new mongoose.Types.ObjectId(), ...filter, isActive: true };
      summary.optionsCreated += 1;
    } else if (!option) {
      await collections.options.updateOne(filter, {
        $setOnInsert: { ...filter, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      }, { upsert: true });
      option = await collections.options.findOne(filter);
      summary.optionsCreated += 1;
    }

    if (!option) throw new Error(`Could not create or find ${meal} ${name} option for mess ${messId}.`);
    optionCache.set(key, option);
    return option;
  };

  const ensureOptionPrice = async (userId, messId, option, price, effectiveFrom) => {
    const filter = { userId, messId, mealOptionId: option._id, effectiveFrom };
    const existing = await collections.optionPrices.findOne(filter);
    if (existing) {
      if (Number(existing.price) !== price) {
        addError(`Pricing conflict for option ${option._id} on ${effectiveFrom}: existing ₹${existing.price}, legacy ₹${price}.`);
      } else {
        summary.pricesAlreadyPresent += 1;
      }
      return;
    }
    if (!dryRun) {
      await collections.optionPrices.updateOne(filter, {
        $setOnInsert: { ...filter, price, createdAt: new Date(), updatedAt: new Date() },
      }, { upsert: true });
    }
    summary.pricesCreated += 1;
  };

  for await (const legacyPrice of collections.legacyPrices.find({ userId: { $type: "string" } })) {
    if (!legacyPrice.messId || !(await getOwnedMess(legacyPrice.userId, legacyPrice.messId))) {
      summary.priceRecordsSkipped += 1;
      addError(`Legacy pricing ${legacyPrice._id} has no owned messId; run the existing mess-pricing migration first.`);
      continue;
    }
    if (!validDate(legacyPrice.effectiveFrom)) {
      summary.priceRecordsSkipped += 1;
      addError(`Legacy pricing ${legacyPrice._id} has invalid effectiveFrom value.`);
      continue;
    }
    for (const mapping of pricingMappings) {
      const price = legacyPrice[mapping.pricingField];
      if (!validPrice(price)) {
        summary.priceRecordsSkipped += 1;
        addError(`Legacy pricing ${legacyPrice._id} has invalid ${mapping.pricingField} value.`);
        continue;
      }
      const option = await ensureOption(legacyPrice.userId, legacyPrice.messId, mapping.meal, mapping.name);
      await ensureOptionPrice(legacyPrice.userId, legacyPrice.messId, option, price, legacyPrice.effectiveFrom);
    }
  }

  let snapshots = [];
  const flushSnapshots = async () => {
    if (!dryRun && snapshots.length) await collections.snapshots.bulkWrite(snapshots, { ordered: false });
    snapshots = [];
  };

  for await (const entry of collections.foodEntries.find({
    userId: { $type: "string" },
    $or: mealNames.flatMap((meal) => [
      { [`${meal}.source`]: "mess_regular" },
      { [`${meal}.source`]: "mess_chicken" },
    ]),
  })) {
    const updates = {};
    let migratedMeals = 0;
    let skippedEntry = false;

    for (const meal of mealNames) {
      const currentMeal = entry[meal];
      const mapping = legacyMealSources[meal][currentMeal?.source];
      if (!mapping) continue;

      if (currentMeal.mealOptionId) continue;
      if (!currentMeal.messId || !(await getOwnedMess(entry.userId, currentMeal.messId))) {
        skippedEntry = true;
        addError(`Food entry ${entry._id} ${meal} has no owned messId and was not changed.`);
        continue;
      }

      const option = await ensureOption(entry.userId, currentMeal.messId, meal, mapping.name);
      updates[`${meal}.mealOptionId`] = option._id;
      updates[`${meal}.mealOptionName`] = mapping.name;
      migratedMeals += 1;
    }

    if (migratedMeals > 0) {
      snapshots.push({
        updateOne: {
          filter: { migration: MIGRATION, recordId: entry._id },
          update: { $setOnInsert: { migration: MIGRATION, recordId: entry._id, userId: entry.userId, value: snapshotValue(entry), capturedAt: new Date() } },
          upsert: true,
        },
      });
      if (!dryRun) await collections.foodEntries.updateOne({ _id: entry._id }, { $set: updates });
      summary.entriesMigrated += 1;
      summary.mealsMigrated += migratedMeals;
    } else if (skippedEntry) {
      summary.entriesSkipped += 1;
    }
    if (snapshots.length >= BATCH_SIZE) await flushSnapshots();
  }
  await flushSnapshots();

  console.log(`\n${dryRun ? "DRY RUN" : "Migration"} summary`);
  console.log(`Options created: ${summary.optionsCreated}`);
  console.log(`Option prices created: ${summary.pricesCreated}`);
  console.log(`Option prices already present: ${summary.pricesAlreadyPresent}`);
  console.log(`Food entries migrated: ${summary.entriesMigrated}`);
  console.log(`Food meals migrated: ${summary.mealsMigrated}`);
  console.log(`Food entries skipped: ${summary.entriesSkipped}`);
  console.log(`Legacy pricing values skipped: ${summary.priceRecordsSkipped}`);
  console.log(`Errors: ${summary.errors}`);
  for (const error of errors) console.log(`- ${error}`);
  if (summary.errors > errors.length) console.log(`- ${summary.errors - errors.length} additional error(s) not shown.`);
  if (dryRun) console.log("No database changes were made.");
}

main()
  .catch((error) => {
    console.error("Legacy meal-option migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
