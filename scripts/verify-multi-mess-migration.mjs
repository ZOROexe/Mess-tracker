import mongoose from "mongoose";

const LEGACY_MESS_NAME = "Existing Mess";
const MULTI_MESS_SNAPSHOT_MIGRATION = "multi-mess-legacy-v1";
const MEAL_OPTION_SNAPSHOT_MIGRATION = "legacy-meal-options-v1";
const MEAL_NAMES = ["breakfast", "lunch", "dinner"];
const MAX_PROBLEMS_TO_PRINT = 20;
const OLD_PRICING_INDEX = "userId_1_effectiveFrom_1";
const NEW_PRICING_INDEX = "userId_1_messId_1_effectiveFrom_1";

const legacyMealSources = {
  breakfast: { mess_regular: { name: "Regular", pricingField: "breakfast" } },
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

function hasMessId(record) {
  return record?.messId !== undefined && record.messId !== null;
}

function hasIndexKeys(index, expectedKeys) {
  return Object.entries(expectedKeys).every(([key, direction]) => index.key[key] === direction)
    && Object.keys(index.key).length === Object.keys(expectedKeys).length;
}

function sameValue(first, second) {
  return Object.is(first, second);
}

function sameId(first, second) {
  return String(first) === String(second);
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

function validPrice(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

async function getIndexes(collection) {
  return collection.listIndexes().toArray().catch((error) => {
    if (error?.code === 26) return [];
    throw error;
  });
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not defined. Set it before running verification.");
  await mongoose.connect(process.env.MONGO_URI);
  const database = mongoose.connection.db;
  if (!database) throw new Error("MongoDB connection was not established.");

  const collections = {
    foodEntries: database.collection("foodentries"),
    messes: database.collection("messes"),
    legacyPrices: database.collection("messpricings"),
    options: database.collection("messmealoptions"),
    optionPrices: database.collection("messmealoptionprices"),
    multiMessSnapshots: database.collection("multi_mess_migration_snapshots"),
    mealOptionSnapshots: database.collection("legacy_meal_option_migration_snapshots"),
  };
  const [foodUserIds, pricingUserIds, optionUserIds] = await Promise.all([
    collections.foodEntries.distinct("userId", { userId: { $type: "string" } }),
    collections.legacyPrices.distinct("userId", { userId: { $type: "string" } }),
    collections.options.distinct("userId", { userId: { $type: "string" } }),
  ]);
  const users = new Set([...foodUserIds, ...pricingUserIds, ...optionUserIds]);
  const messCache = new Map();
  const optionCache = new Map();
  const multiMessSnapshotCache = new Map();
  const mealOptionSnapshotCache = new Map();
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
    legacyMealsChecked: 0,
    legacyMealsMissingOption: 0,
    invalidOptionOwnership: 0,
    optionMessMismatch: 0,
    optionMealMismatch: 0,
    optionNameMismatch: 0,
    optionSnapshotsMissing: 0,
    changedLegacyFoodCosts: 0,
    legacyPriceValuesChecked: 0,
    missingOptionPriceHistory: 0,
    incorrectOptionPriceHistory: 0,
    optionIndexMissing: 0,
    optionIndexNotUnique: 0,
    optionPriceIndexMissing: 0,
    optionPriceIndexNotUnique: 0,
    duplicateOptionPriceCombinations: 0,
  };

  const addProblem = (message) => {
    if (problems.length < MAX_PROBLEMS_TO_PRINT) problems.push(message);
  };
  const getMess = async (messId) => {
    const key = String(messId);
    if (!messCache.has(key)) messCache.set(key, await collections.messes.findOne({ _id: messId }));
    return messCache.get(key);
  };
  const getOption = async (optionId) => {
    const key = String(optionId);
    if (!optionCache.has(key)) optionCache.set(key, await collections.options.findOne({ _id: optionId }));
    return optionCache.get(key);
  };
  const getMultiMessSnapshot = async (recordType, recordId) => {
    const key = `${recordType}:${recordId}`;
    if (!multiMessSnapshotCache.has(key)) {
      multiMessSnapshotCache.set(key, await collections.multiMessSnapshots.findOne({ migration: MULTI_MESS_SNAPSHOT_MIGRATION, recordType, recordId }));
    }
    return multiMessSnapshotCache.get(key);
  };
  const getMealOptionSnapshot = async (recordId) => {
    const key = String(recordId);
    if (!mealOptionSnapshotCache.has(key)) {
      mealOptionSnapshotCache.set(key, await collections.mealOptionSnapshots.findOne({ migration: MEAL_OPTION_SNAPSHOT_MIGRATION, recordId }));
    }
    return mealOptionSnapshotCache.get(key);
  };

  for await (const entry of collections.foodEntries.find({})) {
    summary.foodEntriesChecked += 1;
    const snapshot = await getMultiMessSnapshot("foodEntry", entry._id);
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
        } else {
          const mess = await getMess(meal.messId);
          if (!mess || mess.userId !== entry.userId) {
            summary.invalidMessOwnership += 1;
            addProblem(`Food entry ${entry._id} ${mealName} meal references a missing or foreign mess.`);
          }
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

      const mapping = legacyMealSources[mealName][meal?.source];
      if (!mapping) continue;
      summary.legacyMealsChecked += 1;
      const optionSnapshot = await getMealOptionSnapshot(entry._id);
      if (!optionSnapshot) {
        summary.optionSnapshotsMissing += 1;
        addProblem(`Legacy food entry ${entry._id} has no meal-option migration snapshot.`);
      } else if (!foodSnapshotMatches(entry, optionSnapshot.value)) {
        summary.changedLegacyFoodCosts += 1;
        addProblem(`Legacy food entry ${entry._id} changed source, cost, or total after option migration.`);
      }
      if (!meal.mealOptionId) {
        summary.legacyMealsMissingOption += 1;
        addProblem(`Legacy food entry ${entry._id} ${mealName} is missing mealOptionId.`);
        continue;
      }
      const option = await getOption(meal.mealOptionId);
      if (!option || option.userId !== entry.userId) {
        summary.invalidOptionOwnership += 1;
        addProblem(`Legacy food entry ${entry._id} ${mealName} references a missing or foreign meal option.`);
        continue;
      }
      if (!sameId(option.messId, meal.messId)) {
        summary.optionMessMismatch += 1;
        addProblem(`Legacy food entry ${entry._id} ${mealName} option belongs to another mess.`);
      }
      if (option.meal !== mealName) {
        summary.optionMealMismatch += 1;
        addProblem(`Legacy food entry ${entry._id} ${mealName} option belongs to ${option.meal}.`);
      }
      if (option.name !== mapping.name || meal.mealOptionName !== mapping.name) {
        summary.optionNameMismatch += 1;
        addProblem(`Legacy food entry ${entry._id} ${mealName} does not retain the ${mapping.name} option name.`);
      }
    }
  }

  for await (const pricing of collections.legacyPrices.find({})) {
    summary.pricingRecordsChecked += 1;
    const snapshot = await getMultiMessSnapshot("messPricing", pricing._id);
    if (!snapshot) {
      summary.pricingSnapshotsMissing += 1;
      addProblem(`Pricing record ${pricing._id} has no pre-migration snapshot.`);
    } else if (!pricingSnapshotMatches(pricing, snapshot.value)) {
      summary.changedPricingValues += 1;
      addProblem(`Pricing record ${pricing._id} differs from its pre-migration price/effectiveFrom snapshot.`);
    }
    if (snapshot && hasMessId(snapshot.value.messId) && !sameId(pricing.messId, snapshot.value.messId)) {
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
      continue;
    }

    for (const mapping of pricingMappings) {
      const price = pricing[mapping.pricingField];
      if (!validPrice(price)) continue;
      summary.legacyPriceValuesChecked += 1;
      const option = await collections.options.findOne({ userId: pricing.userId, messId: pricing.messId, meal: mapping.meal, name: mapping.name });
      if (!option) {
        summary.missingOptionPriceHistory += 1;
        addProblem(`Pricing record ${pricing._id} is missing ${mapping.meal} ${mapping.name} option history.`);
        continue;
      }
      const optionPrice = await collections.optionPrices.findOne({
        userId: pricing.userId,
        messId: pricing.messId,
        mealOptionId: option._id,
        effectiveFrom: pricing.effectiveFrom,
      });
      if (!optionPrice) {
        summary.missingOptionPriceHistory += 1;
        addProblem(`Pricing record ${pricing._id} is missing ${mapping.meal} ${mapping.name} price on ${pricing.effectiveFrom}.`);
      } else if (Number(optionPrice.price) !== price) {
        summary.incorrectOptionPriceHistory += 1;
        addProblem(`Pricing record ${pricing._id} has incorrect ${mapping.meal} ${mapping.name} price history on ${pricing.effectiveFrom}.`);
      }
    }
  }

  const duplicates = await collections.messes.aggregate([
    { $match: { name: LEGACY_MESS_NAME } },
    { $group: { _id: "$userId", count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();
  summary.duplicateLegacyMesses = duplicates.reduce((total, duplicate) => total + duplicate.count - 1, 0);
  for (const duplicate of duplicates) addProblem(`User ${duplicate._id} has ${duplicate.count} legacy "${LEGACY_MESS_NAME}" messes.`);

  const [legacyPricingIndexes, optionIndexes, optionPriceIndexes] = await Promise.all([
    getIndexes(collections.legacyPrices), getIndexes(collections.options), getIndexes(collections.optionPrices),
  ]);
  const oldPricingIndex = legacyPricingIndexes.find((index) => index.name === OLD_PRICING_INDEX);
  const newPricingIndex = legacyPricingIndexes.find((index) => index.name === NEW_PRICING_INDEX);
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

  const optionIndex = optionIndexes.find((index) => hasIndexKeys(index, { userId: 1, messId: 1, meal: 1, name: 1 }));
  if (!optionIndex) {
    summary.optionIndexMissing = 1;
    addProblem("Required meal-option unique index is missing.");
  } else if (!optionIndex.unique) {
    summary.optionIndexNotUnique = 1;
    addProblem("Required meal-option index is not unique.");
  }
  const optionPriceIndex = optionPriceIndexes.find((index) => hasIndexKeys(index, { userId: 1, messId: 1, mealOptionId: 1, effectiveFrom: 1 }));
  if (!optionPriceIndex) {
    summary.optionPriceIndexMissing = 1;
    addProblem("Required meal-option-price unique index is missing.");
  } else if (!optionPriceIndex.unique) {
    summary.optionPriceIndexNotUnique = 1;
    addProblem("Required meal-option-price index is not unique.");
  }

  const [pricingDuplicates, optionPriceDuplicates] = await Promise.all([
    collections.legacyPrices.aggregate([
      { $match: { messId: { $exists: true, $ne: null } } },
      { $group: { _id: { userId: "$userId", messId: "$messId", effectiveFrom: "$effectiveFrom" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray(),
    collections.optionPrices.aggregate([
      { $group: { _id: { userId: "$userId", messId: "$messId", mealOptionId: "$mealOptionId", effectiveFrom: "$effectiveFrom" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]).toArray(),
  ]);
  summary.duplicatePricingCombinations = pricingDuplicates.length;
  summary.duplicateOptionPriceCombinations = optionPriceDuplicates.length;
  for (const duplicate of pricingDuplicates) addProblem(`Duplicate legacy pricing combination: ${JSON.stringify(duplicate._id)} (${duplicate.count} records).`);
  for (const duplicate of optionPriceDuplicates) addProblem(`Duplicate option-price combination: ${JSON.stringify(duplicate._id)} (${duplicate.count} records).`);

  console.log("Migration verification");
  console.log("----------------------");
  console.log(`Users checked: ${users.size}`);
  for (const [label, value] of Object.entries(summary)) console.log(`${label}: ${value}`);

  const checkedKeys = new Set(["foodEntriesChecked", "messMealsChecked", "pricingRecordsChecked", "legacyMealsChecked", "legacyPriceValuesChecked"]);
  const failures = Object.entries(summary)
    .filter(([key]) => !checkedKeys.has(key))
    .reduce((total, [, value]) => total + value, 0);
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
