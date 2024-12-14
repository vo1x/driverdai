import { NextRequest, NextResponse } from "next/server";

const GDRIVE_API_KEY = process.env.GDRIVE_API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mimeId = searchParams.get("mimeId");
  console.log(mimeId);
  console.log(GDRIVE_API_KEY);
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

  try {
    const contentsResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${mimeId}'+in+parents&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=1000&orderBy=quotaBytesUsed desc&fields=files(id,name,size,webContentLink,mimeType)&key=${GDRIVE_API_KEY}`
    );
    const contentsData = await contentsResponse.json();
    console.log(contentsData.files);

    if (!contentsData) {
      console.error("Unable to extract folder information.");
      throw new Error("Unable to extract folder information.");
    }

    return NextResponse.json(
      { success: true, files: contentsData.files },
      { status: 200 }
    );
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
