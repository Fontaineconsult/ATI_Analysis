import os
from urllib.parse import urlparse

from pyvis.network import Network
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

# Create a PyVis network instance
net = Network(height="750px", width="100%", bgcolor="#222222", font_color="white")

# Set advanced visualization options
net.set_options("""
var options = {
  "nodes": {
    "borderWidth": 2,
    "borderWidthSelected": 3,
    "chosen": true,
    "font": {
      "size": 14,
      "face": "arial",
      "color": "white"
    }
  },
  "edges": {
    "color": {"color": "#888"},
    "smooth": {
      "type": "continuous"
    },
    "arrows": {
      "to": {
        "enabled": true,
        "scaleFactor": 0.8
      }
    },
    "selectionWidth": 3
  },
  "interaction": {
    "dragNodes": true,
    "hover": true,
    "navigationButtons": true,
    "zoomView": true,
    "tooltipDelay": 200
  },
  "physics": {
    "enabled": true,
    "forceAtlas2Based": {
      "gravitationalConstant": -50,
      "centralGravity": 0.02,
      "springLength": 120,
      "springConstant": 0.08
    },
    "minVelocity": 0.75,
    "solver": "forceAtlas2Based"
  }
}
""")

with driver.session() as session:
    results = session.run(query)
    for record in results:
        workingGroupName = record["workingGroup"]
        goals = record["goals"]

        # Add the working group node (blue diamond)
        net.add_node(
            workingGroupName,
            label=f"Working Group: {workingGroupName}",
            color="blue",
            shape="diamond",
            title="A Working Group within the ATI structure"
        )

        # Iterate over goals
        for g in goals:
            goal_node = g["goal"]
            goal_name = goal_node.get("name", "Unnamed Goal")

            # Add goal node (green star)
            net.add_node(
                goal_name,
                label=f"Goal: {goal_name}",
                color="green",
                shape="star",
                title="An institutional Goal"
            )
            # Link working group to goal
            net.add_edge(workingGroupName, goal_name, title="responsible_for")

            indicators = g.get("indicators", [])
            for ind_data in indicators:
                indicator_node = ind_data["indicator"]
                indicator_name = indicator_node.get("name", "Unnamed Indicator")

                # Add indicator node (orange dot)
                net.add_node(
                    indicator_name,
                    label=f"Indicator: {indicator_name}",
                    color="orange",
                    shape="dot",
                    title="A Success Indicator supporting the Goal"
                )
                # Link goal to indicator
                net.add_edge(goal_name, indicator_name, title="supported_by")

                evidences = ind_data.get("evidences", [])
                for ev_data in evidences:
                    evidence_node = ev_data["evidence"]
                    if evidence_node:
                        evidence_id = evidence_node.get("id", "Unknown Evidence")

                        # Add evidence node (red triangle)
                        net.add_node(
                            evidence_id,
                            label=f"Evidence: {evidence_id}",
                            color="red",
                            shape="triangle",
                            title="Year-specific Evidence supporting the Indicator"
                        )
                        # Link indicator to evidence
                        net.add_edge(indicator_name, evidence_id, title="tracks")

            # Add accomplishments (purple square) if any
            accomplishments = g.get("accomplishments", [])
            for acc in accomplishments:
                if acc:
                    acc_id = acc.get("id", "Unknown Accomplishment")
                    net.add_node(
                        acc_id,
                        label=f"Accomplishment: {acc_id}",
                        color="#9932CC",  # purple
                        shape="square",
                        title="Accomplishment related to the Goal in the given academic year"
                    )
                    net.add_edge(goal_name, acc_id, title="advances_goal")

            # Add plans (teal box) if any
            plans = g.get("plans", [])
            for plan in plans:
                if plan:
                    plan_id = plan.get("id", "Unknown Plan")
                    net.add_node(
                        plan_id,
                        label=f"Plan: {plan_id}",
                        color="teal",
                        shape="box",
                        title="Plan related to the Goal in the given academic year"
                    )
                    net.add_edge(goal_name, plan_id, title="furthers_goal")

# Save and display graph
net.show("graph.html", notebook=False)
