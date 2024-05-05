"use client";

import Message from "@/components/chat/message";
import Results, { ResultsError } from "@/components/chat/results";
import Loader from "@/components/icons/loader";
import Input from "@/components/inputs";
import { IChatResponse, IChatState } from "@/interfaces/chat.interface";
import STARTER_CHAT from "@/lib/chat/starter";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

export default function ChatBotPage() {
  const [state, setState] = useState<IChatState>(STARTER_CHAT);
  const [key, setKey] = useState(0);

  const [results, setResults] = useState<IChatResponse["data"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    // TODO: improve and add axios instead
    const rawResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_TRAVELLER}/search`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state),
      }
    );

    setIsLoading(false);
    const content = (await rawResponse.json()) as IChatResponse;

    if (content.error) {
      setError(content.message);
      return;
    }

    setResults(content.data);
  }, [state]);

  const clearSearch = useCallback(() => {
    setResults(null);

    setState(STARTER_CHAT);
    setKey((prev) => prev + 1);
  }, []);

  return (
    <main
      className={cn(
        "flex flex-col justify-center items-center",
        "sm:p-4",
        "bg-neutral-900",
        "w-dvw",
        "h-dvh"
      )}
      key={key}
    >
      <div
        className={cn(
          "bg-zinc-800",
          "text-white",
          "w-screen sm:w-11/12 sm:max-w-3xl	",
          "h-screen sm:h-2/3",
          "p-5 pr-2",
          "rounded-sm",
          "shadow-lg"
        )}
      >
        <div
          className={cn(
            "flex flex-col",
            "gap-5",
            "h-full max-h-full",
            "overflow-auto",
            "py-2 pr-3"
          )}
        >
          <Message type="bot" message="Hi! 👋" />
          <Message type="bot" message="I'm Travvy, Traveller Way's chatbot." />
          <Message type="bot" message="When are you planning to travel?" />
          <Input
            state={state}
            setState={setState}
            type="date"
            defaultSize="w-48"
            name="checkin"
          />

          {state.checkin && (
            <>
              <Message type="bot" message="And when will you be back?" />
              <Input
                state={state}
                setState={setState}
                type="date"
                defaultSize="w-48"
                name="checkout"
              />
            </>
          )}

          {state.checkout && (
            <>
              <Message
                type="bot"
                message="How many people (16+) will be travelling?"
              />
              <Input
                state={state}
                setState={setState}
                type="number"
                min={1}
                max={9}
                name="adults"
              />
            </>
          )}

          {!!state.adults && (
            <>
              <Message type="bot" message="How many rooms do you need?" />
              <Input
                state={state}
                setState={setState}
                type="number"
                defaultValue={0}
                min={0}
                max={9}
                name="rooms"
              />
            </>
          )}

          {!!state.rooms && (
            <>
              <Message type="bot" message="Almost there!" />
              <Message
                type="bot"
                message="Do you have any kids? Tell us their age."
              />
              <Input
                state={state}
                setState={setState}
                type="number"
                name="kids"
              />

              <Message type="bot" message="Do you have a promo code?" />
              <Input
                state={state}
                setState={setState}
                type="text"
                name="promocode"
              />

              {error && (
                <ResultsError error={error} />
              )}

              <button
                disabled={isLoading}
                onClick={handleSearch}
                className={cn(
                  "flex gap-5",
                  "justify-center items-center",
                  "bg-primary-500 text-white",
                  "rounded-3xl p-2",
                  "transition-all hover:opacity-80 active:scale-95",

                  isLoading && [
                    "bg-primary-700",
                    "cursor-not-allowed",
                    "opacity-70",
                  ]
                )}
              >
                <p>
                  {isLoading
                    ? "Searching for the best deals... 🚀"
                    : results?.length
                    ? "Let's search again! 🚀"
                    : "Let's search for the best deals for you! 🚀"}
                </p>

                {isLoading && <Loader />}
              </button>
            </>
          )}

          {results?.length && (
            <Results onClear={clearSearch} results={results} />
          )}
        </div>
      </div>
    </main>
  );
}
