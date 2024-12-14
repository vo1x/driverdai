import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GDFlix_API_KEY;
const BASE_URL = process.env.GDFlix_BASE_URL;

interface GDFlixFile {
  id: number;
  name: string;
  size: number;
  key: string;
  status: number;
}

const fetchGDFlixLink = async (fileId: string): Promise<GDFlixFile | null> => {
  try {
    const url = `${BASE_URL}/v2/share?id=${fileId}&key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch GDFlix link for file: ${fileId}`);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      size: data.size || 0,
      key: data.key,
      status: data.status,
    };
  } catch (error) {
    console.error(`Error fetching GDFlix link for file ${fileId}:`, error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mimeId = searchParams.get("mimeId");

  if (!API_KEY) {
    console.error("Missing API KEY");
    return NextResponse.json({
      success: false,
      message: "Internal Server Error",
    });
  }

  if (!mimeId) {
    return NextResponse.json({ success: false, message: "Missing Mime ID" });
  }

  try {
    const gdFlixFile = await fetchGDFlixLink(mimeId);
    if (gdFlixFile) {
      return NextResponse.json(gdFlixFile, {
        status: 200,
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: `Internal Server Error: ${error}`,
    });
  }
}
