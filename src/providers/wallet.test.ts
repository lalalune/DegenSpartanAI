import dotenv from "dotenv";
import { WalletProvider } from "./wallet";
import { Connection, PublicKey } from "@solana/web3.js";
import exp from "constants";

dotenv.config({ path: ".env" });

describe("WalletProvider", () => {
  let walletProvider: WalletProvider;
  const walletPublicKey = new PublicKey(process.env.TEST_WALLET_PUBLIC_KEY);
  const connection = new Connection("https://api.mainnet-beta.solana.com");

  beforeEach(() => {
    walletProvider = new WalletProvider(connection, walletPublicKey);
  });

  test("fetchPortfolioValue should return formatted portfolio data", async () => {
    const portfolioValue = await walletProvider.fetchPortfolioValue(
      walletPublicKey.toBase58()
    );

    // Print the portfolio value for inspection
    console.log("Portfolio Value:", portfolioValue);

    // Check that portfolio data includes expected properties
    expect(portfolioValue).toHaveProperty("totalUsd");
    expect(portfolioValue).toHaveProperty("totalSol");
    expect(Array.isArray(portfolioValue.items)).toBe(true);
    expect(portfolioValue.items.length).toBeGreaterThan(0);

    // Print the general information: totalUsd and totalSol
    console.log(`Total USD: ${portfolioValue.totalUsd}`);
    console.log(`Total SOL: ${portfolioValue.totalSol}`);

    // Print the first 5 entries in the portfolio
    console.log("First 5 entries:");
    console.log(portfolioValue.items.slice(0, 5));

    // Check that each item in the portfolio includes required fields, with a fallback to optional checks
    for (const item of portfolioValue.items) {
      if (item.name) {
        expect(item).toHaveProperty("name");
      }
      if (item.symbol) {
        expect(item).toHaveProperty("symbol");
      }
      expect(item).toHaveProperty("balance");
      if (item.priceUsd) {
        expect(item).toHaveProperty("priceUsd");
      }
      expect(item).toHaveProperty("valueUsd");
      expect(item).toHaveProperty("valueSol");
    }
  });

  test("fetchPrices should return formatted price data", async () => {
    const prices = await walletProvider.fetchPrices();

    // Print the prices for inspection
    console.log("Prices:", prices);

    // Check that prices for Solana, Bitcoin, and Ethereum are returned
    expect(prices).toHaveProperty("solana");
    expect(prices).toHaveProperty("bitcoin");
    expect(prices).toHaveProperty("ethereum");

    // Check that each price is in the expected format
    expect(prices.solana).toHaveProperty("usd");
    expect(prices.bitcoin).toHaveProperty("usd");
    expect(prices.ethereum).toHaveProperty("usd");

    // Ensure the prices are numbers (or strings that can be parsed as numbers)
    expect(parseFloat(prices.solana.usd)).not.toBeNaN();
    expect(parseFloat(prices.bitcoin.usd)).not.toBeNaN();
    expect(parseFloat(prices.ethereum.usd)).not.toBeNaN();

    // console.log prices
    console.log("Solana Price:", prices.solana.usd);
    console.log("Bitcoin Price:", prices.bitcoin.usd);
    console.log("Ethereum Price:", prices.ethereum.usd);
  });
});
