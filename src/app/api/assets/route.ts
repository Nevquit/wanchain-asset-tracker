// src/app/api/assets/route.ts
import { NextResponse } from "next/server";
import { isAddress } from "ethers";
import { fetchAllAssets } from "../../../../services/orchestrator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { error: "Missing address query parameter." },
      { status: 400 },
    );
  }

  if (!isAddress(address)) {
    return NextResponse.json(
      { error: "Invalid Wanchain address format.", provided: address },
      { status: 400 },
    );
  }

  try {
    const results = await fetchAllAssets(address);
    return NextResponse.json({
      status: 200,
      assets: results.assets,
      failed_protocols: results.failedProtocols,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Overall Query Error:", errorMessage);
    return NextResponse.json(
      {
        status: 500,
        error: "An internal server error occurred during asset fetching.",
        details: errorMessage,
      },
      { status: 500 },
    );
  }
}
