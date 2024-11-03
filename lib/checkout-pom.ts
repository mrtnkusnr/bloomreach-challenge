import { type Locator, type Page, expect } from "@playwright/test";

export interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  postcode: string;
  city: string;
}

class CheckoutPage {
  readonly page: Page;
  readonly locators: Record<string, Locator>;

  constructor(page: Page) {
    this.page = page;
    this.locators = {
      firstName: page.locator("#billing_first_name"),
      lastName: page.locator("#billing_last_name"),
      email: page.locator("#billing_email"),
      phone: page.locator("#billing_phone"),
      country: page.locator("#s2id_billing_country"),
      address: page.locator("#billing_address_1"),
      city: page.locator("#billing_city"),
      postcode: page.locator("#billing_postcode"),
    };
  }

  async fillCheckout(page: Page, obj: CheckoutForm) {
    await this.locators.firstName.fill(obj.firstName);
    await this.locators.lastName.fill(obj.lastName);
    await this.locators.email.fill(obj.email);
    await this.locators.phone.fill(obj.phone);

    await this.locators.country.click();
    await page.getByRole("option", { name: obj.country }).click();

    await this.locators.address.fill(obj.address);
    await this.locators.postcode.fill(obj.postcode);
    await this.locators.city.fill(obj.city);
  }
}

export { CheckoutPage };
