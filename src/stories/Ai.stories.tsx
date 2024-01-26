import React from "react";
import A from "../components/Ai";
import "../components/reset/style.css";

export default {
  title: "Lad Zappala/Ai",
};

const Template = () => {
  return (
    <main>
      <div className="container">
        <A />
      </div>
    </main>
  );
};

export const Ai = Template.bind({});
