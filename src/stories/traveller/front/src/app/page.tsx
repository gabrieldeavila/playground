"use client";

import NextImage from "@/components/NextImage";
import Decoration from "./components/decoration";
import ArrowLink from "@/components/links/ArrowLink";
import { IoMdArrowRoundDown } from "react-icons/io";
import { useCallback, useRef } from "react";
import Background1 from "@/components/svgs/background1";
import DissolutusLogo from "@/components/svgs/dissolutus";
import ButtonLink from "@/components/links/ButtonLink";
import Stack from "./components/stack";
import Background2 from "@/components/svgs/background2";
import UnstyledLink from "@/components/links/UnstyledLink";
import { BsNintendoSwitch } from "react-icons/bs";

export default function HomePage() {
  const stackRef = useRef<HTMLDivElement | null>(null);

  const addScroll = useCallback(() => {
    stackRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <main>
      <Decoration />

      <section className="relative bg-dark text-white">
        <div className="layout relative flex min-h-screen flex-col items-center justify-center text-center">
          <h1 className="z-10 max-w-4xl bg-dark md:text-6xl">
            i create web experiences that make people feel deeply connected.
          </h1>

          <div className="mt-10 flex items-center gap-10 max-md:flex-col">
            <div className="flex items-center justify-center">
              <div className="overflow-hidden rounded-full border-4 border-primary-500">
                <NextImage
                  useSkeleton
                  className="w-32 md:w-40"
                  src="/images/me.jpeg"
                  width="180"
                  height="180"
                  alt="Me"
                />
              </div>
            </div>

            <div className="z-10 flex flex-col items-start gap-2 bg-dark">
              <h3> hey there folks!</h3>
              <p className="text-left">
                <span className="mb-2.5 block">
                  I am Gabriel Ávila, a <strong>front-end web developer</strong>{" "}
                  dedicated to fostering creativity on the web.{" "}
                </span>
                <span className="block ">
                  I am always looking for new challenges and opportunities to
                  learn and grow.
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-[42%] z-10 sm:bottom-10 sm:left-1/2">
          <button
            onClick={addScroll}
            className="animate-bounce rounded-full bg-primary-500 bg-stone-700 p-3 text-2xl text-white shadow-lg"
          >
            <IoMdArrowRoundDown size={20} />
          </button>
        </div>
      </section>

      <Stack ref={stackRef} />

      <section className="radial-purple relative z-10 flex min-h-screen flex-col justify-center p-10 py-12 text-slate-200">
        <div className="flex max-sm:flex-col-reverse">
          <div className="flex flex-grow flex-col justify-center">
            <p className="relative pt-8 font-extralight italic opacity-25">
              Reading Experience
              <DissolutusLogo className="absolute inset-0" />
            </p>
            <h2 className="mt-3 text-4xl">Dissolutus</h2>
            <p className="mt-7">
              A web application for Enhanced Reading and Writing experiences
            </p>

            <ArrowLink
              className="animated-yellow mt-5 w-fit text-yellow-600"
              href="https://www.dissolutus.com/en-US/scribere"
            >
              Visit the project
            </ArrowLink>
          </div>

          <div className="relative flex items-center justify-center max-sm:mb-10">
            <Background1 className="absolute scale-100 md:scale-150 lg:scale-[2] xl:scale-[2.5] 2xl:scale-[3]" />

            <NextImage
              useSkeleton
              className="z-10 max-md:w-96 max-sm:w-72"
              src="/images/dissolutus.png"
              width="904"
              height="602"
              alt="Icon"
            />
          </div>
        </div>
      </section>

      <section className="radial-green relative z-10 flex min-h-screen min-h-screen flex-col justify-center p-10 py-12 text-slate-200">
        <div className="flex max-sm:flex-col-reverse">
          <div className="relative flex items-center justify-center max-sm:mb-10">
            <Background1
              mainColor="#163326"
              bigBubbles="#11644c"
              smallBubbles="#618f88"
              className="absolute scale-100 md:scale-150 lg:scale-[2] xl:scale-[2.5] 2xl:scale-[3]"
            />

            <NextImage
              useSkeleton
              className="z-10 max-md:w-96 max-sm:w-72"
              src="/images/gtdesign.png"
              width="904"
              height="602"
              alt="Icon"
            />
          </div>

          <div className="flex flex-grow flex-col items-end justify-center">
            <p className="relative pt-8 font-extralight italic opacity-25">
              Front-end toolkit
            </p>
            <h2 className="mt-3 text-4xl">GT Design</h2>
            <p className="mt-7">
              A React component library for building forms and data entry
            </p>

            <p className="mt-2.5">
              <strong>Built with:</strong> React, Styled Components, Storybook,
              and Chromatic
            </p>

            <ArrowLink
              className="animated-yellow mt-5 w-fit text-yellow-600"
              href="https://6404fabceae243628422dfbc-aeiuqgveau.chromatic.com/?path=/story/data-entry-inputs-all-with-prev-values--all-with-prev-values"
            >
              Visit the project
            </ArrowLink>

            <ArrowLink
              className="animated-yellow mt-2.5 w-fit text-yellow-600"
              href="https://github.com/gabrieldeavila/gt-design"
            >
              View the code
            </ArrowLink>
          </div>
        </div>
      </section>

      <section className="radial-blue relative z-10 flex min-h-screen flex-col justify-center p-10 py-12 text-slate-200">
        <div className="flex max-sm:flex-col-reverse">
          <div className="flex flex-grow flex-col justify-center">
            <p className="relative pt-8 font-extralight italic opacity-25">
              A 3D Game with Mario (can you spot the portfolio?)
              <BsNintendoSwitch className="absolute inset-0" />
            </p>
            <h2 className="mt-3 text-4xl">NightmareFolio</h2>
            <p className="mt-7">
            </p>

            <ArrowLink
              className="animated-yellow mt-5 w-fit text-yellow-600"
              href="https://nightmare-folio.vercel.app/mario"
            >
              Visit the project
            </ArrowLink>
            <ArrowLink
              className="animated-yellow mt-2.5 w-fit text-yellow-600"
              href="https://github.com/gabrieldeavila/nightmare-folio"
            >
              View the code
            </ArrowLink>
          </div>

          <div className="relative flex items-center justify-center max-sm:mb-10">
            <Background1
              mainColor="#2d3956"
              smallBubbles="#3a7499"
              bigBubbles="#1c4b6d"
              className="absolute scale-100 md:scale-150 lg:scale-[2] xl:scale-[2.5] 2xl:scale-[3]"
            />

            <NextImage
              useSkeleton
              className="z-10 max-md:w-96 max-sm:w-72"
              src="/images/mario.png"
              width="904"
              height="602"
              alt="Icon"
            />
          </div>
        </div>
      </section>

      <section className="align-center relative flex min-h-screen justify-center bg-dark text-white">
        <div className="max-md:flex-col container relative z-10 flex items-center justify-center gap-10 md:justify-around">
          <Background2 className="max-sm:scale-90 max-lg:scale-100  scale-[2.5]" />
          <div className="flex flex-col gap-5 bg-dark max-sm:max-w-72">
            <h2>What are you waiting for?</h2>
            <p>Let's build something great together!</p>
            <p>You can reach me at:</p>
            <UnstyledLink
              className="text-yellow-600"
              href="mailto:gabrieleboneavila@gmail.com"
            >
              gabrieleboneavila@gmail.com
            </UnstyledLink>
          </div>
        </div>
      </section>
    </main>
  );
}
