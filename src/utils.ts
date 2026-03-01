export const formatToBengaliPrice = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') {
    return '০ ৳';
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    return '০ ৳';
  }
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  // Format with commas first (Indian numbering system is close enough, or standard en-US)
  const formattedAmount = numAmount.toLocaleString('en-IN'); 
  const bengaliAmount = formattedAmount.replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
  return `${bengaliAmount} ৳`;
};

export const formatToBengaliNumber = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null || amount === '') {
    return '০';
  }
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return amount.toString().replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
};
