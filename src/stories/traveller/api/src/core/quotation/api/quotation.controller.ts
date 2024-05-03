import { Controller, Get, HttpCode, Inject, Logger } from "@nestjs/common";
import { PuppeteerService } from "./quotation.service";

@Controller("quotation")
export class QuotationController {
  constructor(
    @Inject(Logger) private readonly logger: Logger,
    private readonly puppeteerService: PuppeteerService,
  ) {}

  @Get()
  @HttpCode(200)
  run() {
    this.puppeteerService.crawl();

    return { status: "hohohohaaa" };
  }
}
