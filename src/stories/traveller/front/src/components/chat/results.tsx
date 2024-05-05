import { IChatResponse } from "@/interfaces/chat.interface";
import React, { memo, useCallback } from "react";
import NextImage from "../NextImage";
import { cn } from "@/lib/utils";
import Message from "./message";

const Results = memo(
  ({
    results,
    onClear,
  }: {
    results: IChatResponse["data"];
    onClear: () => void;
  }) => {
    const onRef = useCallback((node: HTMLDivElement) => {
      if (node) {
        node.scrollIntoView({ behavior: "smooth" });
      }
    }, []);

    return (
      <div ref={onRef} className="flex flex-col gap-7">
        <h2 className="text-center">Your Results:</h2>
        {results.map((result, index) => (
          <div key={result.name}>
            <h3 className="mb-3">
              {index + 1}
              {" - "}
              {result.name}
            </h3>
            <div className="flex flex-col gap-2">
              <div>
                <strong>Amenities:</strong> {result.description}
              </div>

              <div>
                <strong>Price:</strong> {result.price}
              </div>

              <div className="flex items-center justify-center">
                <NextImage
                  classNames={{
                    image: cn(
                      "rounded-md",
                      "bg-neutral-700",
                      "p-2",
                      "shadow-md"
                    ),
                  }}
                  width={200}
                  height={200}
                  useSkeleton
                  src={result.image}
                  alt={result.name}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={onClear}
          className={cn(
            "bg-red-500 text-white p-2 rounded-md",
            "transition-all hover:opacity-80 active:scale-95"
          )}
        >
          Clear Search
        </button>
      </div>
    );
  }
);

export default Results;

export const ResultsError = memo(({ error }: { error: string }) => {
  const onRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      node.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <div ref={onRef}>
      <Message error type="bot" message={error} />
      <Message
        type="bot"
        error
        message="Try changing the param and click the button bellow again!"
      />
    </div>
  );
});
