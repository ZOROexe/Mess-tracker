import MessPriceModel from "@/models/messPricing";

export async function getActiveMessPricing(userId: string, messId: string, date: string) {
    const pricing = await MessPriceModel.findOne({
        userId,
        messId,
        effectiveFrom: { $lte: date },
    }).sort({ effectiveFrom: -1, createdAt: -1 });

    if (!pricing) {
    throw new Error(`No mess pricing found for mess id ${messId}`);
    }
    
    return pricing;
}
