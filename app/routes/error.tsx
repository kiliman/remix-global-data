import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (url.searchParams.has("status")) {
    throw new Response(url.searchParams.get("message"), {
      status: Number(url.searchParams.get("status")),
    });
  }
  throw new Error("Oops!");
}

export default function Component() {
  return <div></div>;
}
