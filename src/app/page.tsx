"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Check, Loader } from "lucide-react";
import { CheckCircle2, XCircle, Circle, Copy, Upload } from "lucide-react";

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

  const [folderData, setFolderData] = useState<any[]>([]);
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

  const generateFormattedText = (statuses: FileProcessStatus[]) => {
    return statuses
      .filter((file) => file.status === "completed")
      .map((file) => `**${file.name} [${file.size}]\n${file.gdFlixUrl}**`)
      .join("\n\n");
  };

  // Copy to clipboard function
  // const copyToClipboard = () => {
  //   navigator.clipboard.writeText(generatedText)
  //     .then(() => {
  //       toast.success('Copied to clipboard');
  //     })
  //     .catch(err => {
  //       toast.error('Failed to copy');
  //       console.error('Copy failed', err);
  //     });
  // };

  const handleGenerateButton = async (folderId: string) => {
    setIsGenerating(true);
    setIsError(false);
    setIsExtracted(false);
    setFileProcessStatuses([]);
    setGeneratedText("");

    try {
      setIsExtracting(true);
      const folderData = await fetch(
        `api/gdrive/extractFolder?mimeId=${folderId}`
      ).then((res) => res.json());

      if (folderData && folderData.files) {
        setIsExtracting(false);
        setIsExtracted(true);
        setFolderData(folderData.files);

        const initialStatuses: FileProcessStatus[] = folderData.files.map(
          (file: any) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            status: "pending",
          })
        );
        setFileProcessStatuses(initialStatuses);

        for (const file of folderData.files) {
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
        throw new Error("Unable to extract folder");
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
        return <Circle className="text-slate-400" />;
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

  return (
    <div className="h-screen flex items-center justify-center w-screen p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-2xl ">
        <span className="text-5xl">Driver Dai</span>
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
            onClick={() => handleGenerateButton(`1Qe-sdfsdf`)}
            className="p-2 bg-[#445173] text-slate-400 hover:text-slate-100 transition-all duration-200 rounded-full font-semibold"
          >
            <Upload></Upload>
          </button>
        </div>
        {isGenerating && (
          <div className="bg-[#0C101C] border p-4 rounded-xl border-slate-800 h-max w-full">
            <div className="flex items-center gap-2 mb-4">
              {isExtracting ? (
                <Loader className="animate-spin" />
              ) : isExtracted && !isError ? (
                <CheckCircle2
                  stroke="#02B063"
                  fill="#02B063"
                  fillOpacity={"25%"}
                />
              ) : (
                <XCircle stroke="#ef4444" fill="#ef4444" fillOpacity={"25%"} />
              )}
              <span className="text-slate-400">
                Fetching folder contents from Google Drive
              </span>
            </div>

            {fileProcessStatuses.length > 0 && (
              <div className="space-y-2">
                {fileProcessStatuses.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 text-md"
                  >
                    {getStatusIcon(file.status)}
                    <span className="truncate text-slate-400">{file.name}</span>
                  </div>
                ))}
              </div>
            )}

            {generatedText && (
              <div className="flex flex-col mt-4 bg-slate-900 p-4 rounded-md relative">
                <pre className="text-sm text-slate-300 whitespace-pre-wrap break-words ">
                  {generatedText}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
