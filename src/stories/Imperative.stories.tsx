import React from "react";
import I from "../components/Imperative";
import "../components/reset/style.css";

export default {
  title: "Lad Zappala/Imperative And Forward",
};

const Template = () => {
  return (
    <main>
      <div className="container">
        <I />
      </div>
    </main>
  );
};

export const ImperativeAndForward = Template.bind({});
