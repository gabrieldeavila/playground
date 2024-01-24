import React from "react";
import P from "../components/Portal";
import "../components/reset/style.css";

export default {
  title: "Lad Zappala/Portal",
};

const Template = () => {
  return (
    <main>
      <div className="container">
        <P />
      </div>
    </main>
  );
};

export const Portal = Template.bind({});
