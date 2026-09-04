from ai.query_understanding import understand_query


def understand_user_query(query: str) -> dict:
    """Use Member 5's AI query-understanding module."""
    return understand_query(query)