import type { Metadata } from "next";
import { SelfAppraisalPage } from "./self-appraisal-page";

export const metadata: Metadata = {
  title: "Self-Appraisal · Merit",
  description: "Submit your self-appraisal for the open review cycle.",
};

export default function Page() {
  return <SelfAppraisalPage />;
}
