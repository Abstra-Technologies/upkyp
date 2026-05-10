"use client";

interface LeaseConfigFormProps {
  configureLease: boolean;
  onToggle: () => void;
  startDate: string;
  endDate: string;
  rentAmount: string;
  securityDeposit: string;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onRentAmountChange: (v: string) => void;
  onSecurityDepositChange: (v: string) => void;
  rentFromUnit: number;
}

export default function LeaseConfigForm({
  configureLease,
  onToggle,
  startDate,
  endDate,
  rentAmount,
  securityDeposit,
  onStartDateChange,
  onEndDateChange,
  onRentAmountChange,
  onSecurityDepositChange,
  rentFromUnit,
}: LeaseConfigFormProps) {
  const customRent = rentAmount ? parseFloat(rentAmount) : 0;
  const rentDiffers = configureLease && customRent > 0 && customRent !== rentFromUnit;

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl border bg-gray-50">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={configureLease}
            onChange={onToggle}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
          Configure lease now
        </label>
        <p className="text-xs text-gray-500 mt-1 ml-6">
          Set dates, rent, and deposits. Lease activates when tenant accepts.
        </p>
      </div>

      {configureLease && (
        <div className="space-y-3 pl-2 border-l-2 border-blue-200 ml-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                min={startDate || undefined}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          {rentFromUnit > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-700">
                Unit base rent: <span className="font-semibold">₱{rentFromUnit.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Monthly Rent Amount
            </label>
            <input
              type="number"
              value={rentAmount}
              onChange={(e) => onRentAmountChange(e.target.value)}
              placeholder={rentFromUnit > 0 ? String(rentFromUnit) : "0.00"}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            {rentDiffers && (
              <p className="text-xs text-amber-600 mt-1">
                Setting a custom rent will update the unit's base rent to ₱{customRent.toLocaleString("en-PH", { minimumFractionDigits: 2 })}.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Security Deposit
            </label>
            <input
              type="number"
              value={securityDeposit}
              onChange={(e) => onSecurityDepositChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>
      )}
    </div>
  );
}