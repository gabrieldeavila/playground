import React from "react";
import A from "../components/Axios/p2";
import "../components/reset/style.css";

export default {
  title: "Lad Zappala/Axios P2",
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

export const AxiosP2 = Template.bind({});
