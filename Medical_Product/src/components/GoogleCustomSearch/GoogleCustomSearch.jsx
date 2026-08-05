import React, { useEffect, useId } from "react";

const CSE_SCRIPT_ID = "google-cse-script";
const CSE_SRC = "https://cse.google.com/cse.js?cx=6594be309be8f4a1a";

const GoogleCustomSearch = () => {
  const reactId = useId();
  const searchId = `google-cse-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    window.__gcse = {
      ...(window.__gcse || {}),
      parsetags: "explicit",
    };

    const renderSearch = () => {
      const target = document.getElementById(searchId);
      if (!target || target.dataset.rendered === "true") return;
      if (!window.google?.search?.cse?.element) return;

      window.google.search.cse.element.render({
        div: searchId,
        tag: "search",
      });
      target.dataset.rendered = "true";
    };

    const existingScript = document.getElementById(CSE_SCRIPT_ID);
    if (existingScript) {
      renderSearch();
      existingScript.addEventListener("load", renderSearch);
      return () => existingScript.removeEventListener("load", renderSearch);
    }

    const script = document.createElement("script");
    script.id = CSE_SCRIPT_ID;
    script.src = CSE_SRC;
    script.async = true;
    script.addEventListener("load", renderSearch);
    document.head.appendChild(script);

    return () => script.removeEventListener("load", renderSearch);
  }, [searchId]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div
        id={searchId}
        className="gcse-search rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      />
    </section>
  );
};

export default GoogleCustomSearch;
