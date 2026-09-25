import type { SeedSkill } from "../types";
import { aiDataAnalysis } from "./ai-data-analysis";
import { aiWorkflowDesign } from "./ai-workflow-design";
import { promptEngineering } from "./prompt-engineering";

export { demoAttempts } from "./demo-history";

export const seedSkills: SeedSkill[] = [
  promptEngineering,
  aiWorkflowDesign,
  aiDataAnalysis,
];
