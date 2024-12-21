from app.database.graph_schema import set_connection
from neomodel import db

def main():
    set_connection()

    # Read the query from the file
    with open('../current_year_notes.cypher', 'r') as file:
        query = file.read()

    # Run the query
    results, meta = db.cypher_query(query)

    # Process and print the results
    for record in results:
        # Each record is expected to be a list with one element: a Node
        note = record[0]  # Access the first (and only) element of the record
        yse = record[1]
        # Safely extract properties from the note node
        note_name = note.get('name', 'N/A') if note else 'N/A'
        note_content = note.get('content', 'N/A') if note else 'N/A'
        yse_name =  yse.get('year_identifier', 'N/A') if yse else 'N/A'

        print(f"Year Success Evidence: {yse_name}")
        print(f"Note Name: {note_name}")
        print(f"Content: {note_content}")
        print("-" * 40)

if __name__ == '__main__':
    main()
