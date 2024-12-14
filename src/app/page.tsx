"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import { toast } from "sonner";
import {
  Loader,
  CheckCircle2,
  XCircle,
  Circle,
  Copy,
  Upload,
  ChevronRight,
} from "lucide-react";

const GDFlix_BASE_URL = `https://new6.gdflix.cfd`;

interface FileProcessStatus {
  id: string;
  name: string;
  size: number;
  status: "pending" | "processing" | "completed" | "error";
  gdFlixUrl?: string;
}

export default function Home() {
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      const handleFocus = () => setIsInputFocused(true);
      const handleBlur = () => setIsInputFocused(false);

      const inputElement = inputRef.current;
      inputElement.addEventListener("focus", handleFocus);
      inputElement.addEventListener("blur", handleBlur);

      return () => {
        inputElement.removeEventListener("focus", handleFocus);
        inputElement.removeEventListener("blur", handleBlur);
      };
    }
  }, [inputRef]);

  const [driveData, setDriveData] = useState<any[]>([]);
  const [fileProcessStatuses, setFileProcessStatuses] = useState<
    FileProcessStatus[]
  >([]);
  const [generatedText, setGeneratedText] = useState<string>("");

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isExtracted, setIsExtracted] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [inputValue, setInputValue] = useState<string>("");

  const checkAllFilesProcessed = (statuses: FileProcessStatus[]) => {
    return statuses.every(
      (file) => file.status === "completed" || file.status === "error"
    );
  };

  const getReadableFS = (bytes: number) => {
    console.log(bytes);
    if (bytes === 0) return "0 Bytes";
    if (!bytes) {
      return null;
    }
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const generateFormattedText = (statuses: FileProcessStatus[]) => {
    return statuses
      .filter((file) => file.status === "completed")
      .map(
        (file) =>
          `${file.name} [${getReadableFS(file.size)}]\n${file.gdFlixUrl}`
      )
      .join("\n\n");
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(generatedText)
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch((err) => {
        toast.error("Failed to copy");
        console.error("Copy failed", err);
      });
  };

  const extractGDriveId = (driveUrl: string): string | Error => {
    const driveIdRegex =
      /^(tp:|sa:|mtp:)?(?:[a-zA-Z0-9-_]{33}|[a-zA-Z0-9_-]{19})$|^gdl$|^(tp:|mtp:)?root$/;
    const mimeIdRegex =
      /https:\/\/drive\.google\.com\/(?:drive(.*?)\/folders\/|file(.*?)?\/d\/)([-\w]+)/;

    const isGDriveId = (id: string): boolean => driveIdRegex.test(id);

    const isGDriveLink = (url: string): boolean =>
      url.includes("drive.google.com") ||
      url.includes("drive.usercontent.google.com");

    try {
      if (isGDriveId(driveUrl)) {
        return driveUrl;
      }

      if (isGDriveLink(driveUrl)) {
        const match = driveUrl.match(mimeIdRegex);

        if (match) {
          return match[3];
        }

        const url = new URL(driveUrl);
        const params = new URLSearchParams(url.search);
        const id = params.get("id");

        if (id) {
          return id;
        }
      }

      throw new Error("Invalid Google Drive ID or link");
    } catch (error) {
      return error as Error;
    }
  };
  const [logsVisible, setLogsVisible] = useState<boolean>(true);

  const handleGenButton = async () => {
    const driveUrl = inputValue;
    if (!driveUrl || driveUrl === "") {
      toast.error("Please enter a google drive URL");
      return;
    }

    const mimeId = extractGDriveId(driveUrl);

    if (mimeId instanceof Error) {
      console.error(mimeId.message);
      toast.error(mimeId.message);
      return;
    }

    const isFolder = driveUrl.includes("/folders/");

    try {
      setIsGenerating(true);
      setLogsVisible(true);
      setIsError(false);
      setIsExtracted(false);
      setFileProcessStatuses([]);
      setGeneratedText("");

      try {
        setIsExtracting(true);
        const extractionEndpoint = isFolder
          ? `api/gdrive/extractFolder?mimeId=${mimeId}`
          : `api/gdrive/extractFile?mimeId=${mimeId}`;

        const folderData = await fetch(extractionEndpoint).then((res) =>
          res.json()
        );

        console.log(folderData);

        if (folderData && (folderData?.files || folderData.mimeData)) {
          setIsExtracting(false);
          setIsExtracted(true);

          const files = isFolder ? folderData.files : [folderData.mimeData];
          setDriveData(files);

          const initialStatuses: FileProcessStatus[] = files.map(
            (file: any) => ({
              id: file.id,
              name: file.name,
              size: file.size,
              status: "pending",
            })
          );
          setFileProcessStatuses(initialStatuses);

          for (const file of files) {
            setFileProcessStatuses((prev) =>
              prev.map((f) =>
                f.id === file.id ? { ...f, status: "processing" } : f
              )
            );

            try {
              const gdFlixFile = await fetch(
                `api/gdflix/upload?mimeId=${file.id}`
              ).then((res) => res.json());

              setFileProcessStatuses((prev: any) => {
                const updatedStatuses = prev.map((f: any) =>
                  f.id === file.id
                    ? {
                        ...f,
                        status: "completed",
                        gdFlixUrl:
                          `${GDFlix_BASE_URL}/file/${gdFlixFile?.key}` ||
                          "No URL generated",
                      }
                    : f
                );

                if (checkAllFilesProcessed(updatedStatuses)) {
                  const formattedText = generateFormattedText(updatedStatuses);
                  setGeneratedText(formattedText);
                }

                return updatedStatuses;
              });
            } catch (fileError) {
              setFileProcessStatuses((prev: any) => {
                const updatedStatuses = prev.map((f: any) =>
                  f.id === file.id ? { ...f, status: "error" } : f
                );

                if (checkAllFilesProcessed(updatedStatuses)) {
                  const formattedText = generateFormattedText(updatedStatuses);
                  setGeneratedText(formattedText);
                }

                return updatedStatuses;
              });
              console.error(`Error processing file ${file.name}:`, fileError);
            }
          }
        } else {
          throw new Error("Unable to extract folder or file");
        }
      } catch (error) {
        setIsExtracting(false);
        setIsError(true);
        console.error(error);
      }
    } catch (error) {
      setIsExtracting(false);
      setIsError(true);
      console.error(error);
    }
  };

  const getStatusIcon = (status: FileProcessStatus["status"]) => {
    switch (status) {
      case "pending":
        return <Circle className="text-slate-400" size={24} />;
      case "processing":
        return <Loader className="animate-spin text-blue-500" />;
      case "completed":
        return (
          <CheckCircle2 stroke="#02B063" fill="#02B063" fillOpacity="25%" />
        );
      case "error":
        return <XCircle stroke="#ef4444" fill="#ef4444" fillOpacity="25%" />;
    }
  };

  useEffect(() => {
    if (generatedText !== "") setLogsVisible(false);
  }, [generatedText]);

  return (
    <>
      <div className=" flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-8 w-full max-w-2xl ">
          <span className="text-5xl font-bold text-slate-300">Driver Dai</span>
          <div className="flex items-center justify-center gap-2 w-max border border-slate-700 bg-[#161B2E] p-2 px-3 rounded-full">
            <motion.input
              ref={inputRef}
              value={inputValue}
              onChange={(e: any) => setInputValue(e.target.value)}
              initial={{ width: "24rem" }}
              animate={{
                width: isInputFocused ? "28rem" : "24rem",
                transition: { duration: 0.3 },
              }}
              type="text"
              className=" bg-[#0F131F] outline-none rounded-full text-lg p-2 px-4 w-full"
              placeholder="URL"
            />
            <button
              onClick={handleGenButton}
              className="p-2 bg-[#445173] text-slate-400 hover:text-slate-100 transition-all duration-200 rounded-full font-semibold"
            >
              <Upload></Upload>
            </button>
          </div>

          <div className="flex flex-col gap-4 max-w-2xl min-w-full">
            {isGenerating && (
              <motion.div
                initial={{ height: "max-content" }}
                animate={{ height: logsVisible ? "max-content" : "3.5rem" }}
                exit={{ height: "0" }} 
                className={`bg-[#0C101C] flex flex-col overflow-hidden border p-4 px-0 rounded-xl border-slate-800`}
              >
                <div
                  className={`flex items-center text-slate-300 px-4 pl-2 cursor-pointer  ${
                    !logsVisible ? "pb-4" : ""
                  }`}
                  onClick={() => setLogsVisible((prev) => !prev)} // Toggle visibility
                >
                  <ChevronRight></ChevronRight>
                  <span className="font-semibold">Extraction Logs</span>
                </div>

                <div
                  className={`w-full border-t my-2 border-slate-800 mb-4  ${
                    !logsVisible ? "hidden" : "" // Hide the border if not visible
                  }`}
                ></div>

                <div className="flex items-center gap-2 mb-2 px-4">
                  {isExtracting ? (
                    <Loader className="animate-spin" />
                  ) : isExtracted && !isError ? (
                    <CheckCircle2
                      stroke="#02B063"
                      fill="#02B063"
                      fillOpacity={"25%"}
                    />
                  ) : (
                    <XCircle
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={"25%"}
                    />
                  )}
                  <span className="text-slate-400">
                    Fetching folder contents from Google Drive
                  </span>
                </div>

                {fileProcessStatuses.length > 0 && (
                  <div className="flex flex-col px-4 gap-2">
                    {fileProcessStatuses.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 text-md w-full"
                      >
                        <span>{getStatusIcon(file.status)}</span>
                        <span className="truncate text-slate-400">
                          {file.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {generatedText && (
              <div className="flex flex-col bg-[#0C101C] border  border-slate-800 p-4 pt-0 px-0 rounded-xl relative max-h-96 w-full overflow-y-auto">
                <div className="flex items-center justify-between text-slate-300 px-4 py-2 sticky top-0 z-10 bg-[#0C101C] border-b mb-4 border-slate-800">
                  <span className="font-semibold">Generated Links</span>
                  <button
                    onClick={copyToClipboard}
                    className="flex gap-2 items-center p-2 rounded-xl hover:bg-[#1F232E]"
                  >
                    <Copy size={20}></Copy>
                    <span>Copy</span>
                  </button>
                </div>
                <pre className=" text-slate-400 whitespace-pre-wrap break-words px-4">
                  {generatedText}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
