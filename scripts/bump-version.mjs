import {execSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkgPath = join(root, 'package.json');

function getDiffStat() {
	try {
		const stat = execSync('git diff --cached --shortstat', {encoding: 'utf8'}).trim();
		if (!stat) {
			const workStat = execSync('git diff HEAD --shortstat', {encoding: 'utf8'}).trim();
			if (!workStat) return 0;
			const ins = parseInt(workStat.match(/(\d+) insertion/)?.[1] || '0', 10);
			const del = parseInt(workStat.match(/(\d+) deletion/)?.[1] || '0', 10);
			return ins + del;
		}
		const insertions = parseInt(stat.match(/(\d+) insertion/)?.[1] || '0', 10);
		const deletions = parseInt(stat.match(/(\d+) deletion/)?.[1] || '0', 10);
		return insertions + deletions;
	} catch {
		return 0;
	}
}

const linesChanged = getDiffStat();
if (linesChanged === 0) {
	console.log('ℹ️ Изменений не обнаружено, пропуск обновления версии.');
	process.exit(0);
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
let [major, minor, patch, build] = pkg.version.split('.').map(Number);

// Если строк больше 5000 — это форматирование или лок-файл, не считаем это эпиком
if (linesChanged > 5000) {
	build++;
	console.log(`👽 Аномальный объем (${linesChanged} стр.) Скорее всего Prettier. -> Build ++`);
} else if (linesChanged > 2000) {
	minor++;
	patch = 0;
	build = 0;
	console.log(`🚀 Эпические изменения (${linesChanged} стр.) -> Minor ++`);
} else if (linesChanged > 500) {
	patch++;
	build = 0;
	console.log(`📦 Солидный коммит (${linesChanged} стр.) -> Patch ++`);
} else {
	build++;
	console.log(`🛠 Рабочие правки (${linesChanged} стр.) -> Build ++`);
}

pkg.version = [major, minor, patch, build].join('.');
writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t') + '\n');
console.log(`✅ Версия обновлена до: ${pkg.version}`);

try {
	execSync('git add package.json', {cwd: root});
} catch (e) {
	console.warn('⚠️ Не удалось выполнить git add package.json');
}
