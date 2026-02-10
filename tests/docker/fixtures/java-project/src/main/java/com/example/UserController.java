/**
 * Simple Spring Boot controller for testing.
 * Contains intentional issues for security and pattern review.
 */
package com.example;

// Simulated Spring annotations (no actual Spring dependency needed for static analysis)

public class UserController {

    /**
     * BUG: SQL injection vulnerability (intentional for security testing).
     */
    public String findUser(String name) {
        String query = "SELECT * FROM users WHERE name = '" + name + "'";
        return query; // Would execute against DB in real app
    }

    /**
     * BUG: No input validation, no authorization check (intentional for testing).
     */
    public String deleteUser(int userId) {
        String query = "DELETE FROM users WHERE id = " + userId;
        return query;
    }

    /**
     * BUG: Hardcoded credentials (intentional for security testing).
     */
    public boolean authenticate(String username, String password) {
        String adminPassword = "admin123";
        return "admin".equals(username) && adminPassword.equals(password);
    }
}
