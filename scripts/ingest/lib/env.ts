import { config } from "dotenv";
import path from "node:path";

// Scripts rodam fora do runtime do Next.js, então .env.local não é
// carregado automaticamente — precisa ser o primeiro import de qualquer
// entrypoint (run.ts). Em CI (GitHub Actions), as variáveis já vêm do
// ambiente via secrets e este load é um no-op silencioso.
config({ path: path.resolve(process.cwd(), ".env.local") });
