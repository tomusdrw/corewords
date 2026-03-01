import csv
import os
import shutil

# -----------------------------------------------------------------------------
# 1. Syllabification Logic
# -----------------------------------------------------------------------------

VOWELS = set("aąeęioóuy")
DIGRAPHS = ["sz", "cz", "rz", "ch", "dż", "dz", "dź"]
COMMON_ONSETS = sorted([
    "wstrz", "wstr", "zmar", "zmarszcz",
    "str", "spr", "skr", "zdr", "pst", "tchn",
    "st", "sp", "sk", "sm", "sn", "sł", "sl", "sw", "sf",
    "pl", "pr", "bl", "br", "tl", "tr", "dl", "dr", "kl", "kr", "gl", "gr", "fl", "fr",
    "ch", "cz", "sz", "rz", "dz", "dż", "dź", "rz", "wr", "wz", "ws", "wl",
    "mn", "mł", "mr", "gn", "gm", "kn", "km", "pn",
    "zb", "zd", "zg", "zw"
], key=len, reverse=True)

def syllabify_polish(word):
    word = word.lower()
    
    nuclei = []
    i = 0
    while i < len(word):
        if word[i] in VOWELS:
            if word[i] == 'i' and i + 1 < len(word) and word[i+1] in VOWELS:
                pass
            else:
                nuclei.append(i)
        i += 1
        
    if not nuclei:
        return [word]
    if len(nuclei) == 1:
        return [word]

    syllables = []
    start = 0
    
    for k in range(len(nuclei) - 1):
        n1 = nuclei[k]
        n2 = nuclei[k+1]
        mid = word[n1+1 : n2]
        split_pos = 0
        
        if not mid:
            split_pos = n1 + 1
        else:
            suffix_len = 1
            found_onset = False
            for onset in COMMON_ONSETS:
                if mid.endswith(onset):
                    suffix_len = len(onset)
                    found_onset = True
                    break
            
            if not found_onset and len(mid) >= 2:
                 if mid[-2:] in DIGRAPHS:
                     suffix_len = 2

            if suffix_len > len(mid):
                suffix_len = len(mid)
            
            split_idx = len(mid) - suffix_len
            split_pos = n1 + 1 + split_idx
        
        syllables.append(word[start:split_pos])
        start = split_pos
        
    syllables.append(word[start:])
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
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rank = int(row['rank'])
                weight = 501 - rank
                words.append({
                    'word': row['word'],
                    'rank': rank,
                    'weight': weight,
                    'syllables': syllabify_polish(row['word'])
                })
    except FileNotFoundError:
        print("Input file not found.")
        return

    # Build Tree
    root = {'children': {}, 'weight': 0, 'word_info': None, 'count': 0}

    for entry in words:
        node = root
        node['weight'] += entry['weight']
        
        for i, syl in enumerate(entry['syllables']):
            if syl not in node['children']:
                node['children'][syl] = {'children': {}, 'weight': 0, 'word_info': None, 'count': 0}
            
            node = node['children'][syl]
            node['weight'] += entry['weight']
            
        node['word_info'] = {
            'rank': entry['rank'],
            'full_word': entry['word']
        }

    # Count Words in Subtree
    def calc_counts(node):
        c = 1 if node['word_info'] else 0
        for child in node['children'].values():
            c += calc_counts(child)
        node['count'] = c
        return c
    
    calc_counts(root)
    
    # Helper to find the single word in a 1-count subtree
    def get_single_word(node):
        if node['word_info']: return node['word_info']
        for child in node['children'].values():
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
        sorted_children = sorted(node['children'].items(), key=lambda x: x[1]['weight'], reverse=True)
        
        for syl, child_node in sorted_children:
            # COLLAPSE LOGIC: If count == 1, don't create subdirectory, just write full word
            if child_node['count'] == 1:
                w_info = get_single_word(child_node)
                if not w_info: continue # Should not happen
                
                row = {
                    'syllable': w_info['full_word'], # Full word instead of syllable segment
                    'weight': child_node['weight'],
                    'is_word': True,
                    'word_rank': w_info['rank'],
                    'full_word': w_info['full_word'],
                    'has_children': False # Collapsed
                }
                rows.append(row)
            else:
                # Normal branch (count > 1)
                has_children = True # By definition if count > 1
                queue.append((child_node, path_stack + [syl]))
                
                row = {
                    'syllable': syl,
                    'weight': child_node['weight'],
                    'is_word': bool(child_node['word_info']),
                    'word_rank': child_node['word_info']['rank'] if child_node['word_info'] else "",
                    'full_word': child_node['word_info']['full_word'] if child_node['word_info'] else "",
                    'has_children': has_children
                }
                rows.append(row)
            
        if rows or not path_stack:
            csv_path = os.path.join(current_dir, "syllables.csv")
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['syllable', 'weight', 'is_word', 'word_rank', 'full_word', 'has_children'])
                writer.writeheader()
                writer.writerows(rows)
            generated_files += 1

    print(f"Generated hierarchy in '{output_root}'. Total syllables.csv files: {generated_files}")

if __name__ == "__main__":
    process_core_words("core_words_pl.csv", "syllables_data")
