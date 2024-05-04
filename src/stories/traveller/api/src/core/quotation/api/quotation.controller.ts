import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Post,
  Query,
} from "@nestjs/common";
import { PuppeteerService } from "./quotation.service";
import { IQuotation } from "./interfaces/quotation.interface";

@Controller("search")
export class QuotationController {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    private readonly puppeteerService: PuppeteerService,
  ) {}

  @Post()
  @HttpCode(200)
  async run(@Query() quotation: IQuotation) {
    if (typeof quotation.checkin !== "string" || quotation.checkin === "") {
      return {
        data: null,
        error: { message: "Checkin date is required" },
      };
    }

    if (typeof quotation.checkout !== "string" || quotation.checkout === "") {
      return {
        data: null,
        error: { message: "Checkout date is required" },
      };
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(quotation.checkin) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(quotation.checkout)
    ) {
      return {
        data: null,
        error: {
          message: "Invalid date format. Expected: YYYY-MM-DD",
        },
      };
    }

    // If the Checkin date is greater than the Checkout date, we return an error
    if (new Date(quotation.checkin) > new Date(quotation.checkout)) {
      return {
        data: null,
        error: {
          message: "Checkin date should be less than Checkout date",
        },
      };
    }

    // If the diff is less than 3 day, we return an error
    const diff = Math.abs(
      new Date(quotation.checkout).getTime() -
        new Date(quotation.checkin).getTime(),
    );

    if (diff < 3 * 24 * 60 * 60 * 1000) {
      return {
        data: null,
        error: {
          message:
            "The difference between checkin and checkout should be at least 3 days",
        },
      };
    }

    if (quotation.kids && !Array.isArray(quotation.kids)) {
      return {
        data: null,
        error: {
          message: "Kids should be an array of ages",
        },
      };
    }

    try {
      // Finally, we call the Puppeteer service to crawl the page
      const data = await this.puppeteerService.crawl(quotation);

      return { data, error: null };
    } catch (error: any) {
      this.logger.error(error?.message);
      return {
        data: null,
        error: {
          message: error?.message || "Error fetching room!",
        },
      };
    }
  }
}
