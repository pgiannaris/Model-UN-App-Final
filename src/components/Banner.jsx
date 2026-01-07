import React from "react";

const Banner = (props) => {
  return (
    <section className="flex min-h-24 items-center justify-center bg-blue-500 text-center text-white">
      <div className="container mx-auto max-w-3xl">
        <h2 className="mb-2 text-3xl font-bold">{props.title}</h2>
      </div>
    </section>
  );
};

export default Banner;
