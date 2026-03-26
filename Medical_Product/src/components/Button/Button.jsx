import React from "react";
import { Link } from "react-router-dom";

const Button = (props) => {
  if (props.to) {
    return (
      <Link
        to={props.to}
        className="inline-block bg-gradient-to-b from-indigo-400 to-indigo-600 text-white px-8 py-3 rounded-lg md:text-lg text-md hover:scale-105 hover:bg-gradient-to-b hover:to-amber-400 transition-all duration-300 cursor-pointer"
      >
        {props.content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      className="bg-gradient-to-b from-indigo-400 to-indigo-600 text-white px-8 py-3 rounded-lg md:text-lg text-md hover:scale-105 hover:bg-gradient-to-b hover:to-amber-400 transition-all duration-300 cursor-pointer"
    >{props.content}</button>
  );
};

export default Button;
