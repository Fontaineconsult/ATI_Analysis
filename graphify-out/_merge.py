import json
import glob
from pathlib import Path
from graphify.cache import save_semantic_cache

# Real per-chunk token usage from Agent tool results (subagent_tokens)
TOKENS = {
    1: 114348, 2: 53089, 3: 83970, 4: 19170, 5: 18788,
    6: 19334, 7: 20858, 8: 20820, 9: 23046,
}


def load(p):
    return json.loads(Path(p).read_text(encoding='utf-8-sig'))


# --- Back-fill token counts into each chunk ---
for n, tok in TOKENS.items():
    cp = Path('graphify-out/.graphify_chunk_{:02d}.json'.format(n))
    if cp.exists():
        d = load(cp)
        d['output_tokens'] = tok
        d['input_tokens'] = d.get('input_tokens', 0)
        cp.write_text(json.dumps(d, indent=2, ensure_ascii=False), encoding='utf-8')

# --- Merge all chunks -> semantic_new ---
chunks = sorted(glob.glob('graphify-out/.graphify_chunk_*.json'))
all_nodes, all_edges, all_hyper = [], [], []
total_in, total_out = 0, 0
for c in chunks:
    d = load(c)
    all_nodes += d.get('nodes', [])
    all_edges += d.get('edges', [])
    all_hyper += d.get('hyperedges', [])
    total_in += d.get('input_tokens', 0)
    total_out += d.get('output_tokens', 0)

semantic_new = {
    'nodes': all_nodes, 'edges': all_edges, 'hyperedges': all_hyper,
    'input_tokens': total_in, 'output_tokens': total_out,
}
print('Merged {} chunks: {} nodes, {} edges, {} hyperedges'.format(
    len(chunks), len(all_nodes), len(all_edges), len(all_hyper)))

# --- Save to extraction cache ---
saved = save_semantic_cache(all_nodes, all_edges, all_hyper)
print('Cached {} files'.format(saved))

# --- Merge cached + new (no prior cache here) -> semantic ---
seen = set()
deduped = []
for nd in all_nodes:
    if nd['id'] not in seen:
        seen.add(nd['id'])
        deduped.append(nd)
semantic = {
    'nodes': deduped, 'edges': all_edges, 'hyperedges': all_hyper,
    'input_tokens': total_in, 'output_tokens': total_out,
}
Path('graphify-out/.graphify_semantic.json').write_text(
    json.dumps(semantic, indent=2, ensure_ascii=False), encoding='utf-8')

# --- Part C: merge AST + semantic -> extract ---
ast = load('graphify-out/.graphify_ast.json')
seen = {n['id'] for n in ast['nodes']}
merged_nodes = list(ast['nodes'])
for nd in deduped:
    if nd['id'] not in seen:
        merged_nodes.append(nd)
        seen.add(nd['id'])
merged = {
    'nodes': merged_nodes,
    'edges': ast['edges'] + all_edges,
    'hyperedges': all_hyper,
    'input_tokens': total_in,
    'output_tokens': total_out,
}
Path('graphify-out/.graphify_extract.json').write_text(
    json.dumps(merged, indent=2, ensure_ascii=False), encoding='utf-8')
print('FINAL extract: {} nodes ({} AST + {} semantic), {} edges, {} hyperedges'.format(
    len(merged_nodes), len(ast['nodes']), len(deduped), len(merged['edges']), len(all_hyper)))
print('Tokens: {} in / {} out'.format(total_in, total_out))
