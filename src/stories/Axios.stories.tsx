import React from "react";
import A from "../components/Axios";
import "../components/reset/style.css";

export default {
  title: "Lad Zappala/Axios",
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

export const Axios = Template.bind({});
