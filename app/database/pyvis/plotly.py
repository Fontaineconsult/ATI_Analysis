import os
from urllib.parse import urlparse

import networkx as nx
import plotly.graph_objects as go
from neo4j import GraphDatabase

# Path to the .cypher file (resolved relative to this file)
cypher_file = os.path.join(os.path.dirname(__file__), "..", "batch", "master_wg.cypher")

# Read the Cypher query from the file
with open(cypher_file, "r") as file:
    query = file.read()

# Connect to Neo4j. Credentials come from the DATABASE_URL env var
# (e.g. bolt://user:pass@host:7687) — never hardcode them.
_parsed = urlparse(os.environ.get("DATABASE_URL", "bolt://localhost:7687"))
driver = GraphDatabase.driver(
    f"{_parsed.scheme}://{_parsed.hostname}:{_parsed.port or 7687}",
    auth=(_parsed.username or "neo4j", _parsed.password or ""),
)

# We'll build a NetworkX graph first
G = nx.DiGraph()

# Helper function to add a node if not already present
def add_node_with_category(node_id, label, category):
    if node_id not in G.nodes:
        # Store only category, label is no longer displayed
        G.add_node(node_id, category=category)

with driver.session() as session:
    results = session.run(query)
    for record in results:
        workingGroupName = record["workingGroup"]
        goals = record["goals"]

        # Add working group node (category: WG)
        add_node_with_category(workingGroupName, f"Working Group: {workingGroupName}", "working_group")

        for g in goals:
            goal_node = g["goal"]
            goal_name = goal_node.get("name", "Unnamed Goal")

            add_node_with_category(goal_name, f"Goal: {goal_name}", "goal")
            G.add_edge(workingGroupName, goal_name, relationship="responsible_for")

            indicators = g.get("indicators", [])
            for ind_data in indicators:
                indicator_node = ind_data["indicator"]
                indicator_name = indicator_node.get("name", "Unnamed Indicator")

                add_node_with_category(indicator_name, f"Indicator: {indicator_name}", "indicator")
                G.add_edge(goal_name, indicator_name, relationship="supported_by")

                evidences = ind_data.get("evidences", [])
                for ev_data in evidences:
                    evidence_node = ev_data["evidence"]
                    if evidence_node:
                        evidence_id = evidence_node.get("id", "Unknown Evidence")

                        add_node_with_category(evidence_id, f"Evidence: {evidence_id}", "evidence")
                        G.add_edge(indicator_name, evidence_id, relationship="tracks")

            # Add accomplishments
            accomplishments = g.get("accomplishments", [])
            for acc in accomplishments:
                if acc:
                    acc_id = acc.get("id", "Unknown Accomplishment")
                    add_node_with_category(acc_id, f"Accomplishment: {acc_id}", "accomplishment")
                    G.add_edge(goal_name, acc_id, relationship="advances_goal")

            # Add plans
            plans = g.get("plans", [])
            for plan in plans:
                if plan:
                    plan_id = plan.get("id", "Unknown Plan")
                    add_node_with_category(plan_id, f"Plan: {plan_id}", "plan")
                    G.add_edge(goal_name, plan_id, relationship="furthers_goal")

# Compute positions for the nodes
pos = nx.spring_layout(G, k=0.5, seed=42)

# Separate nodes by category for plotting
categories = {
    "working_group": {"color": "rgba(0, 0, 255, 0.8)"},      # Blue
    "goal": {"color": "rgba(0, 128, 0, 0.8)"},               # Green
    "indicator": {"color": "rgba(255, 165, 0, 0.8)"},        # Orange
    "evidence": {"color": "rgba(255, 0, 0, 0.8)"},           # Red
    "accomplishment": {"color": "rgba(128, 0, 128, 0.8)"},   # Purple
    "plan": {"color": "rgba(0, 128, 128, 0.8)"}              # Teal
}

# Prepare edge traces
edge_x = []
edge_y = []
for edge in G.edges():
    x0, y0 = pos[edge[0]]
    x1, y1 = pos[edge[1]]
    edge_x += [x0, x1, None]
    edge_y += [y0, y1, None]

edge_trace = go.Scatter(
    x=edge_x, y=edge_y,
    line=dict(width=1, color='rgba(200,200,200,0.4)'),
    hoverinfo='none',
    mode='lines'
)

# Prepare node traces for each category
node_traces = []
for cat, style in categories.items():
    x_nodes = []
    y_nodes = []
    # We'll use hoverinfo='none' to not display node name, just category
    # but to identify category, we'll use a legend entry
    for node, data in G.nodes(data=True):
        if data["category"] == cat:
            x_nodes.append(pos[node][0])
            y_nodes.append(pos[node][1])

    node_trace = go.Scatter(
        x=x_nodes, y=y_nodes,
        mode='markers',
        hoverinfo='none',  # no node name on hover
        marker=dict(
            color=style["color"],
            size=12,
            symbol='circle',
            line=dict(width=1, color='rgba(0,0,0,0.3)')
        ),
        name=cat.capitalize()
    )
    node_traces.append(node_trace)

# Create the figure with a black background
fig = go.Figure(
    data=[edge_trace] + node_traces,
    layout=go.Layout(
        title='ATI Working Groups - Visual Network',
        title_x=0.5,
        showlegend=True,
        hovermode='closest',
        margin=dict(b=20,l=5,r=5,t=40),
        plot_bgcolor='black',
        paper_bgcolor='black',
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
    )
)

# Add an annotation with instructions
fig.update_layout(annotations=[
    dict(
        text="Color = Node Type<br>Drag nodes to rearrange<br>Scroll/Pinch to zoom",
        showarrow=False,
        xref="paper",
        yref="paper",
        x=0,
        y=-0.1,
        font=dict(color='white')
    )
])

fig.show()
