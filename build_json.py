import csv
import json
import os


def build_json_tree(root_dir):
    """Recursively build a JSON tree from the syllables_data directory."""

    def process_directory(dir_path, relative_path=""):
        csv_path = os.path.join(dir_path, "syllables.csv")

        if not os.path.exists(csv_path):
            return None

        items = []
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                item = {
                    "syllable": row["syllable"],
                    "weight": int(row["weight"]),
                    "is_word": row["is_word"].lower() == "true",
                    "word_rank": int(row["word_rank"]) if row["word_rank"] else None,
                    "full_word": row["full_word"],
                    "has_children": row["has_children"].lower() == "true",
                }

                # If has children, recursively process subdirectory
                if item["has_children"]:
                    subdir_name = row["syllable"]
                    # Sanitize directory name for filesystem
                    safe_name = subdir_name.replace(" ", "_")
                    subdir_path = os.path.join(dir_path, safe_name)

                    if os.path.exists(subdir_path):
                        children = process_directory(
                            subdir_path, os.path.join(relative_path, safe_name)
                        )
                        if children:
                            # If this item is also a word, add it as the first selectable option
                            if item["is_word"]:
                                word_option = {
                                    "syllable": item["syllable"],
                                    "weight": item["weight"],
                                    "is_word": True,
                                    "word_rank": item["word_rank"],
                                    "full_word": item["full_word"],
                                    "has_children": False,
                                }
                                children.insert(0, word_option)
                            item["children"] = children
                items.append(item)

        return items

    return process_directory(root_dir)


if __name__ == "__main__":
    root_dir = "syllables_data"
    output_file = "app/data.json"

    # Ensure app directory exists
    os.makedirs("app", exist_ok=True)

    print("Building JSON tree from CSV files...")
    tree = build_json_tree(root_dir)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(tree, f, ensure_ascii=False, indent=2)

    print(f"✓ Built {output_file}")
    print(f"  Total root items: {len(tree)}")
