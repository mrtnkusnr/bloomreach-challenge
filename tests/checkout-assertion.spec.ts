import { test, expect, Page } from "@playwright/test";
import { cookies } from "../fixtures/cookies";
import { CheckoutPage, CheckoutForm } from "../lib/checkout-pom";

// Types
interface CartData {
  cartBookName: string;
  cartBookPrice: string;
}

interface ExpectedData {
  expectedBookName: string;
  expectedBookPrice: string;
  expectedTotal: string;
}

interface TestData {
  cartData: CartData;
  expectedData: ExpectedData;
}

// Constants
const BASE_URL = "https://practice.automationtesting.in/";

const USER_INFO: CheckoutForm = {
  firstName: "Martin",
  lastName: "Kušnír",
  email: "sample@example.com",
  phone: "+421 123 456 789",
  country: "Slovakia",
  address: "Hlavná 1",
  postcode: "040 01",
  city: "Košice",
};

test.describe("checkout flow", { tag: ["@checkout"] }, async () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    await context.addCookies(cookies);
    page = await context.newPage();
    await page.goto(BASE_URL);
  });

  test("assert confirmation page, correct order list and total price for the cheapest item in the shop", async () => {
    const testData: TestData = {
      cartData: {
        cartBookName: "",
        cartBookPrice: "",
      },
      expectedData: {
        expectedBookName: "JS Data Structures and Algorithm",
        expectedBookPrice: "",
        expectedTotal: "157.50",
      },
    };

    await test.step("enter shop page", async () => {
      const linkShop = page.getByRole("link", { name: "Shop" });
      await expect(linkShop).toBeVisible();
      await linkShop.click();
    });

    await test.step("sort shop items by price from low to high", async () => {
      const itemsSort = page.getByRole("combobox");
      await expect(itemsSort).toBeVisible();
      await itemsSort.click();

      const sortByPrice = async () => {
        await itemsSort.selectOption({ value: "price" });
        await expect(page).toHaveURL(/.*\?orderby=price/);
      };

      try {
        await sortByPrice();
      } catch {
        await sortByPrice();
      }

      await expect(itemsSort).toContainText("Sort by price: low to high");
    });

    await test.step("add the cheapest item to the cart", async () => {
      const itemsList = page.locator(".products");
      const addToCartButton = itemsList
        .getByRole("link", { name: "ADD TO BASKET" })
        .nth(0);
      await addToCartButton.click();

      const shoppingCart = page.getByTitle("View your shopping cart");
      await expect(shoppingCart).toContainText("1 item");
      await shoppingCart.click();
      await expect(page).toHaveURL(/.*basket/);
    });

    await test.step("extract the book details and proceed to checkout", async () => {
      testData.cartData.cartBookName = await page
        .getByTestId("Product")
        .innerText();
      testData.cartData.cartBookPrice = await page
        .getByTestId("Subtotal")
        .innerText();

      const checkoutButton = page.getByRole("link", {
        name: "PROCEED TO CHECKOUT",
      });
      await checkoutButton.click();
      await expect(page).toHaveURL(/.*checkout/);
    });

    await test.step("fill the checkout form", async () => {
      const checkoutPage = new CheckoutPage(page);
      await checkoutPage.fillCheckout(page, USER_INFO);
    });

    await test.step("place the order", async () => {
      const orderButton = page.getByRole("button", { name: "Place order" });
      await orderButton.click();

      await expect(page).toHaveURL(/.*order-received/);
      await expect(
        page.getByText("Thank you. Your order has been received.")
      ).toBeVisible();
    });

    await test.step("assert the order details", async () => {
      const { cartData, expectedData } = testData;

      // Assert that the book name from the cart matches the expected book
      expect(cartData.cartBookName).toMatch(expectedData.expectedBookName);

      // Assert that the book name on the confirmation page matches the name from the cart
      await expect(
        page.locator(".product-name").getByRole("link")
      ).toContainText(cartData.cartBookName);

      // Assert that the book price on the confirmation page matches the price from the cart
      await expect(
        page.getByRole("row").filter({ hasText: "Subtotal:" })
      ).toContainText(cartData.cartBookPrice);

      // Assert that the total price on the confirmation page matches the expected total price after tax
      await expect(
        page.getByRole("row").filter({ hasText: "Total:" }).nth(1)
      ).toContainText(expectedData.expectedTotal);
    });
  });
});
