import { NextRequest, NextResponse } from "next/server";

const API_KEY = `t0RcKlqCFdxXpHoSC6pOeWtie`;
const BASE_URL = `https://new8.gdtot.dad`;
const EMAIL = `ionic@syncdrive.in`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("query");

  console.log("Environment Variables:");
  console.log("API_KEY:", API_KEY);
  console.log("BASE_URL:", BASE_URL);
  console.log("EMAIL:", EMAIL);

  if (!url) {
    return NextResponse.json({ message: "No URL provided" }, { status: 400 });
  }

  if (!API_KEY || !BASE_URL || !EMAIL) {
    return NextResponse.json(
      { message: "Environment variables not set" },
      { status: 500 }
    );
  }

  try {
    const myHeaders = new Headers({
      "Content-Type": "application/x-www-form-urlencoded",
    });

    const formData = new URLSearchParams();
    formData.append("email", EMAIL);
    formData.append("api_token", API_KEY);
    formData.append("url", url);

    const response = await fetch(`${BASE_URL}/api/upload/folder`, {
      method: "POST",
      headers: myHeaders,
      body: formData,
      redirect: "follow",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Unable to upload to GDToT. Status: ${response.status}, Body: ${errorBody}`
      );
    }

    const responseData = await response.json();
    console.log(responseData);

    const links = responseData.data.map((item: any) => ({
      name: item.name,
      size: item.size,
      url: item.url,
    }));

    return NextResponse.json({ links });
  } catch (error: any) {
    console.error("Error uploading to GDToT:", error.message);
    return NextResponse.json(
      { message: `Error: ${error.message}` },
      { status: 500 }
    );
  }
}
