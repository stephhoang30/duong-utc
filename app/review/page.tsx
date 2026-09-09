"use client";

import "./review.css";
import { BoyaReviewDeck } from "@/components/boya-review-deck";
import { PageSkeleton } from "@/components/ui";
import { usePlanner } from "@/lib/planner-context";

export default function ReviewPage() {
  const { state, ready } = usePlanner();
  if (!ready) return <PageSkeleton />;

  return <div className="page review-page"><BoyaReviewDeck initialLesson={state.boyaCurrentLesson} /></div>;
}
