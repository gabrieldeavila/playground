import { Logger } from "@nestjs/common";
import { QuotationController } from "@src/core/quotation/api/quotation.controller";
import { PuppeteerService } from "@src/core/quotation/api/quotation.service";
import { createMock, Mock } from "@tests/utils/mock";

describe("HealthController", () => {
  let healthController: QuotationController;
  let logger: Mock<Logger>;
  let puppeteerService: Mock<PuppeteerService>;

  beforeEach(() => {
    logger = createMock<Logger>();
    puppeteerService = createMock<PuppeteerService>();
    healthController = new QuotationController(logger, puppeteerService);
  });

  describe("Try diff less than 3 days", () => {
    it("should return error 400", async () => {
      expect(
        await healthController.run({
          checkin: "2024-06-01",
          checkout: "2024-06-02",
          adults: 2,
          rooms: 1,
        }),
      ).toEqual({
        data: null,
        error: 400,
        message:
          "The difference between checkin and checkout should be at least 3 days",
      });
    });
  });
});
