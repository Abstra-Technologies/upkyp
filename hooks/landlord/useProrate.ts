export function useProrate(currentSubscription: any) {
    return (newPlan: any) => {
        if (!currentSubscription) return newPlan.price || 0;

        const currentPrice = currentSubscription?.price || 0;

        if (currentPrice === 0 || currentSubscription?.plan_id === newPlan.id) return 0;

        const totalDays = 30;
        const endDate = new Date(currentSubscription.end_date).getTime();
        const remainingDays = Math.max(0, (endDate - Date.now()) / (1000 * 60 * 60 * 24));

        const unusedAmount = (currentPrice / totalDays) * remainingDays;
        const newCharge = newPlan.price - unusedAmount;

        return Math.max(0, Number(newCharge.toFixed(2)));
    };
}
