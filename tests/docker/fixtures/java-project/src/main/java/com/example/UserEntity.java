/**
 * Simple JPA entity for testing.
 * Contains intentional pattern issues for JPA review testing.
 */
package com.example;

public class UserEntity {

    private Long id;
    private String name;
    private String email;
    // BUG: storing password in plain text (intentional for testing)
    private String password;

    public UserEntity() {}

    public UserEntity(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    // ISSUE: No equals/hashCode override (intentional for JPA pattern testing)
    // ISSUE: No toString override

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
