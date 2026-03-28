import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getUserId } from "@/lib/server-auth";
import prisma from "@/lib/prisma";
import { hasActiveSubscription } from "@/app/actions/lemonsqueezy";
import { logAIUsage } from "@/lib/ai-logger";
import { logActivity } from "@/lib/activity-logger";
import type { AIWritingResult } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FREE_DAILY_LIMIT = 3;
const MAX_ATTEMPTS_PER_PASSAGE = 3;

// GET: check current writing evaluation quota without consuming a use
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPremium = await hasActiveSubscription();

    if (isPremium) {
      return NextResponse.json({ isPremium: true, remainingUses: -1 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await prisma.aIUsage.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    const currentUsage = usage?.count ?? 0;
    const remainingUses = Math.max(0, FREE_DAILY_LIMIT - currentUsage);

    return NextResponse.json({ isPremium: false, remainingUses });
  } catch (error) {
    console.error("Writing usage check error:", error);
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { passageId, userText } = body as {
      passageId: string;
      userText: string;
    };

    if (!passageId || !userText) {
      return NextResponse.json(
        { error: "passageId and userText are required" },
        { status: 400 },
      );
    }

    const trimmed = userText.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

    if (wordCount < 10) {
      return NextResponse.json(
        { error: "Please write at least 10 words before evaluating." },
        { status: 400 },
      );
    }

    if (trimmed.length > 3000) {
      return NextResponse.json(
        { error: "Submission is too long. Please keep it under 600 words." },
        { status: 400 },
      );
    }

    // Fetch the passage
    const passage = await prisma.writingPassage.findUnique({
      where: { id: passageId, isPublished: true },
      select: { id: true, sourceText: true, level: true },
    });

    if (!passage) {
      return NextResponse.json(
        { error: "Writing passage not found" },
        { status: 404 },
      );
    }

    // Check premium (bypass rate limit for premium users)
    const isPremium = await hasActiveSubscription();

    let remainingUses = -1;

    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const usage = await prisma.aIUsage.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      const currentUsage = usage?.count ?? 0;

      if (currentUsage >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          {
            error: "Daily limit reached",
            message: `You've used all ${FREE_DAILY_LIMIT} free AI evaluations today. Upgrade to premium for unlimited access!`,
            remainingUses: 0,
            isPremium: false,
          },
          { status: 429 },
        );
      }

      remainingUses = FREE_DAILY_LIMIT - currentUsage - 1;
    }

    // Build AI prompt
    const systemPrompt = `You are a professional English writing coach evaluating an English text written by a Vietnamese language learner. Your goal is to give feedback that is genuinely helpful, specific, and encouraging — never discouraging. Every piece of feedback must be grounded in the student's actual words.

CRITICAL LANGUAGE REQUIREMENT: All feedback text you write (titles, explanations, summaries, encouragement, suggestions, etc.) MUST be in Vietnamese. The student is Vietnamese and needs to understand the feedback. Only the JSON field names (keys) stay in English. The "corrected" field stays in English because it contains the corrected English sentence. The "quote" field stays in English because it quotes the student's English text. Everything else — all explanatory text — must be written in Vietnamese.`;

    const userPrompt = `ĐỀ BÀI (tiếng Việt — nội dung học sinh được yêu cầu viết về):
${passage.sourceText}

BÀI VIẾT TIẾNG ANH CỦA HỌC SINH:
${trimmed}

SỐ TỪ: ${wordCount}
CẤP ĐỘ MỤC TIÊU: ${passage.level}

QUY TẮC ĐÁNH GIÁ:
1. Điều chỉnh theo độ dài bài viết:
   - Dưới 20 từ: 1 điểm mạnh, 1 điểm cần cải thiện, overallScore ≥ 4.0, giọng điệu rất khích lệ
   - 20–60 từ: 2 điểm mạnh, tối đa 2 điểm cần cải thiện
   - 60+ từ: tối đa 3 điểm mạnh, tối đa 3 điểm cần cải thiện

2. Phát hiện không viết tiếng Anh: Nếu học sinh viết chủ yếu bằng tiếng Việt hoặc ngôn ngữ khác, đặt điểm cần cải thiện đầu tiên là {title: "Hãy viết bằng tiếng Anh", original: [trích dẫn phần không phải tiếng Anh], corrected: "[bản dịch tiếng Anh của câu đó]", explanation: "Mục tiêu là luyện viết bằng tiếng Anh. Hãy thử diễn đạt ý tưởng của bạn trực tiếp bằng tiếng Anh — dù là câu đơn giản cũng rất tốt!"}.

3. Điểm mạnh (BẮT BUỘC — tìm ít nhất số lượng đã nêu dù bài viết yếu):
   - Luôn trích dẫn trực tiếp từ bài viết trong trường "quote"
   - Ví dụ điểm mạnh hợp lệ cho bài yếu: dùng đúng "because"/"and"/"but", chia động từ đúng một câu, câu mở đoạn rõ ràng, từ vựng cơ bản dùng đúng
   - Phải cụ thể: không phải "Từ vựng tốt" mà là "Bạn đã dùng đúng từ 'environment' trong ngữ cảnh"

4. Điểm cần cải thiện (ưu tiên: ngữ pháp > chính tả > rõ ràng > phong cách):
   - "original": trích dẫn chính xác từ bài viết cần sửa (KHÔNG TỰ BỊA)
   - "corrected": phiên bản đã sửa (viết bằng tiếng Anh)
   - "explanation": giải thích QUY TẮC ngữ pháp, không chỉ nêu sai ở đâu. Lý do tại sao rất quan trọng cho việc học.
   - Ví dụ: "Trong tiếng Anh, ngôi thứ 3 số ít ở thì hiện tại đơn cần thêm đuôi -s: 'she goes', không phải 'she go'. Quy tắc này áp dụng khi chủ ngữ là he/she/it."

5. Từ vựng:
   - "highlights": từ hoặc cụm từ học sinh dùng tốt (trích từ bài viết)
   - "suggestions": CHỈ gợi ý khi có từ thay thế rõ ràng tốt hơn. Tối đa 2 gợi ý.
   - "reason": lý do tại sao từ thay thế tốt hơn (viết bằng tiếng Việt)

6. Lời khích lệ (encouragement):
   - Phải cụ thể với bài viết của HỌC SINH này — không dùng câu chung chung
   - Kết thúc bằng MỘT lời khuyên cụ thể, có thể thực hiện ngay trong lần viết tiếp theo

7. lengthFeedback: Đặt null trừ khi bài quá ngắn (<20 từ) hoặc quá dài (>400 từ) — khi đó đưa ra lưu ý ngắn gọn, khích lệ.

Trả về CHỈ JSON hợp lệ, không có định dạng markdown:
{
  "overallScore": <number 0.0–10.0, one decimal>,
  "estimatedLevel": <"A1"|"A2"|"B1"|"B2"|"C1"|"C2">,
  "wordCount": <number>,
  "strengths": [{"title": <string — Vietnamese>, "detail": <string — Vietnamese>, "quote": <string — English quote from student>}],
  "improvements": [{"title": <string — Vietnamese>, "original": <string — English quote from student>, "corrected": <string — corrected English>, "explanation": <string — Vietnamese>}],
  "grammar": {"score": <number 0–10>, "summary": <string — Vietnamese>},
  "spelling": {"score": <number 0–10>, "errors": [{"original": <string — English>, "correction": <string — English>}]},
  "vocabulary": {"score": <number 0–10>, "highlights": [<string — English word quoted from student>], "suggestions": [{"original": <string — English>, "better": <string — English>, "reason": <string — Vietnamese>}]},
  "lengthFeedback": <string — Vietnamese | null>,
  "encouragement": <string — Vietnamese>
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from AI");
    }

    const aiResult: AIWritingResult = JSON.parse(responseContent);

    // Log AI usage
    if (completion.usage) {
      await logAIUsage({
        userId,
        feature: "writing-evaluate",
        model: "gpt-4o-mini",
        inputTokens: completion.usage.prompt_tokens,
        outputTokens: completion.usage.completion_tokens,
      });
    }

    // Increment daily usage for free users
    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.aIUsage.upsert({
        where: { userId_date: { userId, date: today } },
        update: { count: { increment: 1 } },
        create: { userId, date: today, count: 1 },
      });
    }

    // Save attempt
    const attempt = await prisma.writingAttempt.create({
      data: {
        userId,
        passageId,
        userText: trimmed,
        aiResult: aiResult as object,
        score: aiResult.overallScore,
      },
    });

    // Log learning activity for streak tracking
    await logActivity({
      userId,
      activityType: "writing_attempt",
    });

    // Keep only last MAX_ATTEMPTS_PER_PASSAGE attempts per (userId, passageId)
    const oldAttempts = await prisma.writingAttempt.findMany({
      where: { userId, passageId },
      orderBy: { completedAt: "desc" },
      skip: MAX_ATTEMPTS_PER_PASSAGE,
      select: { id: true },
    });

    if (oldAttempts.length > 0) {
      await prisma.writingAttempt.deleteMany({
        where: { id: { in: oldAttempts.map((a) => a.id) } },
      });
    }

    return NextResponse.json({
      success: true,
      data: { attempt, aiResult },
      isPremium,
      remainingUses: isPremium ? -1 : remainingUses,
      message: isPremium
        ? "Unlimited AI evaluations available"
        : remainingUses > 0
          ? `${remainingUses} evaluation${remainingUses === 1 ? "" : "s"} remaining today`
          : "Last free evaluation for today! Upgrade for unlimited access.",
    });
  } catch (error: unknown) {
    console.error("Writing evaluation error:", error);

    const err = error as { status?: number; message?: string };

    if (err?.status === 401) {
      return NextResponse.json(
        { error: "Invalid OpenAI API key" },
        { status: 500 },
      );
    }

    if (err?.status === 429) {
      return NextResponse.json(
        { error: "AI service rate limit reached. Please try again later." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to evaluate writing",
        message: err?.message || "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}
