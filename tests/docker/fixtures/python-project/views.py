"""
Views for the test project.
Contains intentional SQL injection and CSRF vulnerabilities for security testing.
"""


def get_user_by_name(name, db_cursor):
    """
    BUG: SQL injection vulnerability (intentional for security review testing).
    """
    query = f"SELECT * FROM users WHERE name = '{name}'"
    db_cursor.execute(query)
    return db_cursor.fetchone()


def update_user_email(user_id, new_email, db_cursor):
    """
    BUG: No CSRF protection, no input validation (intentional for testing).
    """
    query = f"UPDATE users SET email = '{new_email}' WHERE id = {user_id}"
    db_cursor.execute(query)


def render_profile(user):
    """
    BUG: XSS vulnerability - unescaped user input (intentional for testing).
    """
    return f"<h1>Welcome, {user['name']}</h1><p>{user['bio']}</p>"
