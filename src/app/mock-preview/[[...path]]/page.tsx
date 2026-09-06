import { notFound } from "next/navigation";
import { DemoApp } from "../../../components/demo/DemoApp";
import "../../a2.css";
import "../../../components/demo/demo.css";

export default function MockPreview() {
  if (process.env.WORKLOU_MOCK_PREVIEW !== "1") notFound();
  return <DemoApp />;
}
