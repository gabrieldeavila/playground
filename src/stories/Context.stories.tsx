import React from "react";
import C from "../components/Context";
import "../components/reset/style.css";

export default {
  title: "Lad Zappala/Context",
};

const Template = () => {
  return (
    <main>
      <div className="container">
        <C />
      </div>
    </main>
  );
};

export const Context = Template.bind({});
