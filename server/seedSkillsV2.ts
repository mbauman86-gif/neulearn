/**
 * V2 skill seed (Phase 1, 2026-05-04).
 *
 * The legacy K2_SKILLS seed in seedSkills.ts has one big "Digraphs" skill that covers
 * all 5 consonant digraphs together. The V2 reading templates target each digraph
 * separately — digraph_sh / digraph_ch / digraph_th / digraph_wh / digraph_ck — so the
 * progression engine can track per-digraph mastery and the daily-queue engine can
 * surface the right one when the child isn't yet proficient on a specific blend.
 *
 * This module is idempotent: it checks each skill by name and inserts only if absent.
 * Runs unconditionally on server start (after the legacy seedSkills) so missing skills
 * are filled in without disrupting the 182 already there.
 */
import { db } from "./db";
import { skills } from "@shared/schema";
import { eq } from "drizzle-orm";

interface V2Skill {
  subject: "READING";
  strand: string;
  gradeLevel: string;
  name: string;
  description: string;
  orderInStrand: number;
  /**
   * Skill names this skill depends on. Resolved at insert time — if the prerequisite
   * doesn't exist (yet), it's silently skipped so we don't fail-loud on missing skills.
   */
  prerequisiteSkillNames?: string[];
}

const V2_READING_SKILLS: V2Skill[] = [
  // Per-digraph phonics skills. Prerequisites point at "Letter-Sound Correspondence"
  // and "CVC Word Reading" which are already in the K2_SKILLS legacy seed.
  {
    subject: "READING",
    strand: "phonics",
    gradeLevel: "1",
    name: "digraph_sh",
    description: "Decode words containing the consonant digraph 'sh' (ship, fish, shovel)",
    orderInStrand: 10,
    prerequisiteSkillNames: ["CVC Word Reading", "Letter-Sound Correspondence"],
  },
  {
    subject: "READING",
    strand: "phonics",
    gradeLevel: "1",
    name: "digraph_ch",
    description: "Decode words containing the consonant digraph 'ch' (chip, beach, chocolate)",
    orderInStrand: 11,
    prerequisiteSkillNames: ["CVC Word Reading", "Letter-Sound Correspondence"],
  },
  {
    subject: "READING",
    strand: "phonics",
    gradeLevel: "1",
    name: "digraph_th",
    description: "Decode words containing the consonant digraph 'th' (thin, math, thunder)",
    orderInStrand: 12,
    prerequisiteSkillNames: ["CVC Word Reading", "Letter-Sound Correspondence"],
  },
  {
    subject: "READING",
    strand: "phonics",
    gradeLevel: "1",
    name: "digraph_wh",
    description: "Decode words containing the consonant digraph 'wh' (when, whale, whisper)",
    orderInStrand: 13,
    prerequisiteSkillNames: ["CVC Word Reading", "Letter-Sound Correspondence"],
  },
  {
    subject: "READING",
    strand: "phonics",
    gradeLevel: "1",
    name: "digraph_ck",
    description: "Decode words ending in the digraph 'ck' (duck, rock, blanket)",
    orderInStrand: 14,
    prerequisiteSkillNames: ["CVC Word Reading", "Letter-Sound Correspondence"],
  },

  // Sight-word recognition. Doesn't decode by phonics rules, so it depends on basic
  // letter-sound work but not on the digraphs.
  {
    subject: "READING",
    strand: "fluency",
    gradeLevel: "1",
    name: "sight_words_first_25",
    description:
      "Recognize the first 25 high-frequency sight words instantly, both in isolation and inside a sentence",
    orderInStrand: 10,
    prerequisiteSkillNames: ["Letter-Sound Correspondence"],
  },
];

export async function seedV2Skills(): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const v2skill of V2_READING_SKILLS) {
    const existing = await db.select().from(skills).where(eq(skills.name, v2skill.name)).limit(1);
    if (existing[0]) {
      skipped++;
      continue;
    }

    // Resolve prerequisites by name → id. Silently drop any that don't exist so we
    // don't bail on missing dependencies.
    const prereqIds: string[] = [];
    if (v2skill.prerequisiteSkillNames) {
      for (const prereqName of v2skill.prerequisiteSkillNames) {
        const [prereq] = await db.select().from(skills).where(eq(skills.name, prereqName)).limit(1);
        if (prereq) prereqIds.push(prereq.id);
      }
    }

    await db.insert(skills).values({
      subject: v2skill.subject,
      strand: v2skill.strand,
      gradeLevel: v2skill.gradeLevel,
      name: v2skill.name,
      description: v2skill.description,
      orderInStrand: v2skill.orderInStrand,
      prerequisiteSkillIds: prereqIds,
    });
    inserted++;
  }

  return { inserted, skipped };
}
