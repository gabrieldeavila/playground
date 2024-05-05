import {
  Body,
  Controller,
  HttpCode,
  Inject,
  Logger,
  Post
} from "@nestjs/common";
import { validateQuotation } from "../helpers/validate";
import { IQuotation } from "./interfaces/quotation.interface";
import { PuppeteerService } from "./quotation.service";

@Controller("search")
export class QuotationController {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    private readonly puppeteerService: PuppeteerService,
  ) {}

  @Post()
  @HttpCode(200)
  async run(@Body() quotation: IQuotation) {
    try {
      // Run some validations to prevent errors (TODO: add in a middleware?)
      validateQuotation(quotation);

      // Finally, we call the Puppeteer service to crawl the page
      const data = await this.puppeteerService.crawl(quotation);
      return { data, error: null };
    } catch (error: any) {
      this.logger.error(error?.message);

      return {
        data: null,
        error: 400,
        message: error?.message || "Error fetching rooms!",
      };
    }
  }
}
