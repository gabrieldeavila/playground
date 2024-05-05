import { Inject, Injectable, Logger } from "@nestjs/common";
import puppeteer from "puppeteer";
import {
  IQuotation,
  TQuotationResponse,
} from "./interfaces/quotation.interface";

const BASE_URL = "https://pratagy.letsbook.com.br/reserva/selecao-de-quartos";
const DEFAULT_HOTEL_CODE = 12;
const DEFAULT_DEVICE = "Desktop";
const DEFAULT_LANGUAGE = "pt-BR";

@Injectable()
export class PuppeteerService {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  async crawl(quotation: IQuotation): Promise<TQuotationResponse> {
    this.logger.log("Start crawling..");

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Create a new URL
    const url = new URL(BASE_URL);

    // Set the checkin/checkout date
    url.searchParams.set("checkin", quotation.checkin);
    url.searchParams.set("checkout", quotation.checkout);

    // If the kids parameter exists, we add it to the URL
    if (quotation.kids) {
      url.searchParams.set("criancas", String(quotation.kids));
    }

    // The other parameters are optional, so if they do not exist, we add a default value
    url.searchParams.set("numeroAdultos", String(quotation.adults || 1));
    url.searchParams.set("quartos", String(quotation.rooms || 1));
    url.searchParams.set("promocode", quotation.promocode || "");

    // Add the default values
    url.searchParams.set("hotel", String(DEFAULT_HOTEL_CODE));
    url.searchParams.set("device", DEFAULT_DEVICE);
    url.searchParams.set("idioma", DEFAULT_LANGUAGE);

    this.logger.log(`Accessing URL: ${url.toString()}`);

    // Navigate the page to a URL
    await page.goto(url.toString(), {
      waitUntil: "networkidle2",
    });

    // Set screen size
    await page.setViewport({ width: 1080, height: 1024 });

    // Wait for the room list to be visible
    await page.waitForSelector(".room-list", { visible: true });

    // Sometimes, the page is not fully loaded, so we need to wait a little bit more
    await page.waitForNetworkIdle({ idleTime: 250 });

    const roomList: TQuotationResponse = await page?.evaluate(async () => {
      // Get the list of rooms
      const roomsArray = Array.from(
        document?.querySelectorAll(".room-option") || [],
      );

      // Map the rooms to an array of objects
      return roomsArray.map(room => {
        const name = room.querySelector(
          "h3.room-option-title--title",
        )?.textContent;

        const description = room.querySelector(
          "p.room-option-title--amenities",
        )?.textContent;

        const price = room.querySelector(
          "p.daily-price--total span.term",
        )?.textContent;

        const image = room
          .querySelector("div.q-carousel__slide")
          ?.getAttribute("style")
          ?.split("url(")[1]
          ?.split(")")[0]
          ?.replaceAll(/['"]+/g, "")
          ?.replace(/\\/g, "");

        return {
          name,
          description,
          price,
          image,
        };
      });
    });

    if (roomList == null || roomList.length === 0) {
      this.logger.error("Room list was not found");
      throw new Error("Room list was not found");
    }

    this.logger.log(`Crawling finished! Found ${roomList.length} rooms`);

    await browser.close();

    return roomList;
  }
}
