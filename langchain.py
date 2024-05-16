import spacy
from langchain.graphs import Graph
import matplotlib.pyplot as plt
import networkx as nx


# Load NLP model
nlp = spacy.load("en_core_web_sm")

def extract_entities_relations(text):
    doc = nlp(text)
    entities_relations = []
    for ent in doc.ents:
        for token in ent:
            if token.dep_ in ('attr', 'dobj'):
                subject = [w for w in token.head.lefts if w.dep_ == 'nsubj']
                if subject:
                    entities_relations.append((str(subject[0]), str(token.head), str(ent)))
    return entities_relations

def create_knowledge_graph(entities_relations):
    graph = Graph()
    for subj, verb, obj in entities_relations:
        graph.add_edge(subj, obj, {"relation": verb})
    return graph

# Example text (replace with your extracted text)
text = "Alice works at Acme Corp. Bob, who is a software engineer, also works at Acme Corp."

# Extract entities and relations
entities_relations = extract_entities_relations(text)

# Create knowledge graph
knowledge_graph = create_knowledge_graph(entities_relations)

# Visualize the graph (optional)
G = nx.DiGraph()
for edge in knowledge_graph.edges:
    G.add_edge(edge[0], edge[1], label=edge[2]["relation"])

pos = nx.spring_layout(G)
nx.draw(G, pos, with_labels=True, node_color='skyblue', node_size=2000, edge_color='black')
labels = nx.get_edge_attributes(G,'label')
nx.draw_networkx_edge_labels(G, pos, edge_labels=labels)
plt.show()