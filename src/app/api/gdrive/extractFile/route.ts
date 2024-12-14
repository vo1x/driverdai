import { NextRequest, NextResponse } from "next/server";

const GDRIVE_API_KEY = process.env.GDRIVE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mimeId = searchParams.get("mimeId");

  if (!mimeId) {
    return NextResponse.json(
      {
        success: false,
        message: "MimeID is required.",
      },
      {
        status: 400,
      }
    );
  }

  const url = `https://www.googleapis.com/drive/v3/files/${mimeId}?supportsAllDrives=true&includeItemsFromAllDrives=true&fields=id,name,size,webContentLink,mimeType&key=${GDRIVE_API_KEY}`;

  try {
    const contentsResponse = await fetch(url);
    const mimeData = await contentsResponse.json();
    if (!mimeData) {
      throw new Error("Unable to extract file information.");
    }

    return NextResponse.json({ success: true, mimeData }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error,
      },
      {
        status: 400,
      }
    );
  }
}
