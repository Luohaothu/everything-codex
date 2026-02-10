"""
Models for the test project.
Contains intentional issues for security and pattern review testing.
"""

class User:
    """Simple user model (not a Django model - for testing only)."""

    def __init__(self, name, email, password):
        self.name = name
        self.email = email
        # BUG: storing plaintext password (intentional for security review testing)
        self.password = password

    def check_password(self, password):
        # BUG: plaintext comparison (intentional for security review)
        return self.password == password

    def to_dict(self):
        # BUG: exposes password in serialization (intentional for testing)
        return {
            'name': self.name,
            'email': self.email,
            'password': self.password,
        }


class Product:
    """Simple product model."""

    def __init__(self, name, price):
        self.name = name
        self.price = price

    # PATTERN ISSUE: no validation (intentional for testing)
    def apply_discount(self, percent):
        self.price = self.price * (1 - percent / 100)
        return self.price
