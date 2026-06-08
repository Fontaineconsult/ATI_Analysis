import json
from pathlib import Path
from collections import defaultdict

detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8'))
files = detect.get('files', {})


def keep(f):
    nf = f.replace('\\', '/')
    return '/graphify-out/' not in nf


docs = [f for f in files.get('document', []) if keep(f)]
papers = [f for f in files.get('paper', []) if keep(f)]
images = [f for f in files.get('image', []) if keep(f)]

# Group text docs+papers by parent dir to keep related files together
bydir = defaultdict(list)
for f in docs + papers:
    bydir[str(Path(f).parent)].append(f)

# Pack into chunks of up to 22, directory-aware
CHUNK = 22
text_chunks = []
cur = []
for dirp in sorted(bydir):
    for f in bydir[dirp]:
        cur.append(f)
        if len(cur) >= CHUNK:
            text_chunks.append(cur)
            cur = []
if cur:
    text_chunks.append(cur)

# Each image gets its own chunk (vision needs separate context)
image_chunks = [[img] for img in images]

all_chunks = text_chunks + image_chunks

# Write chunk file lists
for i, ch in enumerate(all_chunks, 1):
    Path('graphify-out/.graphify_chunklist_{:02d}.txt'.format(i)).write_text(
        '\n'.join(ch), encoding='utf-8')

print('Text files: {} -> {} chunks'.format(len(docs) + len(papers), len(text_chunks)))
print('Image files: {} -> {} chunks'.format(len(images), len(image_chunks)))
print('TOTAL CHUNKS: {}'.format(len(all_chunks)))
for i, ch in enumerate(all_chunks, 1):
    kind = 'IMG' if (len(ch) == 1 and ch[0] in images) else 'TXT'
    print('CHUNK {:02d} [{}] {} files'.format(i, kind, len(ch)))