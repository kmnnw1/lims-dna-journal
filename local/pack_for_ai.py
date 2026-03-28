import os

# Режим по манифесту: не зависит от git — явный список файлов в local/pack_manifest.txt
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
MANIFEST_FILE = os.path.join(SCRIPT_DIR, "pack_manifest.txt")
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "context_for_ai.txt")
VERSION_FILE = os.path.join(PROJECT_DIR, "VERSION")

# Устаревший обход каталога, если манифеста нет
ALLOWED_EXTENSIONS = {".ts", ".tsx", ".prisma", ".css"}
IGNORE_DIRS = {"node_modules", ".next", "out", "build", ".git", "local"}


def read_manifest_paths():
    if not os.path.isfile(MANIFEST_FILE):
        return None
    paths = []
    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            paths.append(line.replace("/", os.sep))
    return paths if paths else None


def write_version_header(out_file):
    """Первая строка VERSION — «эпоха» (напр. 4.0), вторая — semver пакета (как в package.json)."""
    if os.path.isfile(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r", encoding="utf-8") as vf:
                lines = [
                    ln.strip()
                    for ln in vf.read().splitlines()
                    if ln.strip() and not ln.strip().startswith("#")
                ]
            if not lines:
                return
            epic = lines[0]
            pkg = lines[1] if len(lines) > 1 else ""
            if pkg:
                out_file.write(
                    f"# Lab Journal — контекст для ИИ (по сути {epic}; package {pkg})\n\n"
                )
            else:
                out_file.write(f"# Lab Journal — контекст для ИИ (по сути {epic})\n\n")
        except OSError:
            pass


def pack_from_manifest(paths, out_file):
    missing = []
    root_abs = os.path.abspath(PROJECT_DIR)
    for rel in paths:
        file_path = os.path.abspath(os.path.join(PROJECT_DIR, rel))
        if not (file_path == root_abs or file_path.startswith(root_abs + os.sep)):
            print(f"Пропуск (вне проекта): {rel}")
            continue
        if not os.path.isfile(file_path):
            missing.append(rel)
            continue
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"Ошибка чтения {file_path}: {e}")
            continue
        out_file.write(f"\n\n--- START OF FILE {rel.replace(os.sep, '/')} ---\n\n")
        out_file.write(content)
        out_file.write(f"\n\n--- END OF FILE {rel.replace(os.sep, '/')} ---\n")
    if missing:
        print("Отсутствуют файлы из манифеста:")
        for m in missing:
            print(f"  - {m}")


def pack_walk_legacy(out_file):
    print(
        "Внимание: нет local/pack_manifest.txt — используется обход каталога (лучше создать манифест)."
    )
    for root, dirs, files in os.walk(PROJECT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext not in ALLOWED_EXTENSIONS:
                continue
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, PROJECT_DIR)
            if file in [
                "next-env.d.ts",
                "postcss.config.mjs",
                "tailwind.config.ts",
            ]:
                continue
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                out_file.write(f"\n\n--- START OF FILE {rel_path} ---\n\n")
                out_file.write(content)
                out_file.write(f"\n\n--- END OF FILE {rel_path} ---\n")
            except Exception as e:
                print(f"Ошибка чтения {file_path}: {e}")


def pack_project():
    os.makedirs(SCRIPT_DIR, exist_ok=True)
    paths = read_manifest_paths()
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out_file:
        write_version_header(out_file)
        if paths is not None:
            pack_from_manifest(paths, out_file)
        else:
            pack_walk_legacy(out_file)
    print(f"Готово: {OUTPUT_FILE}")


if __name__ == "__main__":
    pack_project()
