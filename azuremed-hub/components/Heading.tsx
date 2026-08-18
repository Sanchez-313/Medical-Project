/** Faithful port of Medical_Product/src/components/Heading/Heading.jsx. */
export default function Heading({ highlight, heading }: { highlight: string; heading: string }) {
  return (
    <div className="w-fit mx-auto text-center">
      <h2 className="md:text-5xl text-[2.5rem] font-bold">
        <span className="text-indigo-500">{highlight}</span> {heading}
      </h2>
      <div className="w-24 h-1 bg-indigo-300 md:mt-6 mt-3 ml-auto" />
    </div>
  );
}
