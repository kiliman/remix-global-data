import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const [showError, setShowError] = useState(false);
  if (showError) {
    throw new Error("Oops from client");
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        <li>
          <Link to="/error">Throw Error</Link>
        </li>
        <li>
          <Link to="/error?message=Bad+Request&status=400">
            Throw Response 400
          </Link>
        </li>
        <li>
          <Link to="/not-found">Not Found</Link>
        </li>
        <li>
          <button
            onClick={() => {
              setShowError(true);
            }}
          >
            Throw client error
          </button>
        </li>
      </ul>
    </div>
  );
}
