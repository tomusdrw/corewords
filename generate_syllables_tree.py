import csv
import os
import shutil

import pyphen

# -----------------------------------------------------------------------------
# 1. Syllabification Logic
# -----------------------------------------------------------------------------

syllabifier = pyphen.Pyphen(lang="pl_PL")


def syllabify_polish(word):
    word = word.lower()
    hyphenated = syllabifier.inserted(word)
    if not hyphenated or "-" not in hyphenated:
        return [word]

    syllables = [segment for segment in hyphenated.split("-") if segment]
    return syllables


# -----------------------------------------------------------------------------
# 2. Tree Building and Export
# -----------------------------------------------------------------------------


def process_core_words(input_file, output_root):
    if os.path.exists(output_root):
        shutil.rmtree(output_root)
    os.makedirs(output_root)

    words = []
    try:
        with open(input_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rank = int(row["rank"])
                weight = 501 - rank
                words.append(
                    {
                        "word": row["word"],
                        "rank": rank,
                        "weight": weight,
                        "emoji": row.get("emoji", ""),
                        "pos": row.get("pos", "noun"),
                        "syllables": syllabify_polish(row["word"]),
                    }
                )
    except FileNotFoundError:
        print("Input file not found.")
        return

    # Build Tree
    root = {"children": {}, "weight": 0, "word_info": None, "count": 0}

    for entry in words:
        node = root
        node["weight"] += entry["weight"]

        for i, syl in enumerate(entry["syllables"]):
            if syl not in node["children"]:
                node["children"][syl] = {
                    "children": {},
                    "weight": 0,
                    "word_info": None,
                    "count": 0,
                }

            node = node["children"][syl]
            node["weight"] += entry["weight"]

        node["word_info"] = {
            "rank": entry["rank"],
            "full_word": entry["word"],
            "emoji": entry["emoji"],
            "pos": entry["pos"],
        }

    # Count Words in Subtree
    def calc_counts(node):
        c = 1 if node["word_info"] else 0
        for child in node["children"].values():
            c += calc_counts(child)
        node["count"] = c
        return c

    calc_counts(root)

    # Helper to find the single word in a 1-count subtree
    def get_single_word(node):
        if node["word_info"]:
            return node["word_info"]
        for child in node["children"].values():
            return get_single_word(child)
        return None

    # Recursive Export
    queue = [(root, [])]
    generated_files = 0

    while queue:
        node, path_stack = queue.pop(0)

        current_dir = os.path.join(output_root, *path_stack)
        os.makedirs(current_dir, exist_ok=True)

        rows = []
        sorted_children = sorted(
            node["children"].items(), key=lambda x: x[1]["weight"], reverse=True
        )

        for syl, child_node in sorted_children:
            # COLLAPSE LOGIC: If count == 1, don't create subdirectory, just write full word
            if child_node["count"] == 1:
                w_info = get_single_word(child_node)
                if not w_info:
                    continue  # Should not happen

                row = {
                    "syllable": w_info[
                        "full_word"
                    ],  # Full word instead of syllable segment
                    "weight": child_node["weight"],
                    "is_word": True,
                    "word_rank": w_info["rank"],
                    "full_word": w_info["full_word"],
                    "emoji": w_info["emoji"],
                    "pos": w_info.get("pos", "noun"),
                    "has_children": False,  # Collapsed
                }
                rows.append(row)
            else:
                # Normal branch (count > 1)
                has_children = True  # By definition if count > 1
                queue.append((child_node, path_stack + [syl]))

                row = {
                    "syllable": syl,
                    "weight": child_node["weight"],
                    "is_word": bool(child_node["word_info"]),
                    "word_rank": child_node["word_info"]["rank"]
                    if child_node["word_info"]
                    else "",
                    "full_word": child_node["word_info"]["full_word"]
                    if child_node["word_info"]
                    else "",
                    "emoji": child_node["word_info"]["emoji"]
                    if child_node["word_info"]
                    else "",
                    "pos": child_node["word_info"]["pos"]
                    if child_node["word_info"]
                    else "",
                    "has_children": has_children,
                }
                rows.append(row)

        if rows or not path_stack:
            csv_path = os.path.join(current_dir, "syllables.csv")
            with open(csv_path, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(
                    f,
                    fieldnames=[
                        "syllable",
                        "weight",
                        "is_word",
                        "word_rank",
                        "full_word",
                        "emoji",
                        "pos",
                        "has_children",
                    ],
                )
                writer.writeheader()
                writer.writerows(rows)
            generated_files += 1

    print(
        f"Generated hierarchy in '{output_root}'. Total syllables.csv files: {generated_files}"
    )


if __name__ == "__main__":
    process_core_words("core_words_pl.csv", "syllables_data")
