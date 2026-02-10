"""Tests for the test project."""
import unittest
from models import User, Product


class TestUser(unittest.TestCase):
    def test_create_user(self):
        user = User('Alice', 'alice@example.com', 'secret123')
        self.assertEqual(user.name, 'Alice')

    def test_check_password(self):
        user = User('Alice', 'alice@example.com', 'secret123')
        self.assertTrue(user.check_password('secret123'))
        self.assertFalse(user.check_password('wrong'))

    def test_to_dict_exposes_password(self):
        """This test documents the security bug."""
        user = User('Alice', 'alice@example.com', 'secret123')
        data = user.to_dict()
        # This assertion passes but the behavior is a security issue
        self.assertIn('password', data)


class TestProduct(unittest.TestCase):
    def test_apply_discount(self):
        product = Product('Widget', 100)
        result = product.apply_discount(10)
        self.assertAlmostEqual(result, 90.0)

    def test_negative_discount(self):
        """BUG: No validation allows negative discounts."""
        product = Product('Widget', 100)
        result = product.apply_discount(-50)
        # This increases the price, which is likely unintended
        self.assertAlmostEqual(result, 150.0)


if __name__ == '__main__':
    unittest.main()
