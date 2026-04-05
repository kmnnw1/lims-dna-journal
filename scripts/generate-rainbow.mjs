import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const targetDir = path.join(rootDir, 'github_rainbow');

// Тот самый список фейковых расширений
const extensions = [
	'fake_1c', 'fake_abap', 'fake_actionscript', 'fake_ada', 'fake_agda', 'fake_alloy', 'fake_ampl',
	'fake_antlr', 'fake_apache', 'fake_apex', 'fake_apl', 'fake_applescript', 'fake_arc', 'fake_arduino',
	'fake_asciidoc', 'fake_asn1', 'fake_asp', 'fake_assembly', 'fake_astro', 'fake_autohotkey', 'fake_autoit',
	'fake_awk', 'fake_ballerina', 'fake_batchfile', 'fake_befunge', 'fake_bison', 'fake_bitbake', 'fake_blade',
	'fake_blitzbasic', 'fake_boo', 'fake_brainfuck', 'fake_brightscript', 'fake_c', 'fake_csharp', 'fake_cpp',
	'fake_capnproto', 'fake_ceylon', 'fake_chapel', 'fake_chuck', 'fake_clarion', 'fake_clojure', 'fake_cmake',
	'fake_cobol', 'fake_coffeescript', 'fake_coldfusion', 'fake_commonlisp', 'fake_coq', 'fake_crystal',
	'fake_css', 'fake_cuda', 'fake_cython', 'fake_d', 'fake_dafny', 'fake_dart', 'fake_dockerfile',
	'fake_dogescript', 'fake_dylan', 'fake_e', 'fake_eagle', 'fake_elixir', 'fake_elm', 'fake_emacslisp',
	'fake_erlang', 'fake_fsharp', 'fake_factor', 'fake_forth', 'fake_fortran', 'fake_gdscript', 'fake_glsl',
	'fake_go', 'fake_graphql', 'fake_groovy', 'fake_hack', 'fake_haml', 'fake_haskell', 'fake_haxe',
	'fake_hcl', 'fake_hlsl', 'fake_html', 'fake_hy', 'fake_idl', 'fake_idris', 'fake_inform7', 'fake_io',
	'fake_j', 'fake_java', 'fake_javascript', 'fake_jinja', 'fake_jq', 'fake_julia', 'fake_jupyter',
	'fake_kotlin', 'fake_lean', 'fake_less', 'fake_lex', 'fake_lisp', 'fake_livescript', 'fake_llvm',
	'fake_logo', 'fake_lolcode', 'fake_lua', 'fake_makefile', 'fake_markdown', 'fake_mathematica',
	'fake_matlab', 'fake_mercury', 'fake_moonscript', 'fake_nemerle', 'fake_nim', 'fake_nix',
	'fake_objectivec', 'fake_objectivecpp', 'fake_ocaml', 'fake_openscad', 'fake_oz', 'fake_pascal',
	'fake_pawn', 'fake_perl', 'fake_php', 'fake_pony', 'fake_powershell', 'fake_processing', 'fake_prolog',
	'fake_pug', 'fake_puppet', 'fake_purebasic', 'fake_purescript', 'fake_python', 'fake_qml', 'fake_r',
	'fake_racket', 'fake_raku', 'fake_reason', 'fake_red', 'fake_ruby', 'fake_rust', 'fake_sass',
	'fake_scala', 'fake_scheme', 'fake_scss', 'fake_shell', 'fake_shen', 'fake_smalltalk', 'fake_solidity',
	'fake_sql', 'fake_squirrel', 'fake_stata', 'fake_stylus', 'fake_svelte', 'fake_swift', 'fake_systemverilog',
	'fake_tcl', 'fake_tex', 'fake_thrift', 'fake_typescript', 'fake_vala', 'fake_verilog', 'fake_vhdl',
	'fake_viml', 'fake_visualbasic', 'fake_vue', 'fake_webassembly', 'fake_whitespace', 'fake_xml',
	'fake_yaml', 'fake_zig'
];

// Текст для веса (Linguist считает проценты по байтам)
// Повторяем строку, чтобы файл весил около 1 КБ
const dummyContent = `This is a dummy file generated to paint GitHub statistics.
Linguist library requires files to have some byte size to calculate the percentage.
All glory to the rainbow stat bar! 🌈\n\n`.repeat(10);

console.log('🚀 Запуск генератора радуги для GitHub...');

// Создаем папку, если ее нет
if (!fs.existsSync(targetDir)) {
	fs.mkdirSync(targetDir, { recursive: true });
}

let created = 0;

extensions.forEach((ext, index) => {
	const fileName = `color_${index + 1}.${ext}`;
	const filePath = path.join(targetDir, fileName);
	
	try {
		fs.writeFileSync(filePath, dummyContent, 'utf8');
		created++;
	} catch (err) {
		console.error(`❌ Ошибка при создании ${fileName}:`, err.message);
	}
});

console.log(`\n✅ Успешно создано ${created} файлов в папке /github_rainbow/!`);
console.log('Не забудь добавить настройки в .gitattributes перед коммитом.');
