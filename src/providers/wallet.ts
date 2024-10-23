// TokenBalanceProvider.ts
import { Connection, PublicKey } from "@solana/web3.js";
// import { getTokenBalances, getTokenPriceInSol } from "./tokenUtils";
import fetch from "cross-fetch";
import BigNumber from "BigNumber.js"; // Import BN for big number calculations
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

interface Item {
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  uiAmount: string;
  priceUsd: string;
  valueUsd: string;
  valueSol?: string;
}
interface walletPortfolio {
  totalUsd: string;
  totalSol?: string;
  items: Array<Item>;
}
interface price {
  usd: string;
}
interface Prices {
  solana: price;
  bitcoin: price;
  ethereum: price;
}

const API_Key = process.env.BIRDEYE_API_KEY;
const solanaAddress = process.env.SOL_ADDRESS;

export class WalletProvider {
  private connection: Connection;
  private walletPublicKey: PublicKey;

  constructor(connection: Connection, walletPublicKey: PublicKey) {
    this.connection = connection;
    this.walletPublicKey = walletPublicKey;
  }

  // async getFormattedTokenBalances(): Promise<string> {
  //   const tokenBalances = await getTokenBalances(this.connection, this.walletPublicKey);

  //   let formattedBalances = "Token Balances:\n";
  //   let totalValueInSol = 0;

  //   for (const [tokenName, balance] of Object.entries(tokenBalances)) {
  //     const tokenPrice = await getTokenPriceInSol(tokenName);
  //     const totalValue = balance * tokenPrice;
  //     totalValueInSol += totalValue;

  //     formattedBalances += `${tokenName}: ${balance} (${totalValue} SOL)\n`;
  //   }

  //   formattedBalances += `\nTotal Value: ${totalValueInSol} SOL`;

  //   return formattedBalances;
  // }

  async fetchPortfolioValue(walletPublicKey: string): Promise<walletPortfolio> {
    try {
      const options = {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-chain": "solana",
          "X-API-KEY": API_Key,
        },
      };

      const walletPortfolio = await fetch(
        `https://public-api.birdeye.so/v1/wallet/token_list?wallet=${walletPublicKey}`,
        options
      );
      const walletPortfolioJson = await walletPortfolio.json();
      const data = walletPortfolioJson.data;
      const totalUsd = new BigNumber(data.totalUsd.toString());

      const prices = await this.fetchPrices();
      const solPriceInUSD = new BigNumber(prices.solana.usd.toString());

      const items = data.items.map((item: any) => ({
        ...item,
        valueSol: new BigNumber(item.valueUsd || 0)
          .div(new BigNumber(prices.solana.usd))
          .toFixed(6),
        name: item.name || "Unknown",
        symbol: item.symbol || "Unknown",
        priceUsd: item.priceUsd || "0",
        valueUsd: item.valueUsd || "0",
      }));

      const totalSol = totalUsd.div(solPriceInUSD);

      const walletPortfolioFormatted = {
        totalUsd: totalUsd.toString(6),
        totalSol: totalSol.toString(6),
        items,
      };

      return walletPortfolioFormatted;
    } catch (error) {
      console.log(error);
    }
  }

  async fetchPrices(): Promise<Prices> {
    const apiUrl = "https://api.coingecko.com/api/v3/simple/price";
    const ids = "solana,bitcoin,ethereum";
    const vsCurrencies = "usd";

    try {
      const response = await fetch(
        `${apiUrl}?ids=${ids}&vs_currencies=${vsCurrencies}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch prices");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.log("Error fetching prices:", error);
    }
  }
}
