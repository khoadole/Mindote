import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface CSVRow {
  level: string;
  topic_order: string;
  topic: string;
  temp_order: string;
  temp: string;
  pos: string;
  phonetic: string;
  definition: string;
  example: string;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.split("\n");
  const headers = lines[0].split(",");
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV properly handling quoted fields
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 9) {
      rows.push({
        level: values[0],
        topic_order: values[1],
        topic: values[2],
        temp_order: values[3],
        temp: values[4],
        pos: values[5],
        phonetic: values[6],
        definition: values[7],
        example: values[8] || "",
      });
    }
  }

  return rows;
}

async function importCEFRData() {
  const cefrDir = path.join(process.cwd(), "CEFR");
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  console.log("🚀 Starting CEFR data import...\n");

  // Clear existing data
  console.log("🗑️  Clearing existing CEFR data...");
  await prisma.cEFRWord.deleteMany();
  await prisma.cEFRTopic.deleteMany();
  console.log("✅ Cleared existing data\n");

  let totalTopics = 0;
  let totalWords = 0;

  for (const level of levels) {
    const filePath = path.join(cefrDir, `${level}.csv`);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      continue;
    }

    console.log(`📖 Processing ${level}.csv...`);
    const content = fs.readFileSync(filePath, "utf-8");
    const rows = parseCSV(content);

    // Group by topic
    const topicMap = new Map<
      string,
      { order: number; name: string; words: CSVRow[] }
    >();

    for (const row of rows) {
      const topicKey = `${row.topic_order}-${row.topic}`;
      if (!topicMap.has(topicKey)) {
        topicMap.set(topicKey, {
          order: parseInt(row.topic_order, 10),
          name: row.topic,
          words: [],
        });
      }
      topicMap.get(topicKey)!.words.push(row);
    }

    // Insert topics and words
    for (const [, topicData] of topicMap) {
      const topic = await prisma.cEFRTopic.create({
        data: {
          level,
          order: topicData.order,
          name: topicData.name,
        },
      });
      totalTopics++;

      // Insert words for this topic
      const wordData = topicData.words.map((row) => ({
        topicId: topic.id,
        order: parseInt(row.temp_order, 10) || 0,
        term: row.temp,
        pos: row.pos,
        phonetic: row.phonetic,
        definition: row.definition,
        example: row.example,
      }));

      await prisma.cEFRWord.createMany({
        data: wordData,
      });
      totalWords += wordData.length;
    }

    console.log(
      `   ✅ ${level}: ${topicMap.size} topics, ${rows.length} words`,
    );
  }

  console.log("\n🎉 Import completed!");
  console.log(`   📚 Total topics: ${totalTopics}`);
  console.log(`   📝 Total words: ${totalWords}`);
}

importCEFRData()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
