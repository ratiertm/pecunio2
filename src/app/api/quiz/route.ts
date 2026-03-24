import { NextRequest, NextResponse } from "next/server";
import { submitQuiz } from "@/lib/learning/engine";

export async function POST(req: NextRequest) {
  try {
    const { lesson_id, answers } = await req.json();

    if (!lesson_id || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "lesson_id and answers required" },
        { status: 400 }
      );
    }

    // TODO: get userId from Supabase auth session
    const userId = "demo-user";

    const result = await submitQuiz(userId, lesson_id, answers);

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
