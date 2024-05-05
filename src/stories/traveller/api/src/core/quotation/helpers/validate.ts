import { IQuotation } from "../api/interfaces/quotation.interface";

export const validateQuotation = (quotation: IQuotation): void => {
  if (typeof quotation.checkin !== "string" || quotation.checkin === "") {
    throw new Error("Checkin date is required");
  }

  if (typeof quotation.checkout !== "string" || quotation.checkout === "") {
    throw new Error("Checkout date is required");
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(quotation.checkin) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(quotation.checkout)
  ) {
    throw new Error("Invalid date format. Expected: YYYY-MM-DD");
  }

  const checkinDate = new Date(quotation.checkin);
  const checkoutDate = new Date(quotation.checkout);

  // If the Checkin date is greater than the Checkout date, we return an error
  if (checkinDate > checkoutDate) {
    throw new Error("Checkin date should be less than Checkout date");
  }

  // If the Checkin date is less than the current date, we return an error
  if (checkinDate < new Date()) {
    throw new Error("Checkin date should be greater than the current date");
  }

  // If the diff is less than 3 day, we return an error
  const diff = Math.abs(checkoutDate.getTime() - checkinDate.getTime());

  if (diff < 3 * 24 * 60 * 60 * 1000) {
    throw new Error(
      "The difference between checkin and checkout should be at least 3 days",
    );
  }

  // If the kids parameter exists, we check if it is an array
  if (quotation.kids && !Array.isArray(quotation.kids)) {
    throw new Error("Kids should be an array of ages");
  }
};
