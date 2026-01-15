import MessPriceModel from "@/models/messPricing";

export async function getActiveMessPricing(date:  string) {
    const pricing = await MessPriceModel.findOne({ effectiveFrom: { $lte: date } }).sort({ effectiveFrom: -1 });

    if (!pricing) {
    throw new Error("No mess pricing found");
    }
    
    return pricing;
}